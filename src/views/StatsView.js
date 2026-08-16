import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { formatDistance, formatPace, formatDuration } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, } from 'recharts';
import { Trophy, Flame, Zap, Award, TrendingUp } from 'lucide-react';
export const StatsView = ({ runs, unitSystem }) => {
    const monthlyData = useMemo(() => {
        const monthsMap = {};
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
        if (runs.length === 0)
            return null;
        let longest = runs[0];
        let fastestPace = runs[0];
        let maxElevation = runs[0];
        let totalCalories = 0;
        let totalKm = 0;
        for (const r of runs) {
            totalKm += r.distance_km || 0;
            totalCalories += r.calories || 0;
            if (r.distance_km > longest.distance_km)
                longest = r;
            if (r.pace_seconds_per_km &&
                (!fastestPace.pace_seconds_per_km || r.pace_seconds_per_km < fastestPace.pace_seconds_per_km)) {
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
        const counts = {};
        for (const r of runs) {
            counts[r.source] = (counts[r.source] || 0) + 1;
        }
        return Object.entries(counts).map(([name, count]) => ({
            name,
            count,
            percent: Math.round((count / runs.length) * 100),
        }));
    }, [runs]);
    if (runs.length === 0) {
        return (_jsxs("div", { className: "max-w-md mx-auto px-4 pt-4 pb-28 space-y-5", children: [_jsxs("div", { className: "pt-2", children: [_jsx("h1", { className: "text-2xl font-black text-neutral-900 tracking-tight", children: "Stats & Records" }), _jsx("p", { className: "text-xs text-neutral-400 font-medium mt-0.5", children: "Your running milestones and volume analytics" })] }), _jsxs(Card, { className: "p-8 text-center space-y-2", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-orange-50 text-[#FF5500] flex items-center justify-center mx-auto", children: _jsx(Trophy, { className: "w-6 h-6" }) }), _jsx("h3", { className: "text-base font-bold text-neutral-900", children: "No Analytics Yet" }), _jsx("p", { className: "text-xs text-neutral-400 max-w-xs mx-auto", children: "Upload your first workout screenshot to calculate your personal records and monthly volume trends!" })] })] }));
    }
    return (_jsxs("div", { className: "max-w-md mx-auto px-4 pt-4 pb-28 space-y-5", children: [_jsxs("div", { className: "pt-2", children: [_jsx("h1", { className: "text-2xl font-black text-neutral-900 tracking-tight", children: "Stats & Records" }), _jsx("p", { className: "text-xs text-neutral-400 font-medium mt-0.5", children: "Your running milestones and volume analytics" })] }), _jsxs(Card, { className: "p-4 sm:p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-400", children: "Monthly Mileage" }), _jsx("span", { className: "text-xs font-bold text-[#FF5500]", children: records ? `${records.totalKm} ${unitSystem === 'metric' ? 'km' : 'mi'} Total` : '' })] }), _jsx("div", { className: "h-44 w-full", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: monthlyData, margin: { top: 10, right: 10, left: -25, bottom: 0 }, children: [_jsx(XAxis, { dataKey: "month", tickLine: false, axisLine: { stroke: '#E5E7EB' }, tick: { fontSize: 11, fill: '#9CA3AF' } }), _jsx(YAxis, { tickLine: false, axisLine: false, tick: { fontSize: 10, fill: '#9CA3AF' }, unit: " km" }), _jsx(Tooltip, { content: ({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (_jsxs("div", { className: "bg-neutral-900 text-white text-xs px-2.5 py-1.5 rounded-xl shadow-lg", children: [_jsxs("p", { className: "font-bold", children: [data.distance, " km"] }), _jsx("p", { className: "text-[10px] text-neutral-300", children: data.month })] }));
                                            }
                                            return null;
                                        } }), _jsx(Bar, { dataKey: "distance", radius: [8, 8, 0, 0], children: monthlyData.map((_, index) => (_jsx(Cell, { fill: index === monthlyData.length - 1 ? '#FF5500' : '#FED7AA' }, `cell-${index}`))) })] }) }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("h2", { className: "text-base font-bold text-neutral-900 flex items-center", children: [_jsx(Trophy, { className: "w-4 h-4 text-amber-500 mr-2" }), "Personal Records"] }), records && (_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex items-center space-x-2 text-amber-500 mb-1", children: [_jsx(Award, { className: "w-4 h-4" }), _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-neutral-400", children: "Longest Run" })] }), _jsxs("div", { className: "mt-1", children: [_jsx("span", { className: "text-xl font-black text-neutral-900", children: formatDistance(records.longest.distance_km, unitSystem, true) }), _jsx("span", { className: "text-[10px] text-neutral-400 block font-mono", children: formatDuration(records.longest.duration_seconds) })] })] }), _jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex items-center space-x-2 text-[#FF5500] mb-1", children: [_jsx(Zap, { className: "w-4 h-4" }), _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-neutral-400", children: "Best Pace" })] }), _jsxs("div", { className: "mt-1", children: [_jsx("span", { className: "text-xl font-black text-neutral-900 font-mono", children: formatPace(records.fastestPace.pace_seconds_per_km, unitSystem, false) }), _jsxs("span", { className: "text-[10px] text-neutral-400 block", children: ["/", unitSystem === 'metric' ? 'km' : 'mi'] })] })] }), _jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex items-center space-x-2 text-emerald-600 mb-1", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-neutral-400", children: "Max Elevation" })] }), _jsxs("div", { className: "mt-1", children: [_jsxs("span", { className: "text-xl font-black text-neutral-900", children: ["+", records.maxElevation.elevation_gain_m || 0, " m"] }), _jsx("span", { className: "text-[10px] text-neutral-400 block", children: formatDistance(records.maxElevation.distance_km, unitSystem, true) })] })] }), _jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex items-center space-x-2 text-orange-500 mb-1", children: [_jsx(Flame, { className: "w-4 h-4" }), _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-neutral-400", children: "Total Energy" })] }), _jsxs("div", { className: "mt-1", children: [_jsx("span", { className: "text-xl font-black text-neutral-900", children: records.totalCalories.toLocaleString() }), _jsx("span", { className: "text-[10px] text-neutral-400 block", children: "kcal burned" })] })] })] }))] }), _jsxs(Card, { className: "p-4 sm:p-5 space-y-3", children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-400", children: "Source Breakdown" }), _jsx("div", { className: "space-y-2", children: sourceBreakdown.map((s) => (_jsxs("div", { className: "flex items-center justify-between text-xs font-semibold", children: [_jsx("span", { className: "text-neutral-700", children: s.name }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("span", { className: "text-neutral-400", children: [s.count, " runs"] }), _jsxs("span", { className: "font-bold text-neutral-900 w-9 text-right", children: [s.percent, "%"] })] })] }, s.name))) })] })] }));
};
