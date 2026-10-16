import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Terminal, 
  Eye, 
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { WebsiteRow } from '../types/index.ts';

interface RowDetailsModalProps {
  row: WebsiteRow | null;
  onClose: () => void;
  onRetry: (id: string) => void;
}

export const RowDetailsModal: React.FC<RowDetailsModalProps> = ({ row, onClose, onRetry }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!row) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-750 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-zinc-950/80">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono px-2 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              Row #{row.originalRowNumber}
            </span>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>{row.websiteName}</span>
                <span className="text-xs font-normal text-zinc-400 font-mono">
                  ({row.preferredBacklinkType || 'Profile Link'})
                </span>
              </h2>
              <a
                href={row.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono transition-colors"
              >
                <span>{row.websiteUrl}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onRetry(row.id);
                onClose();
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-650 transition-colors cursor-pointer"
            >
              Retry Row
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Outcome Banner */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-mono text-zinc-500 uppercase">
                Final Result
              </div>
              <div className="text-sm font-bold text-zinc-100 mt-0.5">
                {row.finalResult}
              </div>
              {row.failureOrSkipReason && (
                <div className="text-xs text-zinc-400 mt-1">
                  {row.failureOrSkipReason}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono">
              <div className="text-right">
                <span className="text-zinc-500 block text-[10px]">HTTP Code</span>
                <span className="text-zinc-200 font-semibold">{row.httpStatus || 200}</span>
              </div>
              <div className="h-6 w-px bg-zinc-800"></div>
              <div className="text-right">
                <span className="text-zinc-500 block text-[10px]">Link Rel</span>
                <span className="text-emerald-400 font-semibold">{row.linkAttribute}</span>
              </div>
            </div>
          </div>

          {/* Grid of Key Properties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
              <span className="text-[11px] text-zinc-500 font-medium">Target URL (My Website)</span>
              <div className="font-mono text-zinc-200 break-all">{row.targetUrl}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
              <span className="text-[11px] text-zinc-500 font-medium">Anchor Text</span>
              <div className="font-semibold text-zinc-100">"{row.anchorText}"</div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
              <span className="text-[11px] text-zinc-500 font-medium">Account & Credentials</span>
              <div className="text-zinc-300">
                User: <span className="font-mono text-zinc-100">{row.username || 'Auto-generated'}</span>
              </div>
              <div className="text-zinc-400 flex items-center gap-2">
                <span>Password:</span>
                <span className="font-mono">
                  {showPassword ? (row.hasPassword ? '••••••••••••' : 'Generated & Encrypted') : '••••••••'}
                </span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
              <span className="text-[11px] text-zinc-500 font-medium">Email Verification (Gmail API)</span>
              <div className="font-mono text-zinc-300">{row.emailVerificationStatus || 'Pending'}</div>
              <div className="text-[10px] text-zinc-500">
                Checked via authorized Gmail OAuth 2.0 inbox scan
              </div>
            </div>

            {row.publishedBacklinkUrl && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-700/60 col-span-1 sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Exact Live Published Backlink URL
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    CONFIRMED LIVE
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 rounded-lg bg-zinc-950/80 border border-emerald-900/50">
                  <a
                    href={row.publishedBacklinkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-emerald-300 hover:text-emerald-200 hover:underline flex items-center gap-1.5 break-all"
                  >
                    <span>{row.publishedBacklinkUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                  <button
                    onClick={() => handleCopy(row.publishedBacklinkUrl!)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Screenshot Preview if Available */}
          {row.screenshotUrl && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-300">
                Browser Viewport Capture
              </div>
              <div className="rounded-xl border border-zinc-800 overflow-hidden bg-black max-h-72">
                <img
                  src={row.screenshotUrl}
                  alt="Browser Viewport"
                  className="w-full object-cover object-top"
                />
              </div>
            </div>
          )}

          {/* Task Audit Logs */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-300">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <span>Full Task Audit Trail</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-xs max-h-52 overflow-y-auto space-y-1">
              {row.logs.length === 0 ? (
                <div className="text-zinc-600 italic">No execution logs for this row.</div>
              ) : (
                row.logs.map((l, i) => (
                  <div key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-zinc-600 text-[10px] flex-shrink-0">
                      {l.timestamp}
                    </span>
                    <span
                      className={`text-[11px] ${
                        l.level === 'error'
                          ? 'text-rose-400'
                          : l.level === 'warn'
                          ? 'text-amber-400'
                          : l.level === 'success'
                          ? 'text-emerald-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {l.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
