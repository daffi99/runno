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

  interface DayRunGroup {
    dateKey: string;
    formattedDate: string;
    runs: Run[];
    totalDistance: number;
    totalDuration: number;
    avgPaceSec: number | null;
  }

  interface MonthRunGroup {
    month: string;
    dayGroups: DayRunGroup[];
    totalDist: number;
    totalDuration: number;
    count: number;
  }

  const groupedByMonth = useMemo<MonthRunGroup[]>(() => {
    const monthMap = new Map<string, { runs: Run[]; totalDist: number; totalDuration: number }>();

    for (const r of filteredRuns) {
      const d = new Date(r.date);
      const monthKey = isNaN(d.getTime())
        ? 'Other'
        : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { runs: [], totalDist: 0, totalDuration: 0 });
      }
      const mData = monthMap.get(monthKey)!;
      mData.runs.push(r);
      mData.totalDist += r.distance_km || 0;
      mData.totalDuration += r.duration_seconds || 0;
    }

    return Array.from(monthMap.entries()).map(([month, data]) => {
      // Sort runs descending by date
      const sortedRuns = [...data.runs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Group runs by dayKey (e.g. "2026-08-16")
      const dayMap = new Map<string, DayRunGroup>();

      for (const run of sortedRuns) {
        const d = new Date(run.date);
        const dayKey = isNaN(d.getTime()) ? run.date : d.toISOString().split('T')[0];

        if (!dayMap.has(dayKey)) {
          dayMap.set(dayKey, {
            dateKey: dayKey,
            formattedDate: formatDate(run.date),
            runs: [],
            totalDistance: 0,
            totalDuration: 0,
            avgPaceSec: null,
          });
        }

        const dayGroup = dayMap.get(dayKey)!;
        dayGroup.runs.push(run);
        dayGroup.totalDistance += run.distance_km || 0;
        dayGroup.totalDuration += run.duration_seconds || 0;
      }

      const dayGroups = Array.from(dayMap.values()).map((dg) => ({
        ...dg,
        avgPaceSec: dg.totalDistance > 0 ? Math.round(dg.totalDuration / dg.totalDistance) : null,
      }));

      return {
        month,
        dayGroups,
        totalDist: data.totalDist,
        totalDuration: data.totalDuration,
        count: sortedRuns.length,
      };
    });
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

              <div className="space-y-3">
                {group.dayGroups.map((dayGroup) => {
                  // SINGLE RUN ON THIS DAY: standard sleek card
                  if (dayGroup.runs.length === 1) {
                    const run = dayGroup.runs[0];
                    return (
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
                            {run.avg_heart_rate && (
                              <>
                                <span className="text-neutral-300">·</span>
                                <span>{run.avg_heart_rate} bpm</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-neutral-300 pr-1">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </Card>
                    );
                  }

                  // MULTIPLE RUNS ON SAME DATE: Joined Multi-Session Day Card
                  return (
                    <Card
                      key={dayGroup.dateKey}
                      className="p-3.5 space-y-2.5 bg-white border border-neutral-200/80 shadow-soft-xs"
                    >
                      {/* Day Header with Combined Stats */}
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-[#FF5500]" />
                          <span className="text-xs font-bold text-neutral-900">
                            {dayGroup.formattedDate}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-50 text-[#FF5500] border border-orange-200/60">
                            {dayGroup.runs.length} Sessions
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-neutral-900 font-mono">
                            {formatDistance(dayGroup.totalDistance, unitSystem, true)}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-mono block">
                            {formatDuration(dayGroup.totalDuration)} · {formatPace(dayGroup.avgPaceSec, unitSystem, true)}
                          </span>
                        </div>
                      </div>

                      {/* Individual Sessions List inside the same day */}
                      <div className="space-y-1.5">
                        {dayGroup.runs.map((run, idx) => (
                          <div
                            key={run.id}
                            onClick={() => onSelectRun(run.id)}
                            className="p-2.5 rounded-2xl bg-neutral-50/70 hover:bg-orange-50/40 border border-neutral-100 hover:border-orange-200/60 flex items-center space-x-3 cursor-pointer transition-all active:scale-[0.99] group"
                          >
                            <RouteThumbnail routeData={run.route_data} width={50} height={42} />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                                  Session {idx + 1}
                                </span>
                                {run.date && run.date.includes('T') && (
                                  <span className="text-[10px] text-neutral-400 font-mono">
                                    {new Date(run.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                                {run.source && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-neutral-200/60 text-neutral-500">
                                    {run.source}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-baseline space-x-2 mt-0.5">
                                <span className="text-sm font-black text-neutral-900 font-mono">
                                  {formatDistance(run.distance_km, unitSystem, true)}
                                </span>
                                <span className="text-xs text-neutral-500 font-mono">
                                  {formatDuration(run.duration_seconds)}
                                </span>
                                <span className="text-xs text-neutral-400 font-mono">
                                  · {formatPace(run.pace_seconds_per_km, unitSystem, true)}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 text-neutral-300 group-hover:text-[#FF5500] pr-1 transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

