import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import type { WebsiteRow, CampaignDefaults, CampaignStatus, BrowserLiveState, CampaignSummary, TaskLog } from '../types/index.ts';
import { processWebsiteAutomation } from './browser.ts';
import { detectColumnMapping } from './gemini.ts';

const STATE_FILE = path.resolve(process.cwd(), '.campaign_state.json');

export class CampaignManager {
  private rows: WebsiteRow[] = [];
  private status: CampaignStatus = 'idle';
  private defaults: CampaignDefaults = {
    defaultTargetUrl: 'https://example.com',
    defaultAnchorText: 'Industry Authority',
    defaultEmail: 'outreach@example.com',
    defaultAuthorName: 'SEO Specialist',
    defaultBio: 'Professional industry analyst and researcher.',
  };
  private liveState: BrowserLiveState = { isRunning: false };
  private gmailAccessToken?: string;
  private isProcessingLoop = false;
  private originalFileName = '';

  constructor() {
    this.loadStateFromDisk();
  }

  private loadStateFromDisk() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.rows = parsed.rows || [];
        this.defaults = parsed.defaults || this.defaults;
        this.originalFileName = parsed.originalFileName || '';
      }
    } catch (e) {
      console.warn('Failed to load campaign state from disk:', e);
    }
  }

  private saveStateToDisk() {
    try {
      const data = {
        rows: this.rows,
        defaults: this.defaults,
        originalFileName: this.originalFileName,
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('Failed to save campaign state to disk:', e);
    }
  }

  public setGmailAccessToken(token?: string) {
    this.gmailAccessToken = token;
  }

  public setDefaults(defaults: Partial<CampaignDefaults>) {
    const oldTarget = this.defaults.defaultTargetUrl;
    const oldAnchor = this.defaults.defaultAnchorText;
    this.defaults = { ...this.defaults, ...defaults };

    // Propagate to pending rows that used default or were empty
    for (const row of this.rows) {
      if (row.finalResult === 'Not Started') {
        if (!row.targetUrl || row.targetUrl === oldTarget) {
          row.targetUrl = this.defaults.defaultTargetUrl;
        }
        if (!row.anchorText || row.anchorText === oldAnchor) {
          row.anchorText = this.defaults.defaultAnchorText;
        }
      }
    }

    this.saveStateToDisk();
  }

  public getDefaults(): CampaignDefaults {
    return this.defaults;
  }

  public getStatus(): CampaignStatus {
    return this.status;
  }

  public getLiveState(): BrowserLiveState {
    return this.liveState;
  }

  public getRows(): WebsiteRow[] {
    return this.rows;
  }

  public getSummary(): CampaignSummary {
    const summary: CampaignSummary = {
      total: this.rows.length,
      processed: 0,
      currentlyProcessing: this.status === 'running' && this.liveState.activeRowId ? 1 : 0,
      signups: 0,
      logins: 0,
      submitted: 0,
      verified: 0,
      pending: 0,
      failed: 0,
      skipped: 0,
      manualAction: 0,
    };

    for (const r of this.rows) {
      if (r.finalResult !== 'Not Started') {
        summary.processed++;
      }
      if (r.accountStatus.includes('Completed') || r.accountStatus.includes('Active')) {
        summary.signups++;
      }
      if (r.loginStatus.includes('Successful')) {
        summary.logins++;
      }
      if (r.submissionStatus.includes('Submitted')) {
        summary.submitted++;
      }
      if (r.finalResult === 'Published and Verified') {
        summary.verified++;
      } else if (r.finalResult === 'Pending Approval') {
        summary.pending++;
      } else if (r.finalResult === 'Failed' || r.finalResult === 'Published but Verification Failed') {
        summary.failed++;
      } else if (r.finalResult === 'Skipped') {
        summary.skipped++;
      } else if (r.finalResult === 'Manual Action Required') {
        summary.manualAction++;
      }
    }

    return summary;
  }

  public async ingestSpreadsheet(
    buffer: Buffer,
    filename: string,
    customMapping?: Record<string, string>
  ): Promise<{
    rowsCount: number;
    detectedHeaders: string[];
    mapping: Record<string, string>;
    duplicatesFound: number;
    warnings: string[];
  }> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!rawJson || rawJson.length === 0) {
      throw new Error('Spreadsheet appears to be empty');
    }

    const headers: string[] = (rawJson[0] as string[]).map(h => String(h || '').trim());
    const mapping = customMapping || (await detectColumnMapping(headers));

    this.originalFileName = filename;
    const newRows: WebsiteRow[] = [];
    const seenUrls = new Set<string>();
    let duplicates = 0;
    const warnings: string[] = [];

    for (let i = 1; i < rawJson.length; i++) {
      const rowData = rawJson[i];
      if (!rowData || rowData.length === 0) continue;

      const getVal = (fieldKey: string): string => {
        const headerName = mapping[fieldKey];
        if (!headerName) return '';
        const idx = headers.indexOf(headerName);
        if (idx === -1) return '';
        return String(rowData[idx] || '').trim();
      };

      const siteUrl = getVal('websiteUrl');
      if (!siteUrl) continue;

      // Duplicate detection
      const cleanUrl = siteUrl.toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').replace(/\/$/, '');
      if (seenUrls.has(cleanUrl)) {
        duplicates++;
        continue;
      }
      seenUrls.add(cleanUrl);

      const targetUrl = getVal('targetUrl') || this.defaults.defaultTargetUrl;
      const anchor = getVal('anchorText') || this.defaults.defaultAnchorText;

      newRows.push({
        id: `row-${Date.now()}-${i}`,
        originalRowNumber: i + 1, // Excel 1-indexed row with header on 1
        websiteName: getVal('websiteName') || cleanUrl.split('/')[0],
        websiteUrl: siteUrl,
        registrationUrl: getVal('registrationUrl'),
        loginUrl: getVal('loginUrl'),
        targetUrl,
        anchorText: anchor,
        preferredBacklinkType: getVal('preferredBacklinkType') || 'Author Profile',
        username: getVal('username'),
        passwordEncrypted: '',
        hasPassword: !!getVal('password'),
        additionalInstructions: getVal('additionalInstructions'),
        accountStatus: 'Not Started',
        loginStatus: 'Not Started',
        emailVerificationStatus: 'Not Started',
        submissionStatus: 'Not Started',
        linkAttribute: 'unknown',
        finalResult: 'Not Started',
        retryCount: 0,
        logs: [],
      });
    }

    if (newRows.length === 0) {
      warnings.push('No valid website rows detected. Please verify column mappings.');
    }

    this.rows = newRows;
    this.status = 'idle';
    this.saveStateToDisk();

    return {
      rowsCount: newRows.length,
      detectedHeaders: headers,
      mapping,
      duplicatesFound: duplicates,
      warnings,
    };
  }

  public loadSampleData() {
    this.originalFileName = 'LinkPulse_Master_SEO_Prospects.xlsx';
    this.rows = [
      {
        id: 'sample-1',
        originalRowNumber: 2,
        websiteName: 'DevCommunity Platform',
        websiteUrl: 'https://dev.to',
        registrationUrl: 'https://dev.to/enter',
        targetUrl: this.defaults.defaultTargetUrl || 'https://techmetrics.ai',
        anchorText: this.defaults.defaultAnchorText || 'AI SEO Platform',
        preferredBacklinkType: 'Author Profile',
        accountStatus: 'Not Started',
        loginStatus: 'Not Started',
        emailVerificationStatus: 'Not Started',
        submissionStatus: 'Not Started',
        linkAttribute: 'unknown',
        finalResult: 'Not Started',
        retryCount: 0,
        logs: [],
      },
      {
        id: 'sample-2',
        originalRowNumber: 3,
        websiteName: 'Cloudflare Protected Demo',
        websiteUrl: 'https://nowsecure.nl',
        targetUrl: this.defaults.defaultTargetUrl || 'https://techmetrics.ai',
        anchorText: this.defaults.defaultAnchorText || 'Best Link Intelligence',
        preferredBacklinkType: 'Directory',
        accountStatus: 'Not Started',
        loginStatus: 'Not Started',
        emailVerificationStatus: 'Not Started',
        submissionStatus: 'Not Started',
        linkAttribute: 'unknown',
        finalResult: 'Not Started',
        retryCount: 0,
        logs: [],
      },
      {
        id: 'sample-3',
        originalRowNumber: 4,
        websiteName: 'Open Web Directory',
        websiteUrl: 'https://httpbin.org/status/200',
        targetUrl: this.defaults.defaultTargetUrl || 'https://techmetrics.ai',
        anchorText: this.defaults.defaultAnchorText || 'Authority SEO Tools',
        preferredBacklinkType: 'Resource Page',
        accountStatus: 'Not Started',
        loginStatus: 'Not Started',
        emailVerificationStatus: 'Not Started',
        submissionStatus: 'Not Started',
        linkAttribute: 'unknown',
        finalResult: 'Not Started',
        retryCount: 0,
        logs: [],
      },
      {
        id: 'sample-4',
        originalRowNumber: 5,
        websiteName: 'NonExistent Domain Test',
        websiteUrl: 'https://definitely-does-not-exist-991283.org',
        targetUrl: this.defaults.defaultTargetUrl || 'https://techmetrics.ai',
        anchorText: this.defaults.defaultAnchorText || 'Broken Link Skip Test',
        preferredBacklinkType: 'Guest Post',
        accountStatus: 'Not Started',
        loginStatus: 'Not Started',
        emailVerificationStatus: 'Not Started',
        submissionStatus: 'Not Started',
        linkAttribute: 'unknown',
        finalResult: 'Not Started',
        retryCount: 0,
        logs: [],
      },
      {
        id: 'sample-5',
        originalRowNumber: 6,
        websiteName: 'Wikipedia Sandbox',
        websiteUrl: 'https://en.wikipedia.org/wiki/Wikipedia:Sandbox',
        targetUrl: this.defaults.defaultTargetUrl || 'https://techmetrics.ai',
        anchorText: this.defaults.defaultAnchorText || 'SEO Analytics System',
        preferredBacklinkType: 'Community',
        accountStatus: 'Not Started',
        loginStatus: 'Not Started',
        emailVerificationStatus: 'Not Started',
        submissionStatus: 'Not Started',
        linkAttribute: 'unknown',
        finalResult: 'Not Started',
        retryCount: 0,
        logs: [],
      },
    ];
    this.status = 'idle';
    this.saveStateToDisk();
  }

  public async startCampaign(): Promise<void> {
    if (this.status === 'running') return;
    this.status = 'running';
    this.liveState.isRunning = true;
    this.runBackgroundLoop().catch(err => {
      console.error('Fatal campaign loop error:', err);
      this.status = 'idle';
      this.liveState.isRunning = false;
    });
  }

  public pauseCampaign() {
    if (this.status === 'running') {
      this.status = 'paused';
      this.liveState.isRunning = false;
      this.liveState.currentAction = 'Campaign paused by user';
    }
  }

  public resumeCampaign() {
    if (this.status === 'paused') {
      this.startCampaign();
    }
  }

  public stopCampaign() {
    this.status = 'stopped';
    this.liveState.isRunning = false;
    this.liveState.currentAction = 'Campaign stopped';
  }

  public retryRow(id: string) {
    const row = this.rows.find(r => r.id === id);
    if (row) {
      row.finalResult = 'Not Started';
      row.failureOrSkipReason = undefined;
      row.requiredManualAction = undefined;
      this.saveStateToDisk();
    }
  }

  public retrySelected(ids: string[]) {
    for (const id of ids) {
      this.retryRow(id);
    }
    if (this.status !== 'running') {
      this.startCampaign();
    }
  }

  public resolveManualAction(id: string, actionNote: string) {
    const row = this.rows.find(r => r.id === id);
    if (row) {
      row.finalResult = 'Not Started';
      row.requiredManualAction = `Resolved manually: ${actionNote}`;
      this.saveStateToDisk();
    }
  }

  private async runBackgroundLoop() {
    if (this.isProcessingLoop) return;
    this.isProcessingLoop = true;

    try {
      while (this.status === 'running') {
        // Find next eligible row: 'Not Started' or eligible retry
        const targetRow = this.rows.find(r => r.finalResult === 'Not Started');

        if (!targetRow) {
          this.status = 'completed';
          this.liveState = {
            isRunning: false,
            currentAction: 'All spreadsheet websites processed to completion',
          };
          this.saveStateToDisk();
          break;
        }

        // Set live state
        this.liveState = {
          isRunning: true,
          activeRowId: targetRow.id,
          websiteName: targetRow.websiteName,
          currentUrl: targetRow.websiteUrl,
          currentAction: `Starting automated session for ${targetRow.websiteName}`,
          stepName: 'Initialization',
          timestamp: new Date().toLocaleTimeString(),
        };

        targetRow.finalResult = 'Processing';

        // Process website automation
        try {
          const result = await processWebsiteAutomation(
            targetRow,
            this.defaults,
            this.gmailAccessToken,
            {
              onStep: (stepName, actionDetail, screenshotBase64) => {
                this.liveState.stepName = stepName;
                this.liveState.currentAction = actionDetail;
                if (screenshotBase64) {
                  this.liveState.screenshotBase64 = screenshotBase64;
                }
              },
              onLog: (log: TaskLog) => {
                if (log.level === 'error') {
                  this.liveState.latestError = log.message;
                }
              },
            }
          );

          // Apply result updates
          Object.assign(targetRow, result);
        } catch (taskErr: any) {
          console.error(`Error processing row ${targetRow.id}:`, taskErr);
          targetRow.finalResult = 'Skipped';
          targetRow.failureOrSkipReason = `Encountered unexpected task error: ${taskErr.message}. Automatically skipped to next.`;
        }

        // Always save state after each row
        this.saveStateToDisk();

        // Brief delay between websites to respect rate limits
        if (this.status === 'running') {
          await new Promise(r => setTimeout(r, 1200));
        }
      }
    } finally {
      this.isProcessingLoop = false;
      this.liveState.isRunning = this.status === 'running';
      this.saveStateToDisk();
    }
  }

  public generateExcelReport(): Buffer {
    const headers = [
      'Website Name',
      'Original Website URL',
      'Target URL',
      'Anchor Text',
      'Backlink Type',
      'Submission Status',
      'Exact Published Backlink URL',
      'Backlink Verification Status',
      'Link Attribute',
      'Publication Date',
      'Last Checked Date',
      'Failure or Skip Reason',
    ];

    const formatRow = (r: WebsiteRow) => [
      r.websiteName || '',
      r.websiteUrl || '',
      r.targetUrl || '',
      r.anchorText || '',
      r.preferredBacklinkType || '',
      r.submissionStatus || 'Not Started',
      r.publishedBacklinkUrl || '',
      r.finalResult || 'Not Started',
      r.linkAttribute || 'unknown',
      r.publicationDate || '',
      r.lastVerificationDate || r.lastAttemptDate || '',
      r.failureOrSkipReason || (r.requiredManualAction ? `Manual Action: ${r.requiredManualAction}` : ''),
    ];

    const colWidths = [
      { wch: 25 }, { wch: 32 }, { wch: 30 }, { wch: 24 }, { wch: 18 },
      { wch: 20 }, { wch: 42 }, { wch: 28 }, { wch: 16 }, { wch: 22 },
      { wch: 22 }, { wch: 45 },
    ];

    const workbook = XLSX.utils.book_new();

    // 1. All Results
    const allData = this.rows.map(formatRow);
    const wsAll = XLSX.utils.aoa_to_sheet([headers, ...allData]);
    wsAll['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, wsAll, 'All Results');

    // 2. Live and Verified Backlinks
    const verifiedRows = this.rows.filter(r => r.finalResult === 'Published and Verified').map(formatRow);
    const wsVerified = XLSX.utils.aoa_to_sheet([headers, ...verifiedRows]);
    wsVerified['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, wsVerified, 'Live & Verified Backlinks');

    // 3. Published but Unverified
    const unverifiedRows = this.rows.filter(r => r.finalResult === 'Published but Unverified' || r.finalResult === 'Published but Verification Failed').map(formatRow);
    const wsUnverified = XLSX.utils.aoa_to_sheet([headers, ...unverifiedRows]);
    wsUnverified['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, wsUnverified, 'Published but Unverified');

    // 4. Pending Approval
    const pendingRows = this.rows.filter(r => r.finalResult === 'Pending Approval').map(formatRow);
    const wsPending = XLSX.utils.aoa_to_sheet([headers, ...pendingRows]);
    wsPending['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, wsPending, 'Pending Approval');

    // 5. Failed or Skipped
    const failedSkippedRows = this.rows.filter(r => r.finalResult === 'Failed' || r.finalResult === 'Skipped' || r.finalResult === 'Manual Action Required').map(formatRow);
    const wsFailedSkipped = XLSX.utils.aoa_to_sheet([headers, ...failedSkippedRows]);
    wsFailedSkipped['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, wsFailedSkipped, 'Failed or Skipped');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const campaignManager = new CampaignManager();
