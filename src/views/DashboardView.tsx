import React, { useState, useMemo } from 'react';
import type { Run, UnitSystem } from '../types/run';
import { storageService } from '../services/storage';
import { Card } from '../components/ui/Card';
import { RouteThumbnail } from '../components/ui/RouteThumbnail';
import { WorkoutCard } from '../components/plan/WorkoutCard';
import { formatDuration, formatPace, formatDate, formatDistance, formatWorkoutDate, formatFullWorkoutDate } from '../utils/formatters';
import { RefreshCw, ChevronDown, TrendingUp, TrendingDown, Minus, Sparkles, ArrowRight, ChevronRight, Moon } from 'lucide-react';
import { clsx } from 'clsx';

export const APP_VERSION = 'v2.0';

interface DashboardViewProps {
  runs: Run[];
  unitSystem: UnitSystem;
  onSelectRun: (runId: string) => void;
  onNavigateTab: (tab: any) => void;
  onOpenAddRun?: () => void;
  onRefresh?: () => Promise<void> | void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  runs,
  unitSystem,
  onSelectRun,
  onNavigateTab,
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefreshClick = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      // 1. Force Service Worker to check & fetch latest deploy from Vercel CDN immediately
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update().catch(() => {});
        }
      }

      // 2. Sync database runs & active plan
      if (onRefresh) {
        await onRefresh();
      } else {
        await storageService.syncWithServer();
      }
    } catch (_) {}

    // 3. Reload PWA page so new frontend code and version badge appear instantly!
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const months = useMemo(() => {
    const monthSet = new Set<string>();
    for (const r of runs) {
      if (r.date) {
        const d = new Date(r.date);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthSet.add(key);
        }
      }
    }
    const arr = Array.from(monthSet).sort().reverse();
    if (arr.length === 0) {
      const now = new Date();
      arr.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    }
    return arr;
  }, [runs]);

  const [selectedMonth, setSelectedMonth] = useState<string>(months[0] || '2026-08');

  const { currentMonthRuns, prevMonthRuns, prevMonthLabel } = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDateObj = new Date(year, month - 2, 1);
    const prevKey = `${prevDateObj.getFullYear()}-${String(prevDateObj.getMonth() + 1).padStart(2, '0')}`;
    const pLabel = prevDateObj.toLocaleDateString('en-US', { month: 'short' });

    const current = runs.filter((r) => r.date && r.date.startsWith(selectedMonth));
    const prev = runs.filter((r) => r.date && r.date.startsWith(prevKey));

    return { currentMonthRuns: current, prevMonthRuns: prev, prevMonthLabel: pLabel };
  }, [runs, selectedMonth]);

  const stats = useMemo(() => {
    const totalDist = currentMonthRuns.reduce((acc, r) => acc + (r.distance_km || 0), 0);
    const totalDuration = currentMonthRuns.reduce((acc, r) => acc + (r.duration_seconds || 0), 0);
    const runCount = currentMonthRuns.length;
    const avgPaceSec = totalDist > 0 ? Math.round(totalDuration / totalDist) : null;

    const prevDist = prevMonthRuns.reduce((acc, r) => acc + (r.distance_km || 0), 0);
    const prevCount = prevMonthRuns.length;
    const prevDuration = prevMonthRuns.reduce((acc, r) => acc + (r.duration_seconds || 0), 0);
    const prevAvgPace = prevDist > 0 ? Math.round(prevDuration / prevDist) : null;

    const distDiffPercent =
      prevDist > 0 ? (((totalDist - prevDist) / prevDist) * 100).toFixed(1) : null;
    const countDiff = prevCount > 0 ? runCount - prevCount : null;
    const paceDiffSec = avgPaceSec && prevAvgPace ? avgPaceSec - prevAvgPace : null;
    const timeDiffSec = prevDuration > 0 ? totalDuration - prevDuration : null;

    return {
      totalDist,
      totalDuration,
      runCount,
      avgPaceSec,
      distDiffPercent,
      countDiff,
      paceDiffSec,
      timeDiffSec,
      prevExists: prevMonthRuns.length > 0,
    };
  }, [currentMonthRuns, prevMonthRuns]);

  const recentDayGroups = useMemo(() => {
    const sorted = [...runs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const dayMap = new Map<string, {
      dateKey: string;
      formattedDate: string;
      runs: Run[];
      totalDistance: number;
      totalDuration: number;
      avgPaceSec: number | null;
    }>();

    for (const run of sorted) {
      const d = new Date(run.date);
      const dayKey = isNaN(d.getTime()) ? run.date : d.toISOString().split('T')[0];

      if (!dayMap.has(dayKey)) {
        if (dayMap.size >= 5) break; // Limit to latest 5 unique days
        dayMap.set(dayKey, {
          dateKey: dayKey,
          formattedDate: formatDate(run.date),
          runs: [],
          totalDistance: 0,
          totalDuration: 0,
          avgPaceSec: null,
        });
      }

      const dg = dayMap.get(dayKey)!;
      dg.runs.push(run);
      dg.totalDistance += run.distance_km || 0;
      dg.totalDuration += run.duration_seconds || 0;
    }

    return Array.from(dayMap.values()).map((dg) => ({
      ...dg,
      avgPaceSec: dg.totalDistance > 0 ? Math.round(dg.totalDuration / dg.totalDistance) : null,
    }));
  }, [runs]);


  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2.5">
          <img
            src="/apple-touch-icon.png"
            alt="Runno"
            className="w-8 h-8 rounded-xl object-contain shadow-soft-xs border border-neutral-200/60"
          />
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight leading-none">
              Dashboard
            </h1>
            <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md bg-orange-100/80 text-[#FF5500] border border-orange-200/90 shadow-2xs leading-none">
              {APP_VERSION}
            </span>
          </div>
        </div>

        <button
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className="relative p-2.5 rounded-full bg-white border border-neutral-200/80 text-neutral-700 shadow-soft-sm hover:bg-neutral-50 active:scale-95 transition-all disabled:opacity-75"
          aria-label="Refresh and sync data"
          title="Refresh Data"
        >
          <RefreshCw className={clsx("w-5 h-5 text-neutral-600 transition-transform", isRefreshing && "animate-spin text-[#FF5500]")} />
        </button>
      </div>


      {/* Month Dropdown */}
      <div className="relative inline-block">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="appearance-none bg-white border border-neutral-200/90 shadow-soft-sm rounded-2xl px-4 py-2 pr-9 text-sm font-bold text-neutral-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20"
        >
          {months.map((m) => {
            const [y, mon] = m.split('-').map(Number);
            const label = new Date(y, mon - 1, 1).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            });
            return (
              <option key={m} value={m}>
                {label}
              </option>
            );
          })}
        </select>
        <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* 4 Summary Cards (KPIs) */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Distance Card */}
        <Card className="p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Distance
            </span>
            <div className="mt-1 flex items-baseline">
              <span className="text-2xl font-black text-neutral-900 tracking-tight">
                {stats.totalDist.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-neutral-400 ml-1">
                {unitSystem === 'metric' ? 'km' : 'mi'}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center text-[11px] font-semibold">
            {stats.distDiffPercent !== null ? (
              <div className={`flex items-center ${Number(stats.distDiffPercent) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {Number(stats.distDiffPercent) >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-1 shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-1 shrink-0" />
                )}
                <span>
                  {Number(stats.distDiffPercent) >= 0 ? '+' : ''}
                  {stats.distDiffPercent}% vs {prevMonthLabel}
                </span>
              </div>
            ) : (
              <div className="flex items-center text-neutral-400">
                <Minus className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span>No previous data</span>
              </div>
            )}
          </div>
        </Card>

        {/* Runs Card */}
        <Card className="p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Runs
            </span>
            <div className="mt-1 flex items-baseline">
              <span className="text-2xl font-black text-neutral-900 tracking-tight">
                {stats.runCount}
              </span>
              <span className="text-xs font-semibold text-neutral-400 ml-1">runs</span>
            </div>
          </div>
          <div className="mt-2 flex items-center text-[11px] font-semibold">
            {stats.countDiff !== null ? (
              <div className={`flex items-center ${stats.countDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stats.countDiff >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-1 shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-1 shrink-0" />
                )}
                <span>
                  {stats.countDiff >= 0 ? '+' : ''}
                  {stats.countDiff} vs {prevMonthLabel}
                </span>
              </div>
            ) : (
              <div className="flex items-center text-neutral-400">
                <Minus className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span>No previous data</span>
              </div>
            )}
          </div>
        </Card>

        {/* Avg Pace Card */}
        <Card className="p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Avg Pace
            </span>
            <div className="mt-1 flex items-baseline">
              <span className="text-2xl font-black text-neutral-900 tracking-tight font-mono">
                {stats.avgPaceSec ? formatPace(stats.avgPaceSec, unitSystem, false) : '--:--'}
              </span>
              <span className="text-xs font-semibold text-neutral-400 ml-1">
                /{unitSystem === 'metric' ? 'km' : 'mi'}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center text-[11px] font-semibold">
            {stats.paceDiffSec !== null ? (
              <div className={`flex items-center ${stats.paceDiffSec <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stats.paceDiffSec <= 0 ? (
                  <TrendingDown className="w-3.5 h-3.5 mr-1 shrink-0" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5 mr-1 shrink-0" />
                )}
                <span>
                  {stats.paceDiffSec <= 0 ? '-' : '+'}
                  {Math.abs(Math.floor(stats.paceDiffSec / 60))}:
                  {String(Math.abs(stats.paceDiffSec % 60)).padStart(2, '0')} vs {prevMonthLabel}
                </span>
              </div>
            ) : (
              <div className="flex items-center text-neutral-400">
                <Minus className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span>No previous data</span>
              </div>
            )}
          </div>
        </Card>

        {/* Total Time Card */}
        <Card className="p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Total Time
            </span>
            <div className="mt-1 flex items-baseline">
              <span className="text-2xl font-black text-neutral-900 tracking-tight font-mono">
                {stats.totalDuration > 0 ? formatDuration(stats.totalDuration) : '00:00:00'}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center text-[11px] font-semibold">
            {stats.timeDiffSec !== null ? (
              <div className={`flex items-center ${stats.timeDiffSec >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stats.timeDiffSec >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-1 shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-1 shrink-0" />
                )}
                <span>
                  {stats.timeDiffSec >= 0 ? '+' : '-'}
                  {formatDuration(Math.abs(stats.timeDiffSec))} vs {prevMonthLabel}
                </span>
              </div>
            ) : (
              <div className="flex items-center text-neutral-400">
                <Minus className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span>No previous data</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Today's Training Session (from Active Training Plan) */}
      {(() => {
        const activePlan = storageService.getActivePlan();
        if (activePlan && activePlan.workouts) {
          const currentDayOfWeek = new Date().getDay();
          const todayWorkout = activePlan.workouts.find((w) => w.dayOfWeek === currentDayOfWeek);
          const todayIso = new Date().toISOString().split('T')[0];
          const matchingRun = runs.find((r) => r.date && r.date.split('T')[0] === todayIso);

          const dateBoundWorkout = todayWorkout ? {
            ...todayWorkout,
            date: todayIso,
            completed: Boolean(matchingRun),
            completedRunId: matchingRun?.id || null,
          } : null;

          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-400">
                  Today's Session
                </span>
                <button
                  onClick={() => onNavigateTab('coach')}
                  className="text-xs font-bold text-[#FF5500] hover:text-[#E64D00] flex items-center gap-1 active:scale-95 transition-all shrink-0"
                >
                  <span>Active Plan</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>


              {dateBoundWorkout ? (
                <WorkoutCard
                  workout={dateBoundWorkout}
                  unitSystem={unitSystem}
                  isToday={true}
                  date={new Date()}
                  onSelectRun={onSelectRun}
                  onSelectWorkout={() => onNavigateTab('coach')}
                />
              ) : (
                <Card
                  variant="interactive"
                  onClick={() => onNavigateTab('coach')}
                  className="p-3.5 bg-neutral-50/80 border border-neutral-200/80 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <Moon className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs font-bold text-neutral-700">Hari Istirahat / Tidak ada sesi hari ini</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Card>
              )}
            </div>
          );
        }

        return (
          <Card
            variant="interactive"
            onClick={() => onNavigateTab('coach')}
            className="p-3.5 bg-gradient-to-r from-orange-50/70 to-amber-50/50 border border-dashed border-orange-200 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-2xl bg-orange-100/80 text-[#FF5500] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900">
                  Buat Jadwal Lari dengan AI Coach
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Dapatkan program latihan pintar 5K, 10K, Half Marathon
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#FF5500] shrink-0" />
          </Card>
        );
      })()}


      {/* Recent Runs Section */}
      <div className="space-y-3 pt-1">

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900">Recent Runs</h2>
          {runs.length > 0 && (
            <button
              onClick={() => onNavigateTab('history')}
              className="text-xs font-bold text-[#FF5500] hover:text-[#E64D00] transition-colors"
            >
              See all
            </button>
          )}
        </div>

        {recentDayGroups.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm font-bold text-neutral-800">No runs logged yet</p>
            <p className="text-xs text-neutral-400 mt-1">
              Tap the orange <span className="font-bold text-[#FF5500]">+</span> button below to upload and analyze your first run screenshot!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentDayGroups.map((dayGroup) => {
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

              // MULTIPLE RUNS ON SAME DATE
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
        )}

      </div>
    </div>
  );
};
