import React, { useState } from 'react';
import { 
  Monitor, 
  Terminal, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink, 
  Cpu, 
  Clock, 
  Maximize2,
  Minimize2,
  ChevronRight
} from 'lucide-react';
import { BrowserLiveState, TaskLog } from '../types/index.ts';

interface BrowserInspectorProps {
  liveState: BrowserLiveState;
  activeRowLogs?: TaskLog[];
}

export const BrowserInspector: React.FC<BrowserInspectorProps> = ({
  liveState,
  activeRowLogs = [],
}) => {
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'success'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredLogs = activeRowLogs.filter(log => {
    if (logFilter === 'error') return log.level === 'error' || log.level === 'warn';
    if (logFilter === 'success') return log.level === 'success';
    return true;
  });

  const steps = [
    { name: 'Startup', label: 'Launch' },
    { name: 'Navigation', label: 'HTTP / DOM' },
    { name: 'Security Check', label: 'Anti-Bot' },
    { name: 'Opportunity', label: 'AI Inspect' },
    { name: 'Account', label: 'Auth / Reg' },
    { name: 'Gmail', label: 'Verify OTP' },
    { name: 'Submission', label: 'Submit Link' },
    { name: 'Live Verification', label: 'Check <a>' },
  ];

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-md">
      {/* Top Bar */}
      <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
          </div>
          <div className="h-4 w-px bg-zinc-800"></div>
          <div className="flex items-center space-x-2">
            <Monitor className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold text-zinc-200">
              Browser Automation Session
            </span>
            {liveState.isRunning ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                LIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                STANDBY
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {liveState.currentUrl && (
            <a
              href={liveState.currentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1 truncate max-w-xs transition-colors"
            >
              <span>{liveState.currentUrl}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded transition-colors cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Inspection Grid */}
      <div className={`grid grid-cols-1 ${isExpanded ? 'lg:grid-cols-12' : 'lg:grid-cols-2'} divide-y lg:divide-y-0 lg:divide-x divide-zinc-800`}>
        {/* Left: Live Visual Viewport */}
        <div className={`${isExpanded ? 'lg:col-span-7' : ''} p-4 flex flex-col justify-between bg-zinc-950/40`}>
          <div>
            {/* Active Action Banner */}
            <div className="mb-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                  Current Browser Action
                </span>
                <span className="text-xs font-semibold text-zinc-200">
                  {liveState.currentAction || 'Awaiting campaign execution trigger...'}
                </span>
              </div>
              {liveState.stepName && (
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {liveState.stepName}
                </span>
              )}
            </div>

            {/* Viewport Frame */}
            <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-inner aspect-video flex items-center justify-center">
              {liveState.screenshotBase64 ? (
                <img
                  src={liveState.screenshotBase64}
                  alt="Live Browser Session"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-500">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">
                    {liveState.isRunning ? 'Streaming browser viewport...' : 'Browser session ready for execution'}
                  </p>
                  <p className="text-[11px] text-zinc-600 font-mono">
                    Playwright Chromium Headless with anti-bot detection & DOM inspection
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Latest Error Callout */}
          {liveState.latestError && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/50 flex items-start gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="truncate">
                <span className="font-semibold">Recent Exception: </span>
                <span>{liveState.latestError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Execution Logs Terminal */}
        <div className={`${isExpanded ? 'lg:col-span-5' : ''} p-4 flex flex-col bg-zinc-950/60`}>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-300">
                Action Log Stream
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                ({filteredLogs.length} events)
              </span>
            </div>

            {/* Log filter buttons */}
            <div className="flex items-center space-x-1">
              {(['all', 'success', 'error'] as const).map(flt => (
                <button
                  key={flt}
                  onClick={() => setLogFilter(flt)}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded cursor-pointer capitalize transition-colors ${
                    logFilter === flt
                      ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {flt}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Output */}
          <div className="mt-3 flex-1 min-h-[220px] max-h-[320px] overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
            {filteredLogs.length === 0 ? (
              <div className="text-zinc-600 text-[11px] italic py-8 text-center">
                No active execution events yet. Start the campaign to stream real-time browser actions.
              </div>
            ) : (
              filteredLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-1.5 rounded flex items-start gap-2 leading-relaxed ${
                    log.level === 'error'
                      ? 'bg-rose-950/20 text-rose-300 border-l-2 border-rose-500'
                      : log.level === 'warn'
                      ? 'bg-amber-950/20 text-amber-300 border-l-2 border-amber-500'
                      : log.level === 'success'
                      ? 'bg-emerald-950/20 text-emerald-300 border-l-2 border-emerald-500'
                      : 'text-zinc-300 hover:bg-zinc-900/60'
                  }`}
                >
                  <span className="text-[10px] text-zinc-500 flex-shrink-0 mt-0.5">
                    {log.timestamp}
                  </span>
                  {log.step && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded flex-shrink-0">
                      [{log.step}]
                    </span>
                  )}
                  <span className="break-all text-[11px]">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
