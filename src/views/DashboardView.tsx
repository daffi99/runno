import React, { useState, useMemo } from 'react';
import type { Run, UnitSystem, PlanWorkout } from '../types/run';
import { storageService } from '../services/storage';
import { RouteThumbnail } from '../components/ui/RouteThumbnail';
import { formatDuration, formatPace, formatDate, formatDistance } from '../utils/formatters';
import { RefreshCw, Sparkles, ArrowRight, ChevronRight, Activity, BarChart2 } from 'lucide-react';
import { clsx } from 'clsx';

export const APP_VERSION = 'v2.5';

/* ── Circular Progress Ring ── */
const CircularProgress = ({ percent, size = 56 }: { percent: number; size?: number }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#2A2A2A" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#FF5500" strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
        {Math.round(percent)}%
      </span>
    </div>
  );
};

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
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update().catch(() => {});
        }
      }

      if (onRefresh) {
        await onRefresh();
      } else {
        await storageService.syncWithServer();
      }
    } catch (_) {}

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
        if (dayMap.size >= 5) break;
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
    <div className="space-y-5 pb-28 max-w-md mx-auto px-4 pt-4">

      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-3">
          <img
            src="/apple-touch-icon.png"
            alt="Runno"
            className="w-11 h-11 rounded-2xl object-contain ring-2 ring-white/10 shadow-md"
          />
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-neutral-400 leading-none">Hello there! 👋</p>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/25">
                {APP_VERSION}
              </span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight leading-tight mt-0.5">
              Daffi
            </h1>
          </div>
        </div>

        <button
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className="relative p-2.5 rounded-2xl bg-[#1E1E1E] border border-white/5 text-neutral-300 hover:text-white active:scale-95 transition-all disabled:opacity-75 shadow-soft-sm"
          aria-label="Refresh and sync data"
          title="Refresh Data"
        >
          <RefreshCw className={clsx("w-5 h-5 text-neutral-300 transition-transform", isRefreshing && "animate-spin text-[#FF5500]")} />
        </button>
      </div>

      {/* ═══ TWO FEATURE CARDS ═══ */}
      <div className="grid grid-cols-2 gap-3">

        {/* LEFT CARD: Workout Plan (Orange) - 3 weekly running workouts checklist */}
        <div
          onClick={() => onNavigateTab('coach')}
          className="bg-[#FF5500] rounded-3xl p-4 cursor-pointer active:scale-[0.98] transition-all min-h-[220px] flex flex-col justify-between relative overflow-hidden shadow-lg shadow-orange-950/20"
        >
          <div className="absolute top-2 right-2 w-14 h-14 rounded-full border-2 border-dashed border-white/20 pointer-events-none" />
          <div className="w-full">
            <h3 className="text-sm font-black text-white whitespace-nowrap tracking-tight">
              Workout Plan
            </h3>

            {/* List of 3 weekly run workouts with completion checklist (Running only, no rest) */}
            {(() => {
              const activePlan = storageService.getActivePlan();
              if (activePlan && activePlan.workouts) {
                const currentPlanWeek = activePlan.currentWeek || 1;
                const currentWeekWorkouts = (activePlan.weeklySchedules && activePlan.weeklySchedules[currentPlanWeek]) || activePlan.workouts;
                
                // Strictly filter running sessions only (exclude rest and 0km)
                const isRestWorkout = (w: PlanWorkout) => {
                  const typeStr = (w.type || '').toLowerCase();
                  const titleStr = (w.title || '').toLowerCase();
                  const descStr = (w.description || '').toLowerCase();
                  const dist = Number(w.distanceKm || 0);
                  return typeStr === 'rest' || dist === 0 || titleStr.includes('istirahat') || titleStr.includes('rest') || descStr.includes('istirahat') || descStr.includes('rest');
                };

                const runWorkouts = currentWeekWorkouts.filter((w) => !isRestWorkout(w));
                const displayWorkouts = runWorkouts.slice(0, 3);
                const currentDayOfWeek = new Date().getDay();

                if (displayWorkouts.length === 0) {
                  return (
                    <p className="text-[11px] text-white/70 font-medium mt-3">No running sessions this week</p>
                  );
                }

                return (
                  <div className="space-y-2 mt-3">
                    {displayWorkouts.map((w, idx) => {
                      const dist = Number(w.distanceKm || 0);
                      const dayOffset = w.dayOfWeek - currentDayOfWeek;
                      const workoutDate = new Date();
                      workoutDate.setDate(workoutDate.getDate() + dayOffset);
                      const wIso = workoutDate.toISOString().split('T')[0];
                      
                      const hasLoggedRun = runs.some(r => r.date && r.date.split('T')[0] === wIso);
                      const isCompleted = Boolean(w.completed || hasLoggedRun);

                      return (
                        <div
                          key={w.id || idx}
                          className="flex items-center space-x-2.5 bg-black/15 hover:bg-black/25 p-2.5 rounded-2xl transition-colors"
                        >
                          <div className={clsx(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                            isCompleted ? 'border-white bg-white text-[#FF5500]' : 'border-white/70 bg-transparent'
                          )}>
                            {isCompleted && <span className="text-[10px] font-black leading-none">✓</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={clsx("text-xs font-black text-white truncate", isCompleted && "line-through opacity-75")}>
                              {w.title || w.type}
                            </p>
                            <p className="text-[10px] text-white/80 font-mono font-medium mt-0.5 leading-none">
                              {dist > 0 ? `${dist} km` : ''} · {w.dayName ? w.dayName.slice(0, 3) : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }
              return (
                <div className="mt-3">
                  <p className="text-[11px] text-white/80 font-medium">No plan active</p>
                  <p className="text-[10px] text-white/60">Tap to create one</p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* RIGHT CARD: Stats Section (Soft Lavender) */}
        <div
          onClick={() => onNavigateTab('stats')}
          className="bg-[#C5CAE9] rounded-3xl p-4 cursor-pointer active:scale-[0.98] transition-all min-h-[220px] flex flex-col justify-between relative overflow-hidden shadow-lg shadow-indigo-950/20"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-800">
                Monthly Stats
              </span>
              <BarChart2 className="w-4 h-4 text-neutral-800" />
            </div>

            <div className="mt-3">
              <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block leading-tight">Total Distance</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-4xl font-black text-neutral-950 font-mono tracking-tight">
                  {stats.totalDist.toFixed(1)}
                </span>
                <span className="text-sm font-black text-neutral-700">
                  {unitSystem === 'metric' ? 'km' : 'mi'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-neutral-400/40">
              <div>
                <span className="text-[10px] font-bold text-neutral-600 block uppercase">Runs</span>
                <span className="text-base font-black text-neutral-950 font-mono">{stats.runCount}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-600 block uppercase">Avg Pace</span>
                <span className="text-base font-black text-neutral-950 font-mono">
                  {stats.avgPaceSec ? formatPace(stats.avgPaceSec, unitSystem, false) : '--:--'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-[10px] font-bold text-neutral-600 block uppercase leading-none">Time</span>
              <span className="text-sm font-black text-neutral-950 font-mono mt-0.5 block">
                {stats.totalDuration > 0 ? formatDuration(stats.totalDuration) : '00:00'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-neutral-950 flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform shrink-0">
              <ChevronRight className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ WEEK PROGRESS CARD (Dynamic Week & Mileage Progress) ═══ */}
      {(() => {
        // Calculate current week runs & mileage from Monday to Sunday
        const now = new Date();
        const currentDay = now.getDay();
        const diffToMon = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMon);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const weekRuns = runs.filter((r) => {
          if (!r.date) return false;
          const d = new Date(r.date);
          return !isNaN(d.getTime()) && d >= monday && d <= sunday;
        });

        const weekLoggedKm = weekRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0);

        const activePlan = storageService.getActivePlan();
        if (activePlan && activePlan.workouts) {
          const currentPlanWeek = activePlan.currentWeek || 1;
          const totalWeeks = activePlan.totalWeeks || 8;
          const currentWeekWorkouts = (activePlan.weeklySchedules && activePlan.weeklySchedules[currentPlanWeek]) || activePlan.workouts;

          const isRestWorkout = (w: PlanWorkout) => {
            const typeStr = (w.type || '').toLowerCase();
            const titleStr = (w.title || '').toLowerCase();
            const descStr = (w.description || '').toLowerCase();
            const dist = Number(w.distanceKm || 0);
            return typeStr === 'rest' || dist === 0 || titleStr.includes('istirahat') || titleStr.includes('rest') || descStr.includes('istirahat') || descStr.includes('rest');
          };

          const nonRestWorkouts = currentWeekWorkouts.filter((w) => !isRestWorkout(w));
          const totalWorkouts = nonRestWorkouts.length;
          const targetKm = nonRestWorkouts.reduce((sum, w) => sum + Number(w.distanceKm || 0), 0);

          const completedCount = nonRestWorkouts.filter((w) => {
            const dayOffset = w.dayOfWeek - currentDay;
            const workoutDate = new Date(now);
            workoutDate.setDate(now.getDate() + dayOffset);
            const wIso = workoutDate.toISOString().split('T')[0];
            return runs.some((r) => r.date && r.date.split('T')[0] === wIso);
          }).length;

          const percent = targetKm > 0
            ? Math.min(100, Math.round((weekLoggedKm / targetKm) * 100))
            : (totalWorkouts > 0 ? Math.min(100, Math.round((completedCount / totalWorkouts) * 100)) : 0);

          return (
            <div
              onClick={() => onNavigateTab('coach')}
              className="bg-[#1E1E1E] rounded-3xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all border border-white/5 shadow-soft-sm"
            >
              <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                <div className="w-11 h-11 rounded-2xl bg-[#FF5500]/15 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-[#FF5500]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-white truncate">
                      Week {currentPlanWeek} of {totalWeeks}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] shrink-0">
                      Progress
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5 truncate">
                    <span className="font-mono font-bold text-white">{weekLoggedKm.toFixed(1)}</span> / {targetKm.toFixed(1)} km · {completedCount} of {totalWorkouts} completed
                  </p>
                </div>
              </div>
              <CircularProgress percent={percent} />
            </div>
          );
        }

        const weeklyDefaultTarget = 20.0;
        const defaultPercent = Math.min(100, Math.round((weekLoggedKm / weeklyDefaultTarget) * 100));

        return (
          <div
            onClick={() => onNavigateTab('coach')}
            className="bg-[#1E1E1E] rounded-3xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all border border-dashed border-[#FF5500]/30 shadow-soft-sm"
          >
            <div className="flex items-center space-x-3.5 min-w-0 pr-2">
              <div className="w-11 h-11 rounded-2xl bg-[#FF5500]/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#FF5500]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">Weekly Running Mileage</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  <span className="font-mono font-bold text-white">{weekLoggedKm.toFixed(1)} km</span> logged this week
                </p>
              </div>
            </div>
            <CircularProgress percent={defaultPercent} />
          </div>
        );
      })()}

      {/* ═══ TODAY'S ACTIVITY ═══ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white">Today's Activity</h2>
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
          <div className="bg-[#1E1E1E] rounded-3xl p-8 text-center border border-white/5">
            <p className="text-sm font-bold text-white">No runs logged yet</p>
            <p className="text-xs text-neutral-400 mt-1">
              Tap the orange <span className="font-bold text-[#FF5500]">+</span> button below to upload your first run!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentDayGroups.map((dayGroup) => {
              if (dayGroup.runs.length === 1) {
                const run = dayGroup.runs[0];
                const isToday = dayGroup.dateKey === new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={run.id}
                    onClick={() => onSelectRun(run.id)}
                    className="bg-[#1E1E1E] rounded-2xl p-3.5 flex items-center space-x-3.5 cursor-pointer active:scale-[0.99] transition-all border border-white/5 hover:border-white/10"
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={clsx('w-3 h-3 rounded-full', isToday ? 'bg-[#FF5500]' : 'bg-neutral-600')} />
                      <div className="w-px h-6 bg-neutral-700 mt-1" />
                    </div>

                    <RouteThumbnail routeData={run.route_data} width={52} height={44} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white truncate">
                          {formatDistance(run.distance_km, unitSystem, true)}
                        </span>
                        {isToday ? (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white">
                            Now
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-neutral-400">
                            {dayGroup.formattedDate}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-[11px] text-neutral-400 font-mono space-x-1.5 mt-0.5">
                        <span>{formatDuration(run.duration_seconds)}</span>
                        <span className="text-neutral-600">·</span>
                        <span>{formatPace(run.pace_seconds_per_km, unitSystem, true)}</span>
                        {run.avg_heart_rate && (
                          <>
                            <span className="text-neutral-600">·</span>
                            <span>{run.avg_heart_rate} bpm</span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
                  </div>
                );
              }

              // MULTIPLE RUNS ON SAME DATE
              return (
                <div
                  key={dayGroup.dateKey}
                  className="bg-[#1E1E1E] rounded-3xl p-3.5 space-y-2.5 border border-white/5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#FF5500]" />
                      <span className="text-xs font-bold text-white">{dayGroup.formattedDate}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20">
                        {dayGroup.runs.length} Sessions
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-white font-mono">
                        {formatDistance(dayGroup.totalDistance, unitSystem, true)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {dayGroup.runs.map((run, idx) => (
                      <div
                        key={run.id}
                        onClick={() => onSelectRun(run.id)}
                        className="p-2.5 rounded-2xl bg-[#252525] hover:bg-[#2A2A2A] border border-white/5 hover:border-[#FF5500]/20 flex items-center space-x-3 cursor-pointer transition-all active:scale-[0.99] group"
                      >
                        <RouteThumbnail routeData={run.route_data} width={46} height={38} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider">
                              Session {idx + 1}
                            </span>
                            {run.date && run.date.includes('T') && (
                              <span className="text-[10px] text-neutral-400 font-mono">
                                {new Date(run.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline space-x-2 mt-0.5">
                            <span className="text-sm font-black text-white font-mono">
                              {formatDistance(run.distance_km, unitSystem, true)}
                            </span>
                            <span className="text-xs text-neutral-400 font-mono">
                              {formatDuration(run.duration_seconds)}
                            </span>
                            <span className="text-xs text-neutral-500 font-mono">
                              · {formatPace(run.pace_seconds_per_km, unitSystem, true)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-[#FF5500] transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
