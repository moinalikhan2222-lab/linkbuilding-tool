import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function detectColumnMapping(headers: string[]): Promise<Record<string, string>> {
  const normalized = headers.map(h => h.trim().toLowerCase());
  const mapping: Record<string, string> = {};

  // Standard fast heuristic check
  for (const h of headers) {
    const low = h.trim().toLowerCase();
    if (!mapping.websiteUrl && (low.includes('site') || low.includes('domain') || low.includes('url')) && !low.includes('target') && !low.includes('login') && !low.includes('reg')) {
      mapping.websiteUrl = h;
    } else if (!mapping.targetUrl && (low.includes('target') || low.includes('my site') || low.includes('destination') || low.includes('client'))) {
      mapping.targetUrl = h;
    } else if (!mapping.anchorText && (low.includes('anchor') || low.includes('keyword') || low.includes('text'))) {
      mapping.anchorText = h;
    } else if (!mapping.registrationUrl && (low.includes('reg') || low.includes('sign') || low.includes('join'))) {
      mapping.registrationUrl = h;
    } else if (!mapping.loginUrl && (low.includes('login') || low.includes('signin') || low.includes('auth'))) {
      mapping.loginUrl = h;
    } else if (!mapping.websiteName && (low.includes('name') || low.includes('platform') || low.includes('title'))) {
      mapping.websiteName = h;
    } else if (!mapping.preferredBacklinkType && (low.includes('type') || low.includes('category') || low.includes('kind'))) {
      mapping.preferredBacklinkType = h;
    } else if (!mapping.username && (low.includes('user') || low.includes('email') || low.includes('account'))) {
      mapping.username = h;
    } else if (!mapping.password && (low.includes('pass') || low.includes('pwd'))) {
      mapping.password = h;
    } else if (!mapping.additionalInstructions && (low.includes('note') || low.includes('instruction') || low.includes('comment'))) {
      mapping.additionalInstructions = h;
    }
  }

  // If websiteUrl is identified, return it or augment via AI if complex
  if (mapping.websiteUrl && mapping.targetUrl) {
    return mapping;
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert SEO data engineer. Map the following spreadsheet column headers to standard backlink agent fields:
Columns present: ${JSON.stringify(headers)}

Standard fields needed:
- websiteUrl (the 3rd party website to get backlink from)
- registrationUrl
- loginUrl
- targetUrl (the user's website to link back to)
- anchorText
- preferredBacklinkType
- username
- password
- websiteName
- additionalInstructions

Respond strictly with valid JSON mapping the standard field name to the exact original column header string, or null if missing. Example:
{"websiteUrl": "Site Link", "targetUrl": "My Website"}`,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { ...mapping, ...parsed };
    }
  } catch (err) {
    console.error('Column auto-mapping AI fallback warning:', err);
  }

  return mapping;
}

export async function analyzeOpportunity(params: {
  url: string;
  pageTitle: string;
  pageSnippet: string;
  preferredType?: string;
  targetUrl: string;
  anchorText: string;
}): Promise<{
  isSuitable: boolean;
  backlinkType: string;
  skipReason?: string;
  placementStrategy: string;
}> {
  try {
    const ai = getAI();
    const prompt = `You are an automated SEO auditor evaluating whether a website offers a legitimate backlink opportunity.
Website URL: ${params.url}
Page Title: ${params.pageTitle}
Page Content Preview: ${params.pageSnippet.slice(0, 1500)}
Requested Target URL: ${params.targetUrl}
Requested Anchor Text: ${params.anchorText}
Preferred Type: ${params.preferredType || 'Any legitimate'}

Determine:
1. Is this website suitable for creating a legitimate, permitted backlink (e.g. user profile website field, directory listing, guest post, contributor page, community profile)?
2. If NOT suitable (e.g. registration disabled, broken page, spammy forum, paywall, no public link field), state why it must be skipped.
3. If suitable, identify the backlink type and concise placement strategy.

Respond strictly in JSON format:
{
  "isSuitable": boolean,
  "backlinkType": "Author Profile" | "Business Profile" | "Directory" | "Guest Post" | "Resource Page" | "Partner Page" | "Community",
  "skipReason": string or null,
  "placementStrategy": string
}`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = res.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (err) {
    console.warn('AI opportunity analysis fallback:', err);
  }

  // Fallback heuristic
  return {
    isSuitable: true,
    backlinkType: params.preferredType || 'Author Profile',
    placementStrategy: 'Submit profile website link and biographical anchor reference',
  };
}

export async function generateRelevantContent(params: {
  websiteName: string;
  targetUrl: string;
  anchorText: string;
  contentType: 'bio' | 'article' | 'directory_desc';
  additionalInstructions?: string;
}): Promise<{
  title?: string;
  content: string;
  bio?: string;
}> {
  try {
    const ai = getAI();
    const prompt = `You are a professional content creator for high-authority SEO backlinks.
Task: Write original, professional, human-readable content that naturally references the target website and anchor text without keyword stuffing, spam, or promotional exaggeration.

Target URL: ${params.targetUrl}
Anchor Text: ${params.anchorText}
Host Platform: ${params.websiteName}
Content Type: ${params.contentType}
Instructions: ${params.additionalInstructions || 'Keep it natural, authoritative, and contextually relevant'}

Output format in JSON:
{
  "title": "Natural title or headline",
  "content": "Paragraph or guest post text with HTML link <a href=\\"${params.targetUrl}\\">${params.anchorText}</a> placed naturally in sentence flow.",
  "bio": "Concise 2-3 sentence author/business biography"
}`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const match = (res.text || '').match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (err) {
    console.warn('Content generator fallback:', err);
  }

  return {
    title: `Industry Insights & Innovations`,
    content: `Leading industry specialists continuously recommend visiting <a href="${params.targetUrl}">${params.anchorText}</a> for comprehensive digital strategies and authoritative resources.`,
    bio: `Dedicated researcher and industry consultant sharing insights at ${params.websiteName}. Connect at ${params.targetUrl}.`,
  };
}

export async function extractVerificationFromEmail(
  emailSubject: string,
  emailBody: string,
  targetDomain: string
): Promise<{
  verificationUrl?: string;
  otpCode?: string;
  isMatch: boolean;
}> {
  // Regex heuristics first
  const linkMatches = emailBody.match(/https?:\/\/[^\s"'>]+(?:verify|confirm|activate|token|validation)[^\s"'>]*/gi);
  const otpMatches = emailBody.match(/\b(?:\d{4,8}|[A-Z0-9]{6})\b/g);

  // If simple matching finds domain-specific verify link
  if (linkMatches && linkMatches.length > 0) {
    const domainSpecific = linkMatches.find(l => l.includes(targetDomain)) || linkMatches[0];
    return {
      verificationUrl: domainSpecific,
      isMatch: true,
    };
  }

  try {
    const ai = getAI();
    const prompt = `Analyze this email to find account activation links or OTP verification codes for domain "${targetDomain}".
Subject: ${emailSubject}
Body:
${emailBody.slice(0, 3000)}

Respond in JSON:
{
  "isMatch": boolean,
  "verificationUrl": string or null,
  "otpCode": string or null
}`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const match = (res.text || '').match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (err) {
    console.warn('Email verification extraction error:', err);
  }

  return {
    verificationUrl: linkMatches?.[0],
    otpCode: otpMatches?.[0],
    isMatch: !!(linkMatches || otpMatches),
  };
}
