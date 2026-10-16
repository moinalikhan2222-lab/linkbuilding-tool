import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, X, Check, ArrowRight } from 'lucide-react';
import { WebsiteRow } from '../types/index.ts';

interface ManualActionModalProps {
  row: WebsiteRow | null;
  onClose: () => void;
  onResolve: (id: string, note: string) => void;
}

export const ManualActionModal: React.FC<ManualActionModalProps> = ({ row, onClose, onResolve }) => {
  const [note, setNote] = useState('');

  if (!row) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onResolve(row.id, note || 'Manual intervention completed in browser');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-750 rounded-2xl w-full max-w-lg shadow-2xl shadow-zinc-950/80 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-orange-950/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-950 border border-orange-700/60 flex items-center justify-center text-orange-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-orange-200">
                Manual Action Required
              </h2>
              <p className="text-xs text-orange-300/70 font-mono">
                {row.websiteName} (Row #{row.originalRowNumber})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
              Security Barrier Detected
            </span>
            <p className="text-xs text-zinc-200 font-medium">
              {row.requiredManualAction || 'CAPTCHA, MFA, or phone verification required on target page.'}
            </p>
            <div className="pt-2">
              <a
                href={row.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:underline font-mono"
              >
                <span>Open {row.websiteUrl} to solve</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Resolution Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g., Solved reCAPTCHA challenge / Provided 2FA code"
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="text-[11px] text-zinc-500 italic">
            Per policy, the agent did not bypass anti-bot mechanisms. Once resolved, the agent will resume processing this prospect.
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Keep Skipped
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-300 hover:to-amber-400 text-zinc-950 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Resolved & Resume</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
