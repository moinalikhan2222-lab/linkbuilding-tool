import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Link as LinkIcon, 
  Plus, 
  Sparkles, 
  Trash2, 
  Check, 
  ArrowRight,
  Layers,
  Settings2,
  HelpCircle,
  FileText
} from 'lucide-react';
import { CampaignDefaults } from '../types/index.ts';

interface SimplifiedUrlInputProps {
  defaults: CampaignDefaults;
  onUpdateDefaults: (defaults: Partial<CampaignDefaults>) => Promise<void>;
  onAddUrls: (rawText: string, replaceExisting: boolean) => Promise<{ addedCount: number; duplicatesSkipped: number }>;
  onClearUrls: () => Promise<void>;
  totalRows: number;
  onStartCampaign: () => void;
  isRunning: boolean;
}

export const SimplifiedUrlInput: React.FC<SimplifiedUrlInputProps> = ({
  defaults,
  onUpdateDefaults,
  onAddUrls,
  onClearUrls,
  totalRows,
  onStartCampaign,
  isRunning,
}) => {
  const [targetUrl, setTargetUrl] = useState(defaults.defaultTargetUrl || '');
  const [anchorText, setAnchorText] = useState(defaults.defaultAnchorText || '');
  const [bio, setBio] = useState(defaults.defaultBio || 'Professional digital consultant & tech analyst.');
  const [urlsText, setUrlsText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setTargetUrl(defaults.defaultTargetUrl || '');
    setAnchorText(defaults.defaultAnchorText || '');
    if (defaults.defaultBio) setBio(defaults.defaultBio);
  }, [defaults.defaultTargetUrl, defaults.defaultAnchorText, defaults.defaultBio]);

  // Count URLs in textarea
  const linesCount = urlsText
    .split(/[\r\n,]+/)
    .map(l => l.trim())
    .filter(l => Boolean(l)).length;

  const handleSaveSettings = async () => {
    if (!targetUrl.trim() || !anchorText.trim()) {
      setFeedback('Please enter both Target URL and Anchor Text');
      return;
    }
    await onUpdateDefaults({
      defaultTargetUrl: targetUrl.trim(),
      defaultAnchorText: anchorText.trim(),
      defaultBio: bio.trim(),
    });
    setIsSaved(true);
    setFeedback('Target URL & Anchor Text saved! Will be used for all websites.');
    setTimeout(() => {
      setIsSaved(false);
      setFeedback(null);
    }, 3500);
  };

  const handleAddUrls = async (replace = false) => {
    if (!urlsText.trim()) {
      setFeedback('Please paste at least one website URL');
      return;
    }
    if (!targetUrl.trim() || !anchorText.trim()) {
      setFeedback('Please define your Target URL and Anchor Text above first');
      return;
    }

    // Auto-save defaults if updated
    await onUpdateDefaults({
      defaultTargetUrl: targetUrl.trim(),
      defaultAnchorText: anchorText.trim(),
      defaultBio: bio.trim(),
    });

    const res = await onAddUrls(urlsText, replace);
    setFeedback(`Added ${res.addedCount} new website(s) to campaign! (${res.duplicatesSkipped} duplicates skipped)`);
    setUrlsText('');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleLoadSample = () => {
    const sample = `https://dev.to
https://wikipedia.org
https://medium.com
https://github.com
https://nowsecure.nl
https://httpbin.org`;
    setUrlsText(sample);
  };

  return (
    <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-750 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-5">
      {/* Step Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 shadow-md">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span>Simplified Campaign Setup</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                Single Fixed Target
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Configure your website target & keyword once, then paste target prospect URLs below.
            </p>
          </div>
        </div>

        {totalRows > 0 && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-zinc-400 font-mono">
              Campaign Queue: <strong className="text-emerald-400">{totalRows}</strong> website(s)
            </span>
            <button
              onClick={onClearUrls}
              disabled={isRunning}
              title="Clear all queued prospect URLs"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-30"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Grid: Left = Fixed Target & Anchor | Right = Bulk Website URLs Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 Cols): Fixed Target URL & Anchor Text */}
        <div className="lg:col-span-5 space-y-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>1. Your Website & Keyword (Fixed)</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Same for all sites</span>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              My Target Website URL *
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="url"
                required
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                placeholder="https://mywebsite.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">
              The page you want to build backlinks to.
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Anchor Text / Keyword *
            </label>
            <div className="relative">
              <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                required
                value={anchorText}
                onChange={e => setAnchorText(e.target.value)}
                placeholder="e.g. Best SEO Automation Platform"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">
              The clickable link text to use on every website.
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Author Bio / Description Snippet
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Experienced industry specialist & researcher..."
              className="w-full px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Settings2 className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{isSaved ? 'Saved Target Settings' : 'Update Target Settings'}</span>
          </button>
        </div>

        {/* Right Column (7 Cols): Paste Website URLs */}
        <div className="lg:col-span-7 space-y-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>2. Prospect Website URLs (Paste One Per Line)</span>
              </span>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Paste Sample URLs</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 mb-2">
              Simply paste the websites where you want to create backlinks (no spreadsheet needed).
            </p>

            <div className="relative">
              <textarea
                rows={6}
                value={urlsText}
                onChange={e => setUrlsText(e.target.value)}
                placeholder={`https://dev.to\nhttps://wikipedia.org\nhttps://medium.com\nhttps://example-directory.com`}
                className="w-full p-3 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono transition-colors resize-y leading-relaxed"
              />
              {linesCount > 0 && (
                <div className="absolute right-3 bottom-3 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 pointer-events-none">
                  {linesCount} URL{linesCount > 1 ? 's' : ''} ready
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons for URL queue */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddUrls(false)}
                disabled={!urlsText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-650 hover:border-zinc-500 text-zinc-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add URLs to List</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddUrls(true)}
                disabled={!urlsText.trim()}
                title="Replace existing list with these URLs"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
              >
                <span>Replace All</span>
              </button>
            </div>

            {totalRows > 0 && !isRunning && (
              <button
                type="button"
                onClick={onStartCampaign}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 hover:from-emerald-300 hover:to-teal-200 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-950/40 transition-all cursor-pointer active:scale-98"
              >
                <span>Start Campaign ({totalRows} Sites)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Feedback Toast */}
      {feedback && (
        <div className="p-2.5 rounded-xl bg-zinc-950 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
};
