import React, { useState } from 'react';
import { Settings2, X, Check, Globe, Link as LinkIcon, User, Mail, FileText } from 'lucide-react';
import { CampaignDefaults } from '../types/index.ts';

interface CampaignSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaults: CampaignDefaults;
  onSave: (defaults: Partial<CampaignDefaults>) => void;
}

export const CampaignSettingsModal: React.FC<CampaignSettingsModalProps> = ({
  isOpen,
  onClose,
  defaults,
  onSave,
}) => {
  const [targetUrl, setTargetUrl] = useState(defaults.defaultTargetUrl);
  const [anchorText, setAnchorText] = useState(defaults.defaultAnchorText);
  const [email, setEmail] = useState(defaults.defaultEmail || '');
  const [authorName, setAuthorName] = useState(defaults.defaultAuthorName || '');
  const [bio, setBio] = useState(defaults.defaultBio || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      defaultTargetUrl: targetUrl,
      defaultAnchorText: anchorText,
      defaultEmail: email,
      defaultAuthorName: authorName,
      defaultBio: bio,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-750 rounded-2xl w-full max-w-lg shadow-2xl shadow-zinc-950/80 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Campaign Personas & Defaults
              </h2>
              <p className="text-xs text-zinc-400">
                Fallback attributes applied when spreadsheet cells are empty
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
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span>Default Target URL (Your Website) *</span>
            </label>
            <input
              type="url"
              required
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              placeholder="https://mysite.com/resources"
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>Default Anchor Text *</span>
            </label>
            <input
              type="text"
              required
              value={anchorText}
              onChange={e => setAnchorText(e.target.value)}
              placeholder="Authoritative Digital Agency"
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span>Author / Profile Name</span>
              </label>
              <input
                type="text"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="Elena Sterling"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>Outreach Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="outreach@company.com"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              <span>Author Bio Snippet</span>
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Senior tech strategist and research fellow writing on software optimization..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-zinc-100 to-zinc-300 hover:from-white hover:to-zinc-200 text-zinc-950 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Campaign Defaults</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
