import { CampaignDefaults, CampaignStatus, CampaignSummary, BrowserLiveState, WebsiteRow } from '../types/index.ts';
import { clientCampaignEngine } from './clientCampaignEngine.ts';

export interface CampaignStateResponse {
  status: CampaignStatus;
  summary: CampaignSummary;
  liveState: BrowserLiveState;
  defaults: CampaignDefaults;
}

export const api = {
  async getCampaignState(): Promise<CampaignStateResponse> {
    try {
      const res = await fetch('/api/campaign/state', { signal: AbortSignal.timeout(1500) });
      if (res.ok) return res.json();
    } catch (e) {}

    // Standalone client fallback
    return {
      status: clientCampaignEngine.getStatus(),
      summary: clientCampaignEngine.getSummary(),
      liveState: clientCampaignEngine.getLiveState(),
      defaults: clientCampaignEngine.getDefaults(),
    };
  },

  async getRows(): Promise<{ rows: WebsiteRow[] }> {
    try {
      const res = await fetch('/api/campaign/rows', { signal: AbortSignal.timeout(1500) });
      if (res.ok) return res.json();
    } catch (e) {}

    return { rows: clientCampaignEngine.getRows() };
  },

  async addWebsitesFromText(rawText: string, replaceExisting: boolean = false): Promise<any> {
    return clientCampaignEngine.addWebsitesFromText(rawText, replaceExisting);
  },

  async clearRows(): Promise<any> {
    return clientCampaignEngine.clearRows();
  },

  async uploadSpreadsheet(file: File, customMapping?: Record<string, string>): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (customMapping) formData.append('mapping', JSON.stringify(customMapping));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    // Client-side ingestion fallback
    return clientCampaignEngine.ingestFile(file, customMapping);
  },

  async loadSampleData(): Promise<any> {
    try {
      const res = await fetch('/api/campaign/sample', { method: 'POST', signal: AbortSignal.timeout(2000) });
      if (res.ok) return res.json();
    } catch (e) {}

    clientCampaignEngine.loadSampleData();
    return {
      success: true,
      summary: clientCampaignEngine.getSummary(),
      rows: clientCampaignEngine.getRows(),
    };
  },

  async startCampaign(gmailToken?: string): Promise<any> {
    try {
      const res = await fetch('/api/campaign/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmailToken }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    if (gmailToken) clientCampaignEngine.setGmailToken(gmailToken);
    clientCampaignEngine.startCampaign();
    return { success: true, status: clientCampaignEngine.getStatus() };
  },

  async pauseCampaign(): Promise<any> {
    try {
      const res = await fetch('/api/campaign/pause', { method: 'POST', signal: AbortSignal.timeout(1500) });
      if (res.ok) return res.json();
    } catch (e) {}

    clientCampaignEngine.pauseCampaign();
    return { success: true, status: clientCampaignEngine.getStatus() };
  },

  async resumeCampaign(gmailToken?: string): Promise<any> {
    try {
      const res = await fetch('/api/campaign/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmailToken }),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    if (gmailToken) clientCampaignEngine.setGmailToken(gmailToken);
    clientCampaignEngine.resumeCampaign();
    return { success: true, status: clientCampaignEngine.getStatus() };
  },

  async stopCampaign(): Promise<any> {
    try {
      const res = await fetch('/api/campaign/stop', { method: 'POST', signal: AbortSignal.timeout(1500) });
      if (res.ok) return res.json();
    } catch (e) {}

    clientCampaignEngine.stopCampaign();
    return { success: true, status: clientCampaignEngine.getStatus() };
  },

  async retryRows(ids: string[]): Promise<any> {
    try {
      const res = await fetch('/api/campaign/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    clientCampaignEngine.retrySelected(ids);
    return { success: true };
  },

  async updateDefaults(defaults: Partial<CampaignDefaults>): Promise<any> {
    try {
      const res = await fetch('/api/campaign/defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaults),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    clientCampaignEngine.setDefaults(defaults);
    return { success: true, defaults: clientCampaignEngine.getDefaults() };
  },

  async resolveManualAction(id: string, resolutionNote: string): Promise<any> {
    try {
      const res = await fetch('/api/campaign/manual-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, resolutionNote }),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    clientCampaignEngine.resolveManualAction(id, resolutionNote);
    return { success: true };
  },

  async syncGmailToken(token: string): Promise<any> {
    clientCampaignEngine.setGmailToken(token || null);
    try {
      fetch('/api/gmail/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    } catch (e) {}
    return { success: true };
  },

  triggerExcelExport(): void {
    clientCampaignEngine.exportExcelReport();
  },

  getExcelExportUrl(): string {
    return '/api/campaign/export-excel';
  },
};
