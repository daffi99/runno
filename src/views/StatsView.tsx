import React, { useMemo } from 'react';
import type { Run, UnitSystem } from '../types/run';
import { Card } from '../components/ui/Card';
import { formatDistance, formatPace, formatDuration, normalizeSourceName } from '../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import { Trophy, Flame, Zap, Award, TrendingUp } from 'lucide-react';

interface StatsViewProps {
  runs: Run[];
  unitSystem: UnitSystem;
}

export const StatsView: React.FC<StatsViewProps> = ({ runs, unitSystem }) => {
  const monthlyData = useMemo(() => {
    const monthsMap: { [key: string]: number } = {};

    for (const r of runs) {
      if (r.date) {
        const d = new Date(r.date);
        if (!isNaN(d.getTime())) {
          const key = d.toLocaleDateString('en-US', { month: 'short' });
          monthsMap[key] = (monthsMap[key] || 0) + (r.distance_km || 0);
        }
      }
    }

    const order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return order
      .filter((m) => monthsMap[m] !== undefined)
      .map((month) => ({
        month,
        distance: Number(monthsMap[month].toFixed(1)),
      }));
  }, [runs]);

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

      <Card className="p-4 sm:p-5 bg-[#1E1E1E] border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Monthly Mileage
          </span>
          <span className="text-xs font-bold text-[#FF5500]">
            {records ? `${records.totalKm} ${unitSystem === 'metric' ? 'km' : 'mi'} Total` : ''}
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={{ stroke: '#333333' }}
                tick={{ fontSize: 11, fill: '#888888' }}
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
                        <p className="text-[10px] text-neutral-400">{data.month}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="distance" radius={[8, 8, 0, 0]}>
                {monthlyData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === monthlyData.length - 1 ? '#FF5500' : '#442211'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center">
          <Trophy className="w-4 h-4 text-amber-400 mr-2" />
          Personal Records
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
