import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/firebase.ts';
import { api } from './services/api.ts';
import { WebsiteRow, CampaignDefaults, CampaignStatus, CampaignSummary, BrowserLiveState } from './types/index.ts';
import { Header } from './components/Header.tsx';
import { StatsGrid } from './components/StatsGrid.tsx';
import { SimplifiedUrlInput } from './components/SimplifiedUrlInput.tsx';
import { CampaignControls } from './components/CampaignControls.tsx';
import { BrowserInspector } from './components/BrowserInspector.tsx';
import { ResultsTable } from './components/ResultsTable.tsx';
import { RowDetailsModal } from './components/RowDetailsModal.tsx';
import { ManualActionModal } from './components/ManualActionModal.tsx';
import { CampaignSettingsModal } from './components/CampaignSettingsModal.tsx';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Campaign state
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>('idle');
  const [summary, setSummary] = useState<CampaignSummary>({
    total: 0,
    processed: 0,
    currentlyProcessing: 0,
    signups: 0,
    logins: 0,
    submitted: 0,
    verified: 0,
    pending: 0,
    failed: 0,
    skipped: 0,
    manualAction: 0,
  });
  const [liveState, setLiveState] = useState<BrowserLiveState>({ isRunning: false });
  const [defaults, setDefaults] = useState<CampaignDefaults>({
    defaultTargetUrl: 'https://mysite.com',
    defaultAnchorText: 'Industry Authority',
    defaultEmail: 'outreach@mysite.com',
    defaultAuthorName: 'SEO Specialist',
    defaultBio: 'Professional industry analyst & tech researcher.',
  });
  const [rows, setRows] = useState<WebsiteRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inspectRow, setInspectRow] = useState<WebsiteRow | null>(null);
  const [manualActionRow, setManualActionRow] = useState<WebsiteRow | null>(null);

  // Auth Initialization
  useEffect(() => {
    initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        api.syncGmailToken(token).catch(console.error);
      },
      () => {
        setUser(null);
      }
    );
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        await api.syncGmailToken(res.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    await api.syncGmailToken('');
  };

  // State Synchronization Poller (Live On-Site Database)
  const refreshCampaignData = async () => {
    try {
      const stateRes = await api.getCampaignState();
      setCampaignStatus(stateRes.status);
      setSummary(stateRes.summary);
      setLiveState(stateRes.liveState);
      setDefaults(stateRes.defaults);

      const rowsRes = await api.getRows();
      setRows(rowsRes.rows);

      // Keep inspected row in sync if open
      if (inspectRow) {
        const updated = rowsRes.rows.find(r => r.id === inspectRow.id);
        if (updated) setInspectRow(updated);
      }
    } catch (err) {
      console.warn('Poll error:', err);
    }
  };

  useEffect(() => {
    refreshCampaignData();
    const interval = setInterval(refreshCampaignData, campaignStatus === 'running' ? 1000 : 3000);
    return () => clearInterval(interval);
  }, [campaignStatus, inspectRow?.id]);

  // Campaign Handlers
  const handleStart = async () => {
    const token = await getAccessToken();
    await api.startCampaign(token || undefined);
    refreshCampaignData();
  };

  const handlePause = async () => {
    await api.pauseCampaign();
    refreshCampaignData();
  };

  const handleResume = async () => {
    const token = await getAccessToken();
    await api.resumeCampaign(token || undefined);
    refreshCampaignData();
  };

  const handleStop = async () => {
    await api.stopCampaign();
    refreshCampaignData();
  };

  const handleRetrySelected = async () => {
    if (selectedIds.length === 0) return;
    await api.retryRows(selectedIds);
    setSelectedIds([]);
    refreshCampaignData();
  };

  const handleRetrySingle = async (id: string) => {
    await api.retryRows([id]);
    refreshCampaignData();
  };

  const handleResolveManualAction = async (id: string, note: string) => {
    await api.resolveManualAction(id, note);
    const token = await getAccessToken();
    await api.resumeCampaign(token || undefined);
    refreshCampaignData();
  };

  const handleAddUrls = async (text: string, replaceExisting: boolean) => {
    const res = await api.addWebsitesFromText(text, replaceExisting);
    await refreshCampaignData();
    return res;
  };

  const handleClearUrls = async () => {
    await api.clearRows();
    await refreshCampaignData();
  };

  // Row Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(rows.map(r => r.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Find active row logs for Browser Inspector
  const activeRow = rows.find(r => r.id === liveState.activeRowId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-700 selection:text-white">
      {/* Header */}
      <Header
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        campaignStatus={campaignStatus}
        isSigningIn={isSigningIn}
      />

      {/* Main Dashboard Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Campaign Statistics (7 Key Metrics from Requirement 5) */}
        <StatsGrid
          summary={summary}
          activeFilter={activeFilter}
          onFilterClick={filter => setActiveFilter(filter)}
        />

        {/* 2. Simplified Input Panel: Fixed Target URL, Anchor Text & Bulk URL Pasting */}
        <SimplifiedUrlInput
          defaults={defaults}
          totalRows={rows.length}
          isRunning={campaignStatus === 'running'}
          onUpdateDefaults={async updated => {
            await api.updateDefaults(updated);
            refreshCampaignData();
          }}
          onAddUrls={handleAddUrls}
          onClearUrls={handleClearUrls}
          onStartCampaign={handleStart}
        />

        {/* 3. Campaign Execution Controls (Start, Pause, Resume, Stop) */}
        <CampaignControls
          status={campaignStatus}
          selectedCount={selectedIds.length}
          totalRows={rows.length}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onRetrySelected={handleRetrySelected}
          onOpenUpload={() => {}}
          onRunTestSample={() => {
            handleAddUrls(
              'https://dev.to\nhttps://wikipedia.org\nhttps://medium.com\nhttps://nowsecure.nl\nhttps://definitely-does-not-exist-991283.org',
              false
            );
          }}
          onOpenDefaults={() => setIsSettingsOpen(true)}
          onExportExcel={() => api.triggerExcelExport()}
        />

        {/* 4. Live Browser Automation Viewport & Step Tracker */}
        <BrowserInspector
          liveState={liveState}
          activeRowLogs={activeRow?.logs || (rows.length > 0 ? rows[0].logs : [])}
        />

        {/* 5. Live On-Site Results Table (Exact 11 Columns, Clickable URLs & Copy Buttons) */}
        <ResultsTable
          rows={rows}
          selectedIds={selectedIds}
          activeFilter={activeFilter}
          onFilterChange={filter => setActiveFilter(filter)}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAllFiltered}
          onDeselectAll={handleDeselectAll}
          onRetrySingle={handleRetrySingle}
          onViewDetails={row => setInspectRow(row)}
          onResolveManualAction={row => setManualActionRow(row)}
        />
      </main>

      {/* Detail & Action Modals */}
      <RowDetailsModal
        row={inspectRow}
        onClose={() => setInspectRow(null)}
        onRetry={handleRetrySingle}
      />

      <ManualActionModal
        row={manualActionRow}
        onClose={() => setManualActionRow(null)}
        onResolve={handleResolveManualAction}
      />

      <CampaignSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaults={defaults}
        onSave={async updated => {
          await api.updateDefaults(updated);
          refreshCampaignData();
        }}
      />
    </div>
  );
}
