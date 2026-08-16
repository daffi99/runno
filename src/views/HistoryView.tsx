import React, { useState, useMemo } from 'react';
import type { Run, UnitSystem } from '../types/run';
import { Card } from '../components/ui/Card';
import { RouteThumbnail } from '../components/ui/RouteThumbnail';
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatPace,
} from '../utils/formatters';
import { Search, ChevronRight, X } from 'lucide-react';

interface HistoryViewProps {
  runs: Run[];
  unitSystem: UnitSystem;
  onSelectRun: (runId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  runs,
  unitSystem,
  onSelectRun,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [selectedSource, setSelectedSource] = useState<string>('all');

  const filteredRuns = useMemo(() => {
    return runs.filter((r) => {
      if (selectedSource !== 'all' && r.source !== selectedSource) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.source.toLowerCase().includes(q) ||
        r.date.includes(q) ||
        r.distance_km.toString().includes(q)
      );
    });
  }, [runs, searchQuery, selectedSource]);

  const groupedByMonth = useMemo(() => {
    const groups: { [key: string]: { runs: Run[]; totalDist: number; totalDuration: number } } = {};

    for (const r of filteredRuns) {
      const d = new Date(r.date);
      const monthKey = isNaN(d.getTime())
        ? 'Other'
        : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!groups[monthKey]) {
        groups[monthKey] = { runs: [], totalDist: 0, totalDuration: 0 };
      }

      groups[monthKey].runs.push(r);
      groups[monthKey].totalDist += r.distance_km || 0;
      groups[monthKey].totalDuration += r.duration_seconds || 0;
    }

    return Object.entries(groups).map(([month, data]) => ({
      month,
      runs: data.runs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      totalDist: data.totalDist,
      totalDuration: data.totalDuration,
      count: data.runs.length,
    }));
  }, [filteredRuns]);

  const availableSources = useMemo(() => {
    const s = new Set<string>();
    for (const r of runs) {
      if (r.source) s.add(r.source);
    }
    return Array.from(s);
  }, [runs]);

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-5">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">History</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2.5 rounded-full bg-white border border-neutral-200/80 text-neutral-700 shadow-soft-sm hover:bg-neutral-50 active:scale-95 transition-all"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="space-y-2.5 animate-in fade-in">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5" />
            <input
              type="text"
              placeholder="Search by source, date, distance..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedSource('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                selectedSource === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              All ({runs.length})
            </button>
            {availableSources.map((src) => (
              <button
                key={src}
                onClick={() => setSelectedSource(src)}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                  selectedSource === src
                    ? 'bg-[#FF5500] text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        </div>
      )}

      {groupedByMonth.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-semibold text-neutral-700">No runs match your filter</p>
          <p className="text-xs text-neutral-400 mt-1">Try resetting search or source filter.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedByMonth.map((group) => (
            <div key={group.month} className="space-y-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900">{group.month}</h2>
                <p className="text-xs text-neutral-400 font-medium">
                  {formatDistance(group.totalDist, unitSystem, true)} · {group.count} runs ·{' '}
                  {formatDuration(group.totalDuration)}
                </p>
              </div>

              <div className="space-y-2.5">
                {group.runs.map((run) => (
                  <Card
                    key={run.id}
                    variant="interactive"
                    onClick={() => onSelectRun(run.id)}
                    className="p-3.5 flex items-center space-x-3.5"
                  >
                    <RouteThumbnail routeData={run.route_data} width={64} height={52} />

                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-neutral-400 block">
                        {formatDate(run.date)}
                      </span>
                      <div className="flex items-baseline space-x-1 mt-0.5">
                        <span className="text-base font-black text-neutral-900">
                          {formatDistance(run.distance_km, unitSystem, true)}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-neutral-500 font-mono space-x-1.5 mt-0.5">
                        <span>{formatDuration(run.duration_seconds)}</span>
                        <span className="text-neutral-300">·</span>
                        <span>{formatPace(run.pace_seconds_per_km, unitSystem, true)}</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-neutral-300 pr-1">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
