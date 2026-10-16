import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Download, 
  Upload, 
  Sparkles, 
  Settings2,
  ListCheck
} from 'lucide-react';
import { CampaignStatus } from '../types/index.ts';

interface CampaignControlsProps {
  status: CampaignStatus;
  selectedCount: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRetrySelected: () => void;
  onOpenUpload: () => void;
  onRunTestSample: () => void;
  onOpenDefaults: () => void;
  onExportExcel: () => void;
  totalRows: number;
}

export const CampaignControls: React.FC<CampaignControlsProps> = ({
  status,
  selectedCount,
  onStart,
  onPause,
  onResume,
  onStop,
  onRetrySelected,
  onOpenUpload,
  onRunTestSample,
  onOpenDefaults,
  onExportExcel,
  totalRows,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
      {/* Primary Execution Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {status === 'idle' || status === 'completed' || status === 'stopped' ? (
          <button
            onClick={onStart}
            disabled={totalRows === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-zinc-100 via-slate-100 to-zinc-300 hover:from-white hover:to-zinc-200 text-zinc-950 text-xs font-bold shadow-md shadow-zinc-950/60 transition-all cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Campaign</span>
          </button>
        ) : status === 'running' ? (
          <button
            onClick={onPause}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer active:scale-98"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause Agent</span>
          </button>
        ) : (
          <button
            onClick={onResume}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer active:scale-98"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume Campaign</span>
          </button>
        )}

        {status === 'running' && (
          <button
            onClick={onStop}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current text-rose-400" />
            <span>Stop</span>
          </button>
        )}

        {selectedCount > 0 && (
          <button
            onClick={onRetrySelected}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-700/60 text-sky-200 text-xs font-semibold transition-all cursor-pointer shadow-sm animate-pulse"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Selected ({selectedCount})</span>
          </button>
        )}
      </div>

      {/* Tooling & Import/Export Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-750 hover:border-zinc-500 text-zinc-200 text-xs font-medium transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-zinc-400" />
          <span>Upload Spreadsheet</span>
        </button>

        <button
          onClick={onRunTestSample}
          title="Load demonstration test suite with various opportunity and verification scenarios"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <span>Test Run Sample</span>
        </button>

        <button
          onClick={onOpenDefaults}
          title="Configure Target URL, Default Anchor Text, and Author Persona"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>Campaign Settings</span>
        </button>

        <button
          onClick={onExportExcel}
          disabled={totalRows === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-650 hover:border-zinc-400 text-zinc-100 text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export Excel Report</span>
        </button>
      </div>
    </div>
  );
};
