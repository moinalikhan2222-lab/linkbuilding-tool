import React, { useState } from 'react';
import { 
  ExternalLink, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  SkipForward, 
  XCircle, 
  Eye, 
  Search, 
  CheckSquare, 
  Square, 
  Copy, 
  Check, 
  ShieldCheck, 
  Globe 
} from 'lucide-react';
import { WebsiteRow, BacklinkStatus, LinkAttribute } from '../types/index.ts';

interface ResultsTableProps {
  rows: WebsiteRow[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRetrySingle: (id: string) => void;
  onViewDetails: (row: WebsiteRow) => void;
  onResolveManualAction: (row: WebsiteRow) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  rows,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onRetrySingle,
  onViewDetails,
  onResolveManualAction,
  activeFilter,
  onFilterChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter rows strictly by category
  const filteredRows = rows.filter(r => {
    if (activeFilter === 'Published and Verified' && r.finalResult !== 'Published and Verified') return false;
    if (activeFilter === 'Pending Approval' && r.finalResult !== 'Pending Approval') return false;
    if (activeFilter === 'Failed' && r.finalResult !== 'Failed' && r.finalResult !== 'Published but Verification Failed') return false;
    if (activeFilter === 'Skipped' && r.finalResult !== 'Skipped') return false;
    if (activeFilter === 'Manual Action Required' && r.finalResult !== 'Manual Action Required') return false;
    if (activeFilter === 'PROCESSED' && r.finalResult === 'Not Started') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.websiteName.toLowerCase().includes(q) ||
        r.websiteUrl.toLowerCase().includes(q) ||
        (r.publishedBacklinkUrl && r.publishedBacklinkUrl.toLowerCase().includes(q)) ||
        r.targetUrl.toLowerCase().includes(q) ||
        r.anchorText.toLowerCase().includes(q) ||
        (r.failureOrSkipReason && r.failureOrSkipReason.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const getBacklinkStatusBadge = (status: BacklinkStatus) => {
    switch (status) {
      case 'Published and Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-600/50 shadow-sm shadow-emerald-950/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Live & Verified
          </span>
        );
      case 'Published but Unverified':
      case 'Published but Verification Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-600/40">
            Published (Unverified)
          </span>
        );
      case 'Pending Approval':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/40">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pending Approval
          </span>
        );
      case 'Manual Action Required':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-950/80 text-orange-300 border border-orange-600/40">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
            Action Required
          </span>
        );
      case 'Skipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <SkipForward className="w-3 h-3 text-zinc-400" />
            Skipped
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-600/40">
            <XCircle className="w-3 h-3 text-rose-400" />
            Failed
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-950/80 text-sky-300 border border-sky-600/40 animate-pulse">
            Processing...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-900 text-zinc-500 border border-zinc-800">
            Not Started
          </span>
        );
    }
  };

  const getRelBadge = (rel: LinkAttribute) => {
    if (rel === 'dofollow') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          dofollow
        </span>
      );
    }
    if (rel === 'nofollow' || rel === 'ugc' || rel === 'sponsored') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
          {rel}
        </span>
      );
    }
    return <span className="text-[10px] text-zinc-600 font-mono">--</span>;
  };

  const allFilteredSelected =
    filteredRows.length > 0 && filteredRows.every(r => selectedIds.includes(r.id));

  // Category counts
  const verifiedCount = rows.filter(r => r.finalResult === 'Published and Verified').length;
  const pendingCount = rows.filter(r => r.finalResult === 'Pending Approval').length;
  const failedCount = rows.filter(r => r.finalResult === 'Failed' || r.finalResult === 'Published but Verification Failed').length;
  const skippedCount = rows.filter(r => r.finalResult === 'Skipped').length;
  const manualCount = rows.filter(r => r.finalResult === 'Manual Action Required').length;

  return (
    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-md space-y-3.5 p-5 shadow-2xl">
      {/* Title & Live Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span>Campaign Results (Live On-Site Database)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                Auto-Updating
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Live results with exact published URLs, verification attributes, and direct 1-click links.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search website, live URL, reason..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs & Selection Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Websites', count: rows.length },
            { id: 'Published and Verified', label: 'Live & Verified', count: verifiedCount, highlight: true },
            { id: 'Pending Approval', label: 'Pending Approval', count: pendingCount },
            { id: 'Manual Action Required', label: 'Action Required', count: manualCount },
            { id: 'Skipped', label: 'Skipped', count: skippedCount },
            { id: 'Failed', label: 'Failed', count: failedCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-650 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                tab.highlight 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Select & Count info */}
        <div className="flex items-center space-x-3 text-xs text-zinc-400">
          <button
            onClick={allFilteredSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-1.5 hover:text-zinc-200 cursor-pointer"
          >
            {allFilteredSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-zinc-300" />
            ) : (
              <Square className="w-3.5 h-3.5 text-zinc-500" />
            )}
            <span>Select All ({filteredRows.length})</span>
          </button>
          {selectedIds.length > 0 && (
            <span className="text-zinc-500 font-mono">({selectedIds.length} selected)</span>
          )}
        </div>
      </div>

      {/* Main 11-Column Results Table */}
      <div className="border border-zinc-800 rounded-xl overflow-x-auto bg-zinc-950/80">
        <table className="w-full text-left text-xs text-zinc-300 divide-y divide-zinc-800">
          <thead className="bg-zinc-900/95 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            <tr>
              <th className="p-3 w-8 text-center">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={allFilteredSelected ? onDeselectAll : onSelectAll}
                  className="rounded bg-zinc-800 border-zinc-700 text-zinc-200"
                />
              </th>
              {/* 1. Website URL */}
              <th className="p-3 min-w-[170px]">Website URL</th>
              {/* 2. Signup Status */}
              <th className="p-3 min-w-[110px]">Signup Status</th>
              {/* 3. Login Status */}
              <th className="p-3 min-w-[110px]">Login Status</th>
              {/* 4. Backlink Status */}
              <th className="p-3 min-w-[140px]">Backlink Status</th>
              {/* 5. Exact Published Backlink URL (Clickable + Copy Link) */}
              <th className="p-3 min-w-[280px]">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Exact Published Backlink URL</span>
                </div>
              </th>
              {/* 6. Target URL */}
              <th className="p-3 min-w-[160px]">Target URL</th>
              {/* 7. Anchor Text */}
              <th className="p-3 min-w-[140px]">Anchor Text</th>
              {/* 8. Link Attribute */}
              <th className="p-3 min-w-[100px]">Link Attribute</th>
              {/* 9. Verification Status */}
              <th className="p-3 min-w-[130px]">Verification Status</th>
              {/* 10. Failure or Skip Reason */}
              <th className="p-3 min-w-[200px]">Failure or Skip Reason</th>
              {/* 11. Last Checked Date */}
              <th className="p-3 min-w-[120px]">Last Checked</th>
              {/* Actions */}
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={13} className="p-10 text-center text-zinc-500 italic">
                  {rows.length === 0 
                    ? 'No websites added yet. Paste website URLs above to start link building.' 
                    : 'No websites match the selected filter.'}
                </td>
              </tr>
            ) : (
              filteredRows.map(row => {
                const isSelected = selectedIds.includes(row.id);
                const hasPublishedUrl = Boolean(row.publishedBacklinkUrl && row.publishedBacklinkUrl.trim());
                const isCopied = copiedId === row.id;

                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-zinc-900/50 transition-colors ${
                      isSelected ? 'bg-zinc-800/25' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(row.id)}
                        className="rounded bg-zinc-800 border-zinc-700 text-zinc-200 cursor-pointer"
                      />
                    </td>

                    {/* 1. Website URL (Clickable) */}
                    <td className="p-3">
                      <div className="font-semibold text-zinc-100 flex items-center gap-1.5 truncate">
                        <span>{row.websiteName}</span>
                      </div>
                      <a
                        href={row.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={row.websiteUrl}
                        className="text-[11px] font-mono text-zinc-400 hover:text-emerald-400 flex items-center gap-1 truncate transition-colors max-w-xs"
                      >
                        <span className="truncate">{row.websiteUrl}</span>
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      </a>
                    </td>

                    {/* 2. Signup Status */}
                    <td className="p-3">
                      <span className={`text-[11px] font-medium ${
                        row.accountStatus.includes('Completed') || row.accountStatus.includes('Active')
                          ? 'text-emerald-400'
                          : row.accountStatus === 'Not Started'
                          ? 'text-zinc-500'
                          : 'text-zinc-300'
                      }`}>
                        {row.accountStatus || 'Not Started'}
                      </span>
                      {row.username && (
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-[120px]">
                          @{row.username}
                        </div>
                      )}
                    </td>

                    {/* 3. Login Status */}
                    <td className="p-3">
                      <span className={`text-[11px] font-medium ${
                        row.loginStatus.includes('Successful')
                          ? 'text-emerald-400'
                          : row.loginStatus.includes('Failed')
                          ? 'text-rose-400'
                          : 'text-zinc-500'
                      }`}>
                        {row.loginStatus || 'Not Started'}
                      </span>
                    </td>

                    {/* 4. Backlink Status */}
                    <td className="p-3 whitespace-nowrap">
                      {getBacklinkStatusBadge(row.finalResult)}
                    </td>

                    {/* 5. EXACT PUBLISHED BACKLINK URL (Clickable + Copy Link) */}
                    <td className="p-3">
                      {hasPublishedUrl ? (
                        <div className="flex items-center gap-2 max-w-xs sm:max-w-md">
                          <a
                            href={row.publishedBacklinkUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={`Open live published backlink page: ${row.publishedBacklinkUrl}`}
                            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-400 hover:text-emerald-300 hover:underline truncate py-1 px-2.5 rounded-lg bg-emerald-950/50 border border-emerald-700/60 transition-colors shadow-sm"
                          >
                            <span className="truncate">{row.publishedBacklinkUrl}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0 text-emerald-400" />
                          </a>

                          {/* Copy Link Button */}
                          <button
                            type="button"
                            onClick={e => handleCopyUrl(row.id, row.publishedBacklinkUrl!, e)}
                            title="Copy Exact Published Link to clipboard"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex-shrink-0 ${
                              isCopied
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-white" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-zinc-400" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-zinc-600 italic">
                          {row.finalResult === 'Pending Approval' 
                            ? 'Pending Approval (No live URL yet)' 
                            : row.finalResult === 'Processing'
                            ? 'Creating & verifying link...'
                            : '--'}
                        </span>
                      )}
                    </td>

                    {/* 6. Target URL (Fixed) */}
                    <td className="p-3 max-w-[180px]">
                      <div className="text-[11px] font-mono text-zinc-400 truncate" title={row.targetUrl}>
                        {row.targetUrl}
                      </div>
                    </td>

                    {/* 7. Anchor Text (Fixed) */}
                    <td className="p-3 max-w-[150px]">
                      <div className="text-xs font-medium text-zinc-200 truncate" title={row.anchorText}>
                        "{row.anchorText}"
                      </div>
                    </td>

                    {/* 8. Link Attribute */}
                    <td className="p-3 whitespace-nowrap">
                      {getRelBadge(row.linkAttribute)}
                    </td>

                    {/* 9. Verification Status */}
                    <td className="p-3 whitespace-nowrap">
                      {row.finalResult === 'Published and Verified' ? (
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Hyperlink Confirmed</span>
                        </span>
                      ) : row.finalResult === 'Pending Approval' ? (
                        <span className="text-[11px] text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>In Review</span>
                        </span>
                      ) : row.finalResult === 'Published but Unverified' ? (
                        <span className="text-[11px] text-blue-400">
                          Target URL Not in DOM
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-500 font-mono">Unchecked</span>
                      )}
                    </td>

                    {/* 10. Failure or Skip Reason */}
                    <td className="p-3 max-w-[220px]">
                      {row.finalResult === 'Published and Verified' ? (
                        <span className="text-[11px] text-emerald-500/90 font-medium">
                          Published successfully
                        </span>
                      ) : row.requiredManualAction ? (
                        <div className="text-[11px] text-orange-300 truncate" title={row.requiredManualAction}>
                          {row.requiredManualAction}
                        </div>
                      ) : row.failureOrSkipReason ? (
                        <div className="text-[11px] text-zinc-400 truncate" title={row.failureOrSkipReason}>
                          {row.failureOrSkipReason}
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-600">--</span>
                      )}
                    </td>

                    {/* 11. Last Checked Date */}
                    <td className="p-3 whitespace-nowrap font-mono text-[10px] text-zinc-500">
                      {row.lastVerificationDate 
                        ? new Date(row.lastVerificationDate).toLocaleTimeString() 
                        : row.lastAttemptDate 
                        ? new Date(row.lastAttemptDate).toLocaleTimeString() 
                        : '--'}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right whitespace-nowrap space-x-1">
                      {row.finalResult === 'Manual Action Required' && (
                        <button
                          onClick={() => onResolveManualAction(row)}
                          className="px-2 py-1 rounded bg-orange-950/60 hover:bg-orange-900 border border-orange-700/60 text-orange-200 text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          Resolve
                        </button>
                      )}

                      <button
                        onClick={() => onRetrySingle(row.id)}
                        title="Retry Website"
                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onViewDetails(row)}
                        title="Inspect Task Logs"
                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
