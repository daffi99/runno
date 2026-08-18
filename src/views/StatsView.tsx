import React, { useState, useMemo } from 'react';
import type { Run, UnitSystem } from '../types/run';
import { Card } from '../components/ui/Card';
import { formatDistance, formatPace, formatDuration, normalizeSourceName, parseDateSafe } from '../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import { Trophy, Flame, Zap, Award, TrendingUp, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

interface StatsViewProps {
  runs: Run[];
  unitSystem: UnitSystem;
}

export const StatsView: React.FC<StatsViewProps> = ({ runs, unitSystem }) => {
  // Extract all distinct years available in data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    for (const r of runs) {
      if (r.date) {
        const d = parseDateSafe(r.date);
        if (!isNaN(d.getTime())) {
          yearsSet.add(String(d.getFullYear()));
        }
      }
    }
    const sorted = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    return sorted.length > 0 ? sorted : [String(new Date().getFullYear())];
  }, [runs]);

  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const currentYear = String(new Date().getFullYear());
    return availableYears.includes(currentYear) ? currentYear : (availableYears[0] || currentYear);
  });

  // Filter runs based on selected year (or all)
  const filteredRuns = useMemo(() => {
    if (selectedYear === 'all') return runs;
    return runs.filter((r) => {
      if (!r.date) return false;
      const d = parseDateSafe(r.date);
      return !isNaN(d.getTime()) && String(d.getFullYear()) === selectedYear;
    });
  }, [runs, selectedYear]);

  const monthlyData = useMemo(() => {
    const monthsMap: { [key: string]: number } = {};
    const ALL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (const m of ALL_MONTHS) {
      monthsMap[m] = 0;
    }

    for (const r of filteredRuns) {
      if (r.date) {
        const d = parseDateSafe(r.date);
        if (!isNaN(d.getTime())) {
          const key = d.toLocaleDateString('en-US', { month: 'short' });
          if (monthsMap[key] !== undefined) {
            monthsMap[key] += (r.distance_km || 0);
          }
        }
      }
    }

    // If viewing single year, show all 12 months with activity or relevant months
    const activeMonths = ALL_MONTHS.filter((m) => monthsMap[m] > 0);
    const monthsToShow = activeMonths.length > 0 ? ALL_MONTHS : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return monthsToShow.map((month) => ({
      month,
      distance: Number((monthsMap[month] || 0).toFixed(1)),
      hasRuns: (monthsMap[month] || 0) > 0,
    }));
  }, [filteredRuns]);

  const yearlyVolumeKm = useMemo(() => {
    const total = filteredRuns.reduce((acc, r) => acc + (r.distance_km || 0), 0);
    return total.toFixed(1);
  }, [filteredRuns]);

  const records = useMemo(() => {
    const activeList = filteredRuns.length > 0 ? filteredRuns : runs;
    if (activeList.length === 0) return null;

    let longest = activeList[0];
    let fastestPace = activeList[0];
    let maxElevation = activeList[0];
    let totalCalories = 0;
    let totalKm = 0;

    for (const r of activeList) {
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
  }, [filteredRuns, runs]);

  const sourceBreakdown = useMemo(() => {
    const counts: { [key: string]: number } = {};
    const activeList = filteredRuns.length > 0 ? filteredRuns : runs;
    for (const r of activeList) {
      const srcName = normalizeSourceName(r.source);
      counts[srcName] = (counts[srcName] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: activeList.length > 0 ? Math.round((count / activeList.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRuns, runs]);

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
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Stats & Records</h1>
          <p className="text-xs text-neutral-400 font-medium mt-0.5">
            Your running milestones and volume analytics
          </p>
        </div>
      </div>

      {/* Year Filter Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center space-x-1.5 bg-[#1E1E1E] p-1 rounded-2xl border border-white/5 w-full">
          {availableYears.map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={clsx(
                'flex-1 py-1.5 text-xs font-bold rounded-xl transition-all text-center',
                selectedYear === yr
                  ? 'bg-[#FF5500] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              )}
            >
              {yr}
            </button>
          ))}
          {availableYears.length > 1 && (
            <button
              onClick={() => setSelectedYear('all')}
              className={clsx(
                'flex-1 py-1.5 text-xs font-bold rounded-xl transition-all text-center',
                selectedYear === 'all'
                  ? 'bg-[#FF5500] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              )}
            >
              All Time
            </button>
          )}
        </div>
      </div>

      <Card className="p-4 sm:p-5 bg-[#1E1E1E] border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#FF5500]" />
            {selectedYear === 'all' ? 'Monthly Mileage (All Time)' : `Monthly Mileage (${selectedYear})`}
          </span>
          <span className="text-xs font-bold text-[#FF5500] font-mono">
            {yearlyVolumeKm} {unitSystem === 'metric' ? 'km' : 'mi'} Total
          </span>
        </div>

        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={{ stroke: '#333333' }}
                tick={{ fontSize: 10, fill: '#888888' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#888888' }}
                unit=" km"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#2A2A2A] text-white text-xs px-2.5 py-1.5 rounded-xl shadow-lg border border-white/10">
                        <p className="font-bold">{data.distance} km</p>
                        <p className="text-[10px] text-neutral-400">{data.month} {selectedYear !== 'all' ? selectedYear : ''}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="distance" radius={[6, 6, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.distance > 0 ? (index === monthlyData.length - 1 || entry.month === 'Aug' ? '#FF5500' : '#883300') : '#2A2A2A'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center justify-between">
          <span className="flex items-center">
            <Trophy className="w-4 h-4 text-amber-400 mr-2" />
            Personal Records {selectedYear !== 'all' ? `(${selectedYear})` : ''}
          </span>
          <span className="text-[11px] text-neutral-400 font-normal">
            {filteredRuns.length} workouts logged
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

      <Card className="p-4 sm:p-5 bg-[#1E1E1E] border-white/5 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Source Breakdown {selectedYear !== 'all' ? `(${selectedYear})` : ''}
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
