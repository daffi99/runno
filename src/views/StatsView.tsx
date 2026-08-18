import React, { useMemo } from 'react';
import type { Run, UnitSystem } from '../types/run';
import { Card } from '../components/ui/Card';
import { formatDistance, formatPace, formatDuration, normalizeSourceName, parseDateSafe } from '../utils/formatters';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Trophy, Flame, Zap, Award, TrendingUp, Activity } from 'lucide-react';

interface StatsViewProps {
  runs: Run[];
  unitSystem: UnitSystem;
}

export const StatsView: React.FC<StatsViewProps> = ({ runs, unitSystem }) => {
  // Helper to format short duration like "2h 31m" or "45m"
  const formatShortDuration = (totalSec: number) => {
    if (!totalSec || totalSec <= 0) return '0m';
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // 1. Current Month Stats ("This month")
  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    const thisMonthRuns = runs.filter((r) => {
      if (!r.date) return false;
      const d = parseDateSafe(r.date);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonthIdx;
    });

    const distKm = thisMonthRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0);
    const totalSec = thisMonthRuns.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
    const elevM = thisMonthRuns.reduce((sum, r) => sum + (r.elevation_gain_m || 0), 0);

    const distDisplay = unitSystem === 'metric'
      ? `${distKm.toFixed(2)} km`
      : `${(distKm * 0.621371).toFixed(2)} mi`;

    const elevDisplay = unitSystem === 'metric'
      ? `${Math.round(elevM)} m`
      : `${Math.round(elevM * 3.28084)} ft`;

    return {
      distance: distDisplay,
      time: formatShortDuration(totalSec),
      elevGain: elevDisplay,
      count: thisMonthRuns.length,
    };
  }, [runs, unitSystem]);

  // 2. Past 3 Months Trend Data (Monthly Points)
  const past3MonthsData = useMemo(() => {
    const now = new Date();
    const result = [];

    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const targetYear = d.getFullYear();
      const targetMonthIdx = d.getMonth();
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(); // e.g. "JUN", "JUL", "AUG"

      const monthRuns = runs.filter((r) => {
        if (!r.date) return false;
        const rd = parseDateSafe(r.date);
        return !isNaN(rd.getTime()) && rd.getFullYear() === targetYear && rd.getMonth() === targetMonthIdx;
      });

      const distKm = monthRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0);
      const distanceValue = unitSystem === 'metric' ? distKm : distKm * 0.621371;

      result.push({
        month: monthLabel,
        distance: Number(distanceValue.toFixed(2)),
        isCurrent: i === 0,
        runCount: monthRuns.length,
      });
    }

    return result;
  }, [runs, unitSystem]);

  // 3. All-Time Stats Summary
  const allTimeStats = useMemo(() => {
    if (runs.length === 0) return null;

    let totalDistKm = 0;
    let totalSec = 0;
    let totalElevM = 0;
    let totalCalories = 0;
    let validPaceCount = 0;
    let totalPaceSec = 0;

    for (const r of runs) {
      totalDistKm += r.distance_km || 0;
      totalSec += r.duration_seconds || 0;
      totalElevM += r.elevation_gain_m || 0;
      totalCalories += r.calories || 0;
      if (r.pace_seconds_per_km && r.pace_seconds_per_km > 0) {
        totalPaceSec += r.pace_seconds_per_km;
        validPaceCount++;
      }
    }

    const avgPaceSec = validPaceCount > 0 ? Math.round(totalPaceSec / validPaceCount) : 0;

    const distDisplay = unitSystem === 'metric'
      ? `${totalDistKm.toFixed(1)} km`
      : `${(totalDistKm * 0.621371).toFixed(1)} mi`;

    const elevDisplay = unitSystem === 'metric'
      ? `${Math.round(totalElevM).toLocaleString()} m`
      : `${Math.round(totalElevM * 3.28084).toLocaleString()} ft`;

    return {
      totalDistance: distDisplay,
      totalRuns: runs.length,
      totalTime: formatDuration(totalSec),
      totalElev: elevDisplay,
      totalCalories: totalCalories.toLocaleString(),
      avgPace: avgPaceSec ? formatPace(avgPaceSec, unitSystem, false) : '--:--',
    };
  }, [runs, unitSystem]);

  // 4. Lifetime Records
  const records = useMemo(() => {
    if (runs.length === 0) return null;

    let longest = runs[0];
    let fastestPace = runs[0];
    let maxElevation = runs[0];
    let totalCalories = 0;
    let totalKm = 0;

    for (const r of runs) {
      totalKm += r.distance_km || 0;
      totalCalories += r.calories || 0;

      if (r.distance_km > longest.distance_km) longest = r;
      if (
        r.pace_seconds_per_km &&
        (!fastestPace.pace_seconds_per_km || r.pace_seconds_per_km < fastestPace.pace_seconds_per_km)
      ) {
        fastestPace = r;
      }
      if ((r.elevation_gain_m || 0) > (maxElevation.elevation_gain_m || 0)) {
        maxElevation = r;
      }
    }

    return {
      longest,
      fastestPace,
      maxElevation,
      totalCalories,
      totalKm: totalKm.toFixed(1),
    };
  }, [runs]);

  // 4. Source Breakdown
  const sourceBreakdown = useMemo(() => {
    const counts: { [key: string]: number } = {};
    for (const r of runs) {
      const srcName = normalizeSourceName(r.source);
      counts[srcName] = (counts[srcName] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: runs.length > 0 ? Math.round((count / runs.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [runs]);

  if (runs.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-5">
        <div className="pt-2">
          <h1 className="text-2xl font-black text-white tracking-tight">Stats & Records</h1>
          <p className="text-xs text-neutral-400 font-medium mt-0.5">
            Your running milestones and volume analytics
          </p>
        </div>

        <Card className="p-8 text-center space-y-2 bg-[#1E1E1E] border-white/5">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5500]/15 text-[#FF5500] flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Analytics Yet</h3>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            Upload your first workout screenshot to calculate your personal records and monthly volume trends!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-5">
      <div className="pt-2">
        <h1 className="text-2xl font-black text-white tracking-tight">Stats & Records</h1>
        <p className="text-xs text-neutral-400 font-medium mt-0.5">
          Your running milestones and volume analytics
        </p>
      </div>

      {/* ═══ PROGRESS CARD (This month + Past 3 months Area Chart) ═══ */}
      <Card className="p-5 bg-[#1E1E1E] border-white/5 space-y-4">
        {/* Top Header */}
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">This month</h2>
          
          {/* 3 Summary Metrics */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-1">
            <div>
              <span className="text-xs text-neutral-400 font-medium block">Distance</span>
              <span className="text-xl font-black text-white font-mono tracking-tight mt-0.5 block truncate">
                {currentMonthStats.distance}
              </span>
            </div>
            <div>
              <span className="text-xs text-neutral-400 font-medium block">Time</span>
              <span className="text-xl font-black text-white font-mono tracking-tight mt-0.5 block truncate">
                {currentMonthStats.time}
              </span>
            </div>
            <div>
              <span className="text-xs text-neutral-400 font-medium block">Elev Gain</span>
              <span className="text-xl font-black text-white font-mono tracking-tight mt-0.5 block truncate">
                {currentMonthStats.elevGain}
              </span>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <div className="pt-2 border-t border-white/5">
          <span className="text-xs font-semibold text-neutral-400 block mb-2">
            Past 3 months
          </span>

          {/* Area Chart */}
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={past3MonthsData} margin={{ top: 12, right: 28, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5500" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#FF5500" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2D2D2D" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={{ stroke: '#333333' }}
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#888888' }}
                  dy={4}
                />
                <YAxis
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#888888' }}
                  unit={` ${unitSystem === 'metric' ? 'km' : 'mi'}`}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#2A2A2A] text-white text-xs px-2.5 py-1.5 rounded-xl shadow-lg border border-white/10">
                          <p className="font-bold">{data.distance} {unitSystem === 'metric' ? 'km' : 'mi'}</p>
                          <p className="text-[10px] text-neutral-400">{data.month} · {data.runCount} runs</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="distance"
                  stroke="#FF5500"
                  strokeWidth={3}
                  fill="url(#areaGradient)"
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (cx === undefined || cy === undefined) return null;
                    return (
                      <circle
                        key={payload.month}
                        cx={cx}
                        cy={cy}
                        r={payload.isCurrent ? 6 : 5}
                        fill="#1E1E1E"
                        stroke="#FF5500"
                        strokeWidth={payload.isCurrent ? 3.5 : 2.5}
                      />
                    );
                  }}
                  activeDot={{ r: 7, stroke: '#FF5500', strokeWidth: 3, fill: '#FFFFFF' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* ═══ ALL-TIME STATS CARD ═══ */}
      {allTimeStats && (
        <Card className="p-5 bg-[#1E1E1E] border-white/5 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#FF5500]" />
              All-Time Stats
            </span>
            <span className="text-xs font-bold text-[#FF5500] font-mono">
              {allTimeStats.totalRuns} Activities
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="bg-[#252525] p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Total Distance</span>
              <span className="text-base font-black text-white font-mono mt-0.5 block truncate">
                {allTimeStats.totalDistance}
              </span>
            </div>

            <div className="bg-[#252525] p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Total Time</span>
              <span className="text-base font-black text-white font-mono mt-0.5 block truncate">
                {allTimeStats.totalTime}
              </span>
            </div>

            <div className="bg-[#252525] p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Total Elev</span>
              <span className="text-base font-black text-white font-mono mt-0.5 block truncate">
                {allTimeStats.totalElev}
              </span>
            </div>

            <div className="bg-[#252525] p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Avg Pace</span>
              <span className="text-base font-black text-white font-mono mt-0.5 block truncate">
                {allTimeStats.avgPace}
                <span className="text-[9px] text-neutral-400 font-normal ml-0.5">/{unitSystem === 'metric' ? 'km' : 'mi'}</span>
              </span>
            </div>

            <div className="bg-[#252525] p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Calories</span>
              <span className="text-base font-black text-white font-mono mt-0.5 block truncate">
                {allTimeStats.totalCalories}
                <span className="text-[9px] text-neutral-400 font-normal ml-0.5">kcal</span>
              </span>
            </div>

            <div className="bg-[#252525] p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Workouts</span>
              <span className="text-base font-black text-white font-mono mt-0.5 block truncate">
                {allTimeStats.totalRuns}
                <span className="text-[9px] text-neutral-400 font-normal ml-0.5">runs</span>
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* ═══ PERSONAL RECORDS ═══ */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center justify-between">
          <span className="flex items-center">
            <Trophy className="w-4 h-4 text-amber-400 mr-2" />
            Personal Records
          </span>
          <span className="text-[11px] text-neutral-400 font-normal">
            {runs.length} workouts logged
          </span>
        </h2>

        {records && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-[#1E1E1E] border-white/5">
              <div className="flex items-center space-x-2 text-amber-400 mb-1">
                <Award className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Longest Run
                </span>
              </div>
              <div className="mt-1">
                <span className="text-xl font-black text-white font-mono">
                  {formatDistance(records.longest.distance_km, unitSystem, true)}
                </span>
                <span className="text-[10px] text-neutral-400 block font-mono">
                  {formatDuration(records.longest.duration_seconds)}
                </span>
              </div>
            </Card>

            <Card className="p-4 bg-[#1E1E1E] border-white/5">
              <div className="flex items-center space-x-2 text-[#FF5500] mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Best Pace
                </span>
              </div>
              <div className="mt-1">
                <span className="text-xl font-black text-white font-mono">
                  {formatPace(records.fastestPace.pace_seconds_per_km, unitSystem, false)}
                </span>
                <span className="text-[10px] text-neutral-400 block">
                  /{unitSystem === 'metric' ? 'km' : 'mi'}
                </span>
              </div>
            </Card>

            <Card className="p-4 bg-[#1E1E1E] border-white/5">
              <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Max Elevation
                </span>
              </div>
              <div className="mt-1">
                <span className="text-xl font-black text-white font-mono">
                  +{records.maxElevation.elevation_gain_m || 0} m
                </span>
                <span className="text-[10px] text-neutral-400 block">
                  {formatDistance(records.maxElevation.distance_km, unitSystem, true)}
                </span>
              </div>
            </Card>

            <Card className="p-4 bg-[#1E1E1E] border-white/5">
              <div className="flex items-center space-x-2 text-orange-400 mb-1">
                <Flame className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Total Energy
                </span>
              </div>
              <div className="mt-1">
                <span className="text-xl font-black text-white font-mono">
                  {records.totalCalories.toLocaleString()}
                </span>
                <span className="text-[10px] text-neutral-400 block">kcal burned</span>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ═══ SOURCE BREAKDOWN ═══ */}
      <Card className="p-4 sm:p-5 bg-[#1E1E1E] border-white/5 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Source Breakdown
        </span>
        <div className="space-y-2">
          {sourceBreakdown.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-xs font-semibold">
              <span className="text-neutral-300">{s.name}</span>
              <div className="flex items-center space-x-2">
                <span className="text-neutral-500">{s.count} runs</span>
                <span className="font-bold text-white w-9 text-right font-mono">{s.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
