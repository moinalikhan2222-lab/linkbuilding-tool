import React from 'react';
import { 
  Globe, 
  Activity, 
  ShieldCheck, 
  Clock, 
  XCircle, 
  SkipForward, 
  AlertTriangle 
} from 'lucide-react';
import { CampaignSummary } from '../types/index.ts';

interface StatsGridProps {
  summary: CampaignSummary;
  onFilterClick?: (status: string) => void;
  activeFilter?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ summary, onFilterClick, activeFilter }) => {
  const cards = [
    {
      id: 'ALL',
      label: 'Total Websites',
      value: summary.total,
      icon: Globe,
      color: 'text-zinc-200',
      bgColor: 'bg-zinc-900/70',
      borderColor: 'border-zinc-800',
    },
    {
      id: 'PROCESSED',
      label: 'Processed Websites',
      value: summary.processed,
      icon: Activity,
      color: 'text-zinc-300',
      bgColor: 'bg-zinc-900/70',
      borderColor: 'border-zinc-800',
    },
    {
      id: 'Published and Verified',
      label: 'Published & Verified',
      value: summary.verified,
      icon: ShieldCheck,
      color: 'text-emerald-300 font-bold',
      bgColor: 'bg-emerald-950/40',
      borderColor: 'border-emerald-700/60 shadow-lg shadow-emerald-950/40',
      badge: 'LIVE',
      highlight: true,
    },
    {
      id: 'Pending Approval',
      label: 'Pending Approval',
      value: summary.pending,
      icon: Clock,
      color: 'text-amber-300',
      bgColor: 'bg-amber-950/30',
      borderColor: 'border-amber-800/50',
    },
    {
      id: 'Failed',
      label: 'Failed Websites',
      value: summary.failed,
      icon: XCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-950/25',
      borderColor: 'border-rose-900/50',
    },
    {
      id: 'Skipped',
      label: 'Skipped Websites',
      value: summary.skipped,
      icon: SkipForward,
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-900/50',
      borderColor: 'border-zinc-800',
    },
    {
      id: 'Manual Action Required',
      label: 'Manual Action Req.',
      value: summary.manualAction,
      icon: AlertTriangle,
      color: 'text-orange-300',
      bgColor: 'bg-orange-950/30',
      borderColor: 'border-orange-800/50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map(card => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <div
            key={card.id}
            onClick={() => onFilterClick && onFilterClick(card.id)}
            className={`p-3.5 rounded-xl border ${card.borderColor} ${card.bgColor} backdrop-blur-sm transition-all duration-200 hover:border-zinc-500 cursor-pointer group flex flex-col justify-between ${
              isSelected ? 'ring-1 ring-zinc-400' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider truncate">
                {card.label}
              </span>
              <Icon className={`w-3.5 h-3.5 ${card.color} opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className={`text-2xl font-bold tracking-tight ${card.color}`}>
                {card.value}
              </span>
              {card.badge && (
                <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {card.badge}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
