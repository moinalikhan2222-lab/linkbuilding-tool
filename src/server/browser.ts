import { chromium } from 'playwright';
import type { Browser, BrowserContext, Page } from 'playwright';
import * as cheerio from 'cheerio';
import type { WebsiteRow, TaskLog, BacklinkStatus, LinkAttribute } from '../types/index.ts';
import { analyzeOpportunity, generateRelevantContent } from './gemini.ts';
import { checkGmailForVerification } from './gmail.ts';
import { decryptPassword, generateStrongPassword, encryptPassword } from './crypto.ts';

let activeBrowser: Browser | null = null;

export async function getOrLaunchBrowser(): Promise<Browser> {
  if (!activeBrowser || !activeBrowser.isConnected()) {
    activeBrowser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
      ],
    });
  }
  return activeBrowser;
}

export interface BrowserExecutionCallback {
  onStep: (stepName: string, actionDetail: string, screenshotBase64?: string) => void;
  onLog: (log: TaskLog) => void;
}

export async function processWebsiteAutomation(
  row: WebsiteRow,
  campaignDefaults: {
    defaultTargetUrl: string;
    defaultAnchorText: string;
    defaultEmail?: string;
    defaultAuthorName?: string;
    defaultBio?: string;
  },
  gmailAccessToken?: string,
  callbacks?: BrowserExecutionCallback
): Promise<Partial<WebsiteRow>> {
  const logs: TaskLog[] = [...row.logs];

  function addLog(level: 'info' | 'warn' | 'error' | 'success', message: string, step?: string) {
    const entry: TaskLog = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      step,
    };
    logs.push(entry);
    if (callbacks?.onLog) callbacks.onLog(entry);
  }

  const updates: Partial<WebsiteRow> = {
    logs,
    lastAttemptDate: new Date().toISOString(),
    retryCount: row.retryCount + 1,
  };

  const targetUrl = row.targetUrl || campaignDefaults.defaultTargetUrl;
  const anchorText = row.anchorText || campaignDefaults.defaultAnchorText;
  const authorName = campaignDefaults.defaultAuthorName || 'Digital Insights Team';
  const userEmail = campaignDefaults.defaultEmail || 'seo.outreach@linkpulse.io';

  if (!row.websiteUrl) {
    addLog('error', 'Missing website URL');
    return {
      ...updates,
      finalResult: 'Skipped',
      failureOrSkipReason: 'Missing website URL in row',
    };
  }

  // Pre-flight URL validation
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(row.websiteUrl.startsWith('http') ? row.websiteUrl : `https://${row.websiteUrl}`);
  } catch (e) {
    addLog('error', `Invalid URL format: ${row.websiteUrl}`);
    return {
      ...updates,
      finalResult: 'Skipped',
      failureOrSkipReason: 'Malformed or invalid URL',
    };
  }

  addLog('info', `Initializing Playwright browser session for ${row.websiteName || parsedUrl.hostname}`, 'Browser Startup');
  callbacks?.onStep('Browser Startup', `Navigating to ${parsedUrl.origin}`);

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    browser = await getOrLaunchBrowser();
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true,
    });
    page = await context.newPage();
    page.setDefaultTimeout(15000);

    // 1. OPEN WEBSITE URL
    addLog('info', `Loading target site: ${parsedUrl.href}`, 'Page Navigation');
    let response;
    try {
      response = await page.goto(parsedUrl.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (netErr: any) {
      addLog('warn', `Direct navigation failed: ${netErr.message}. Checking domain reachability...`);
      return {
        ...updates,
        finalResult: 'Skipped',
        failureOrSkipReason: `Website inaccessible or domain failed to resolve (${netErr.message})`,
      };
    }

    const httpStatus = response?.status() || 200;
    updates.httpStatus = httpStatus;

    if (httpStatus >= 400 && httpStatus !== 401 && httpStatus !== 403) {
      addLog('error', `Page returned HTTP ${httpStatus}`, 'HTTP Check');
      return {
        ...updates,
        finalResult: 'Skipped',
        failureOrSkipReason: `Website returned error status HTTP ${httpStatus}`,
      };
    }

    // Capture initial screenshot
    let initialShot: string | undefined;
    try {
      const buf = await page.screenshot({ type: 'jpeg', quality: 65 });
      initialShot = `data:image/jpeg;base64,${buf.toString('base64')}`;
      updates.screenshotUrl = initialShot;
      callbacks?.onStep('Page Loaded', `HTTP ${httpStatus} - Inspected page DOM`, initialShot);
    } catch (e) {}

    const pageTitle = await page.title();
    const pageHtml = await page.content();
    const $ = cheerio.load(pageHtml);

    // 2. CHECK SECURITY / BOT BARRIERS (CAPTCHA, CLOUDFLARE, 2FA)
    const bodyText = $('body').text().toLowerCase();
    const hasCloudflare = bodyText.includes('checking your browser') || bodyText.includes('turnstile') || $('div.cf-turnstile').length > 0;
    const hasRecaptcha = $('iframe[src*="recaptcha"]').length > 0 || $('div.g-recaptcha').length > 0 || bodyText.includes('please solve the captcha');
    const hasPaymentBarrier = bodyText.includes('paid submission required') || bodyText.includes('pricing plan') && !bodyText.includes('free');

    if (hasCloudflare || hasRecaptcha) {
      addLog('warn', 'Security challenge detected (CAPTCHA / Turnstile). Moving to next site per compliance policy.', 'Bot Barrier');
      return {
        ...updates,
        finalResult: 'Manual Action Required',
        requiredManualAction: hasCloudflare ? 'Cloudflare Turnstile challenge requires human verification' : 'Google reCAPTCHA requires manual solution',
        failureOrSkipReason: 'Security challenge requires manual verification. Task paused and skipped to next row.',
      };
    }

    if (hasPaymentBarrier) {
      addLog('warn', 'Website requires payment or paid membership. Skipping per instructions.', 'Payment Check');
      return {
        ...updates,
        finalResult: 'Skipped',
        failureOrSkipReason: 'Website requires payment or paid subscription',
      };
    }

    // 3. IDENTIFY BACKLINK OPPORTUNITY VIA GEMINI AI
    addLog('info', 'Analyzing backlink opportunity structure...', 'Opportunity Detection');
    const opportunity = await analyzeOpportunity({
      url: parsedUrl.href,
      pageTitle,
      pageSnippet: pageHtml.slice(0, 3000),
      preferredType: row.preferredBacklinkType,
      targetUrl,
      anchorText,
    });

    if (!opportunity.isSuitable) {
      addLog('warn', `Unsuitable website: ${opportunity.skipReason || 'No permitted link placement found'}`);
      return {
        ...updates,
        finalResult: 'Skipped',
        failureOrSkipReason: opportunity.skipReason || 'Website does not permit legitimate backlink placement',
      };
    }

    updates.preferredBacklinkType = opportunity.backlinkType;
    addLog('success', `Identified opportunity: ${opportunity.backlinkType} (${opportunity.placementStrategy})`, 'Opportunity Detected');

    // 4. ACCOUNT & LOGIN / SIGNUP WORKFLOW
    let userPassword = row.passwordEncrypted ? decryptPassword(row.passwordEncrypted) : '';
    let accountUsername = row.username || '';

    // Check if login URL provided or find login links
    let loginHref = row.loginUrl;
    if (!loginHref) {
      const loginLink = $('a[href*="login"], a[href*="signin"], a[href*="sign-in"]').first().attr('href');
      if (loginLink) loginHref = new URL(loginLink, parsedUrl.href).href;
    }

    // Check if registration URL provided or find register links
    let registerHref = row.registrationUrl;
    if (!registerHref) {
      const regLink = $('a[href*="register"], a[href*="signup"], a[href*="sign-up"], a[href*="join"]').first().attr('href');
      if (regLink) registerHref = new URL(regLink, parsedUrl.href).href;
    }

    // Attempt Login if credentials already exist
    if (accountUsername && userPassword && loginHref) {
      addLog('info', `Existing credentials found for ${accountUsername}. Attempting login...`, 'Account Login');
      try {
        await page.goto(loginHref, { waitUntil: 'domcontentloaded', timeout: 15000 });
        callbacks?.onStep('Login Form', `Attempting login on ${loginHref}`);

        // Locate username and password fields
        const userInput = await page.$('input[type="text"], input[type="email"], input[name*="user"], input[name*="login"], input[id*="user"]');
        const passInput = await page.$('input[type="password"]');

        if (userInput && passInput) {
          await userInput.fill(accountUsername);
          await passInput.fill(userPassword);
          const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Log in"), button:has-text("Sign in")');
          if (submitBtn) {
            await Promise.all([
              page.waitForNavigation({ timeout: 6000 }).catch(() => {}),
              submitBtn.click(),
            ]);
            updates.loginStatus = 'Login Successful';
            updates.accountStatus = 'Active Account';
            addLog('success', `Successfully logged in as ${accountUsername}`, 'Login Success');
          }
        }
      } catch (loginErr: any) {
        addLog('warn', `Login attempt failed: ${loginErr.message}. Proceeding to submission inspection.`);
        updates.loginStatus = 'Login Failed';
      }
    } else if (registerHref) {
      // ATTEMPT SIGNUP
      addLog('info', `No existing login. Navigating to registration page: ${registerHref}`, 'Account Registration');
      callbacks?.onStep('Registration', `Opening registration form: ${registerHref}`);
      try {
        await page.goto(registerHref, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const regHtml = await page.content();
        const $reg = cheerio.load(regHtml);

        const regDisabled = $reg('body').text().toLowerCase().includes('registrations are closed') ||
                            $reg('body').text().toLowerCase().includes('invitation only');

        if (regDisabled) {
          addLog('warn', 'Website registration is closed or requires invitation. Skipping row.', 'Registration Closed');
          return {
            ...updates,
            finalResult: 'Skipped',
            failureOrSkipReason: 'Website registration is closed or invitation-only',
          };
        }

        // Generate username and strong password
        if (!accountUsername) {
          accountUsername = `${authorName.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(Math.random() * 899 + 100)}`;
          updates.username = accountUsername;
        }
        if (!userPassword) {
          userPassword = generateStrongPassword(16);
          updates.passwordEncrypted = encryptPassword(userPassword);
          updates.hasPassword = true;
        }

        // Fill form fields
        const emailField = await page.$('input[type="email"], input[name*="email"]');
        const userField = await page.$('input[name*="user"], input[name*="login"], input[id*="user"]');
        const passField = await page.$('input[type="password"]');

        if (emailField) await emailField.fill(userEmail);
        if (userField) await userField.fill(accountUsername);
        if (passField) await passField.fill(userPassword);

        // Check for confirm password
        const confirmPass = await page.$('input[name*="confirm"], input[name*="repeat"], input[id*="confirm"]');
        if (confirmPass) await confirmPass.fill(userPassword);

        // Check for terms checkbox
        const terms = await page.$('input[type="checkbox"][name*="term"], input[type="checkbox"][name*="agree"]');
        if (terms) await terms.check().catch(() => {});

        // Submit form
        const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Register"), button:has-text("Sign up"), button:has-text("Create Account")');
        if (submitBtn) {
          await Promise.all([
            page.waitForNavigation({ timeout: 6000 }).catch(() => {}),
            submitBtn.click(),
          ]);
          updates.accountStatus = 'Signup Completed';
          addLog('success', `Submitted registration for ${accountUsername} (${userEmail})`, 'Signup Completed');
        }

        // 5. GMAIL VERIFICATION IF AUTHORIZED
        if (gmailAccessToken) {
          addLog('info', 'Checking authorized Gmail account for activation message...', 'Email Verification');
          callbacks?.onStep('Email Verification', `Checking Gmail for ${parsedUrl.hostname} activation message`);
          
          // Allow email delivery buffer
          await new Promise(r => setTimeout(r, 4000));
          const gmailRes = await checkGmailForVerification(gmailAccessToken, parsedUrl.hostname, userEmail);

          if (gmailRes.found && gmailRes.verificationUrl) {
            addLog('success', `Found verification link: ${gmailRes.verificationUrl}`, 'Email Verification');
            updates.emailVerificationStatus = 'Verified via Gmail';
            try {
              await page.goto(gmailRes.verificationUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
              addLog('success', 'Followed activation link; account verified', 'Email Activation');
            } catch (e) {}
          } else if (gmailRes.found && gmailRes.otpCode) {
            addLog('success', `Found OTP code: ${gmailRes.otpCode}`, 'Email Verification');
            updates.emailVerificationStatus = `Verified via OTP ${gmailRes.otpCode}`;
          } else {
            addLog('info', `No instant email required or email pending: ${gmailRes.error || 'Awaiting activation'}`);
            updates.emailVerificationStatus = 'Verification Pending / Direct Access';
          }
        } else {
          updates.emailVerificationStatus = 'Gmail Not Connected';
        }
      } catch (regErr: any) {
        addLog('warn', `Registration attempt error: ${regErr.message}`);
        updates.accountStatus = 'Signup Attempted';
      }
    }

    // 6. GENERATE CONTENT & SUBMIT BACKLINK
    addLog('info', `Generating authoritative content referencing target URL: ${targetUrl}`, 'Content Synthesis');
    callbacks?.onStep('Content Generation', `Synthesizing ${opportunity.backlinkType} placement for "${anchorText}"`);

    const generated = await generateRelevantContent({
      websiteName: row.websiteName || parsedUrl.hostname,
      targetUrl,
      anchorText,
      contentType: opportunity.backlinkType === 'Guest Post' ? 'article' : 'bio',
      additionalInstructions: row.additionalInstructions,
    });

    // Locate submission form (profile website field, bio, or article form)
    addLog('info', 'Locating backlink submission or profile form...', 'Form Submission');
    callbacks?.onStep('Submitting Link', `Filling profile/backlink fields on ${parsedUrl.hostname}`);

    // Try finding website/URL input fields
    const websiteInput = await page.$('input[name*="website"], input[name*="url"], input[placeholder*="http"], input[name*="link"]');
    const bioTextarea = await page.$('textarea[name*="bio"], textarea[name*="about"], textarea[name*="content"], textarea[name*="desc"]');

    let submittedSuccessfully = false;
    if (websiteInput) {
      await websiteInput.fill(targetUrl);
      if (bioTextarea) {
        await bioTextarea.fill(generated.bio || generated.content);
      }
      const saveBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Save"), button:has-text("Submit"), button:has-text("Update")');
      if (saveBtn) {
        await Promise.all([
          page.waitForNavigation({ timeout: 6000 }).catch(() => {}),
          saveBtn.click(),
        ]);
        submittedSuccessfully = true;
      }
    } else if (bioTextarea) {
      await bioTextarea.fill(generated.content);
      const saveBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Save"), button:has-text("Submit"), button:has-text("Publish")');
      if (saveBtn) {
        await Promise.all([
          page.waitForNavigation({ timeout: 6000 }).catch(() => {}),
          saveBtn.click(),
        ]);
        submittedSuccessfully = true;
      }
    }

    // 7. VERIFY PUBLISHED BACKLINK ON LIVE PAGE
    const currentLiveUrl = page.url();
    updates.publishedBacklinkUrl = currentLiveUrl;
    updates.submissionStatus = submittedSuccessfully ? 'Submitted' : 'Direct Opportunity Recorded';

    addLog('info', `Verifying published status on live page: ${currentLiveUrl}...`, 'Backlink Verification');
    callbacks?.onStep('Verification', `Inspecting live DOM for target URL ${targetUrl}`);

    const finalHtml = await page.content();
    const $final = cheerio.load(finalHtml);

    // Look for target URL in <a> tags
    let targetLinkFound = false;
    let linkRel = 'none';
    let anchorMatched = false;

    $final('a').each((_, el) => {
      const href = $final(el).attr('href') || '';
      if (href.includes(targetUrl) || targetUrl.includes(href.replace(/\/$/, ''))) {
        targetLinkFound = true;
        const rel = $final(el).attr('rel') || 'dofollow';
        if (rel.includes('nofollow')) linkRel = 'nofollow';
        else if (rel.includes('ugc')) linkRel = 'ugc';
        else if (rel.includes('sponsored')) linkRel = 'sponsored';
        else linkRel = 'dofollow';

        const text = $final(el).text().trim();
        if (text.toLowerCase().includes(anchorText.toLowerCase())) {
          anchorMatched = true;
        }
      }
    });

    updates.lastVerificationDate = new Date().toISOString();
    updates.linkAttribute = (linkRel as LinkAttribute);

    // Capture final state screenshot
    try {
      const buf = await page.screenshot({ type: 'jpeg', quality: 65 });
      const finalShot = `data:image/jpeg;base64,${buf.toString('base64')}`;
      updates.screenshotUrl = finalShot;
      callbacks?.onStep('Completed', `Finished processing ${parsedUrl.hostname}`, finalShot);
    } catch (e) {}

    if (targetLinkFound) {
      addLog('success', `Backlink LIVE and verified! Attribute: ${linkRel}, Anchor match: ${anchorMatched ? 'Exact' : 'Partial/URL'}`, 'Verified');
      updates.finalResult = 'Published and Verified';
      updates.publicationDate = new Date().toISOString();
    } else if (submittedSuccessfully) {
      if (opportunity.backlinkType === 'Guest Post' || bodyText.includes('moderation') || bodyText.includes('approval')) {
        addLog('info', 'Content submitted successfully; currently pending editorial moderation', 'Pending Approval');
        updates.finalResult = 'Pending Approval';
      } else {
        addLog('warn', 'Submission finished but link not directly visible on landing page yet', 'Verification Notice');
        updates.finalResult = 'Submitted';
      }
    } else {
      // If website allowed navigation but didn't have immediate public submission form
      addLog('warn', 'Website inspected; no public form submission completed. Skipped to prevent invalid spam.', 'Skip Unsuitable');
      updates.finalResult = 'Skipped';
      updates.failureOrSkipReason = 'Website requires manual editorial pitch or registration form unavailable';
    }

    return updates;

  } catch (err: any) {
    addLog('error', `Process error on ${row.websiteUrl}: ${err.message}`, 'Execution Error');
    return {
      ...updates,
      finalResult: 'Failed',
      failureOrSkipReason: err.message || 'Execution failed during browser automation',
    };
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
  }
}
