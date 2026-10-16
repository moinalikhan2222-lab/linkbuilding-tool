import React from 'react';
import { User } from 'firebase/auth';
import { Shield, Sparkles, Mail, CheckCircle2, LogOut, Globe, Cpu } from 'lucide-react';
import { CampaignStatus } from '../types/index.ts';

interface HeaderProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  campaignStatus: CampaignStatus;
  isSigningIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSignIn,
  onSignOut,
  campaignStatus,
  isSigningIn,
}) => {
  const getStatusBadge = () => {
    switch (campaignStatus) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 shadow-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Agent Active
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/40">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Paused
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-600/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Campaign Completed
          </span>
        );
      case 'stopped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            Stopped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 text-zinc-400 border border-zinc-800">
            Ready
          </span>
        );
    }
  };

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-100 via-zinc-400 to-zinc-600 p-[1px] shadow-lg shadow-zinc-900/50">
            <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
              <Globe className="w-5 h-5 text-zinc-200" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                LinkPulse AI
              </h1>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/60 text-zinc-300">
                Playwright Engine
              </span>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <span>Automated SEO Backlink Engine</span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1 text-zinc-400">
                <Cpu className="w-3 h-3 text-zinc-400" />
                Gemini 2.5
              </span>
            </p>
          </div>
        </div>

        {/* Status & Gmail OAuth Integration */}
        <div className="flex items-center space-x-4">
          <div>{getStatusBadge()}</div>

          <div className="h-6 w-px bg-zinc-800 hidden sm:block"></div>

          {user ? (
            <div className="flex items-center space-x-3 bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-600/50 flex items-center justify-center">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-medium text-zinc-200 leading-none">
                  {user.email}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  Gmail Verification Active
                </div>
              </div>
              <button
                onClick={onSignOut}
                title="Disconnect Gmail & Revoke Token"
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              disabled={isSigningIn}
              className="group relative inline-flex items-center gap-2.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/80 hover:border-zinc-500 text-zinc-200 text-xs font-medium shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-60"
            >
              {/* Official Google Icon */}
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isSigningIn ? 'Connecting...' : 'Connect Gmail'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
