import React, { useState, useEffect } from 'react';
import { Globe, Link as LinkIcon, Check, Sparkles, HelpCircle } from 'lucide-react';
import { CampaignDefaults } from '../types/index.ts';

interface TargetConfigBarProps {
  defaults: CampaignDefaults;
  onSave: (defaults: Partial<CampaignDefaults>) => Promise<void>;
  totalRows: number;
}

export const TargetConfigBar: React.FC<TargetConfigBarProps> = ({
  defaults,
  onSave,
  totalRows,
}) => {
  const [targetUrl, setTargetUrl] = useState(defaults.defaultTargetUrl || '');
  const [anchorText, setAnchorText] = useState(defaults.defaultAnchorText || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTargetUrl(defaults.defaultTargetUrl || '');
    setAnchorText(defaults.defaultAnchorText || '');
  }, [defaults.defaultTargetUrl, defaults.defaultAnchorText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        defaultTargetUrl: targetUrl.trim(),
        defaultAnchorText: anchorText.trim() || 'Official Website',
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save target config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-900/80 border border-zinc-750 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Title & Info */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-600 flex items-center justify-center flex-shrink-0 text-zinc-100 shadow-md">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-100">
                Target Website & Anchor Text (Apki Website)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
                Destination
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Yahan apni website ka URL aur keyword/anchor text enter karein jispar backlinks bananay hain.
            </p>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="flex-1 w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Target URL Input */}
          <div className="relative flex-1">
            <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="url"
              required
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              placeholder="Target URL: https://meriwebsite.com"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700/80 hover:border-zinc-500 focus:border-zinc-300 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors font-mono"
            />
          </div>

          {/* Anchor Text Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              required
              value={anchorText}
              onChange={e => setAnchorText(e.target.value)}
              placeholder="Anchor Text / Keyword"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700/80 hover:border-zinc-500 focus:border-zinc-300 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-zinc-100 via-slate-100 to-zinc-300 hover:from-white hover:to-zinc-200 text-zinc-950 text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap active:scale-98 disabled:opacity-50"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved & Applied!</span>
              </>
            ) : (
              <span>{isSaving ? 'Saving...' : 'Set Target Link'}</span>
            )}
          </button>
        </form>
      </div>

      {/* Helper Context Banner */}
      <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-[11px] text-zinc-400 gap-2">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
          <span>
            Current Active Link: <strong className="text-zinc-200 font-mono">{defaults.defaultTargetUrl || 'Not configured'}</strong> | Anchor: <strong className="text-zinc-200">"{defaults.defaultAnchorText || 'None'}"</strong>
          </span>
        </div>
        <div className="text-zinc-500 text-[10px]">
          Spreadsheet rows will automatically use this target URL unless row-specific target URLs are provided.
        </div>
      </div>
    </div>
  );
};
