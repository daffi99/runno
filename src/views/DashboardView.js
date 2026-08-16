import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { storageService } from '../services/storage';
import { Card } from '../components/ui/Card';
import { RouteThumbnail } from '../components/ui/RouteThumbnail';
import { formatDuration, formatPace, formatDate, formatDistance, formatWorkoutDate } from '../utils/formatters';
import { Bell, ChevronDown, TrendingUp, TrendingDown, Minus, Sparkles, ArrowRight } from 'lucide-react';
export const DashboardView = ({ runs, unitSystem, onSelectRun, onNavigateTab, }) => {
    const months = useMemo(() => {
        const monthSet = new Set();
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
    const [selectedMonth, setSelectedMonth] = useState(months[0] || '2026-08');
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
        const distDiffPercent = prevDist > 0 ? (((totalDist - prevDist) / prevDist) * 100).toFixed(1) : null;
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
    const recentRuns = useMemo(() => {
        return [...runs]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [runs]);
    return (_jsxs("div", { className: "space-y-6 pb-24 max-w-md mx-auto px-4 pt-4", children: [_jsxs("div", { className: "flex items-center justify-between pt-2", children: [_jsx("h1", { className: "text-2xl font-black text-neutral-900 tracking-tight", children: "Dashboard" }), _jsxs("button", { onClick: () => onNavigateTab('more'), className: "relative p-2.5 rounded-full bg-white border border-neutral-200/80 text-neutral-700 shadow-soft-sm hover:bg-neutral-50 active:scale-95 transition-all", "aria-label": "Settings and Notifications", children: [_jsx(Bell, { className: "w-5 h-5" }), _jsx("span", { className: "absolute top-2 right-2 w-2 h-2 bg-[#FF5500] rounded-full ring-2 ring-white" })] })] }), _jsxs("div", { className: "relative inline-block", children: [_jsx("select", { value: selectedMonth, onChange: (e) => setSelectedMonth(e.target.value), className: "appearance-none bg-white border border-neutral-200/90 shadow-soft-sm rounded-2xl px-4 py-2 pr-9 text-sm font-bold text-neutral-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20", children: months.map((m) => {
                            const [y, mon] = m.split('-').map(Number);
                            const label = new Date(y, mon - 1, 1).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                            });
                            return (_jsx("option", { value: m, children: label }, m));
                        }) }), _jsx(ChevronDown, { className: "w-4 h-4 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3.5", children: [_jsxs(Card, { className: "p-4 flex flex-col justify-between min-h-[110px]", children: [_jsxs("div", { children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-neutral-400", children: "Distance" }), _jsxs("div", { className: "mt-1 flex items-baseline", children: [_jsx("span", { className: "text-2xl font-black text-neutral-900 tracking-tight", children: stats.totalDist.toFixed(1) }), _jsx("span", { className: "text-xs font-semibold text-neutral-400 ml-1", children: unitSystem === 'metric' ? 'km' : 'mi' })] })] }), _jsx("div", { className: "mt-2 flex items-center text-[11px] font-semibold", children: stats.distDiffPercent !== null ? (_jsxs("div", { className: `flex items-center ${Number(stats.distDiffPercent) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`, children: [Number(stats.distDiffPercent) >= 0 ? (_jsx(TrendingUp, { className: "w-3.5 h-3.5 mr-1 shrink-0" })) : (_jsx(TrendingDown, { className: "w-3.5 h-3.5 mr-1 shrink-0" })), _jsxs("span", { children: [Number(stats.distDiffPercent) >= 0 ? '+' : '', stats.distDiffPercent, "% vs ", prevMonthLabel] })] })) : (_jsxs("div", { className: "flex items-center text-neutral-400", children: [_jsx(Minus, { className: "w-3.5 h-3.5 mr-1 shrink-0" }), _jsx("span", { children: "No previous data" })] })) })] }), _jsxs(Card, { className: "p-4 flex flex-col justify-between min-h-[110px]", children: [_jsxs("div", { children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-neutral-400", children: "Runs" }), _jsxs("div", { className: "mt-1 flex items-baseline", children: [_jsx("span", { className: "text-2xl font-black text-neutral-900 tracking-tight", children: stats.runCount }), _jsx("span", { className: "text-xs font-semibold text-neutral-400 ml-1", children: "runs" })] })] }), _jsx("div", { className: "mt-2 flex items-center text-[11px] font-semibold", children: stats.countDiff !== null ? (_jsxs("div", { className: `flex items-center ${stats.countDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`, children: [stats.countDiff >= 0 ? (_jsx(TrendingUp, { className: "w-3.5 h-3.5 mr-1 shrink-0" })) : (_jsx(TrendingDown, { className: "w-3.5 h-3.5 mr-1 shrink-0" })), _jsxs("span", { children: [stats.countDiff >= 0 ? '+' : '', stats.countDiff, " vs ", prevMonthLabel] })] })) : (_jsxs("div", { className: "flex items-center text-neutral-400", children: [_jsx(Minus, { className: "w-3.5 h-3.5 mr-1 shrink-0" }), _jsx("span", { children: "No previous data" })] })) })] }), _jsxs(Card, { className: "p-4 flex flex-col justify-between min-h-[110px]", children: [_jsxs("div", { children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-neutral-400", children: "Avg Pace" }), _jsxs("div", { className: "mt-1 flex items-baseline", children: [_jsx("span", { className: "text-2xl font-black text-neutral-900 tracking-tight font-mono", children: stats.avgPaceSec ? formatPace(stats.avgPaceSec, unitSystem, false) : '--:--' }), _jsxs("span", { className: "text-xs font-semibold text-neutral-400 ml-1", children: ["/", unitSystem === 'metric' ? 'km' : 'mi'] })] })] }), _jsx("div", { className: "mt-2 flex items-center text-[11px] font-semibold", children: stats.paceDiffSec !== null ? (_jsxs("div", { className: `flex items-center ${stats.paceDiffSec <= 0 ? 'text-emerald-600' : 'text-rose-600'}`, children: [stats.paceDiffSec <= 0 ? (_jsx(TrendingDown, { className: "w-3.5 h-3.5 mr-1 shrink-0" })) : (_jsx(TrendingUp, { className: "w-3.5 h-3.5 mr-1 shrink-0" })), _jsxs("span", { children: [stats.paceDiffSec <= 0 ? '-' : '+', Math.abs(Math.floor(stats.paceDiffSec / 60)), ":", String(Math.abs(stats.paceDiffSec % 60)).padStart(2, '0'), " vs ", prevMonthLabel] })] })) : (_jsxs("div", { className: "flex items-center text-neutral-400", children: [_jsx(Minus, { className: "w-3.5 h-3.5 mr-1 shrink-0" }), _jsx("span", { children: "No previous data" })] })) })] }), _jsxs(Card, { className: "p-4 flex flex-col justify-between min-h-[110px]", children: [_jsxs("div", { children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-neutral-400", children: "Total Time" }), _jsx("div", { className: "mt-1 flex items-baseline", children: _jsx("span", { className: "text-2xl font-black text-neutral-900 tracking-tight font-mono", children: stats.totalDuration > 0 ? formatDuration(stats.totalDuration) : '00:00:00' }) })] }), _jsx("div", { className: "mt-2 flex items-center text-[11px] font-semibold", children: stats.timeDiffSec !== null ? (_jsxs("div", { className: `flex items-center ${stats.timeDiffSec >= 0 ? 'text-emerald-600' : 'text-rose-600'}`, children: [stats.timeDiffSec >= 0 ? (_jsx(TrendingUp, { className: "w-3.5 h-3.5 mr-1 shrink-0" })) : (_jsx(TrendingDown, { className: "w-3.5 h-3.5 mr-1 shrink-0" })), _jsxs("span", { children: [stats.timeDiffSec >= 0 ? '+' : '-', formatDuration(Math.abs(stats.timeDiffSec)), " vs ", prevMonthLabel] })] })) : (_jsxs("div", { className: "flex items-center text-neutral-400", children: [_jsx(Minus, { className: "w-3.5 h-3.5 mr-1 shrink-0" }), _jsx("span", { children: "No previous data" })] })) })] })] }), (() => {
                const activePlan = storageService.getActivePlan();
                if (activePlan) {
                    const todayWorkout = activePlan.workouts.find((w) => w.dayOfWeek === new Date().getDay());
                    return (_jsxs(Card, { variant: "interactive", onClick: () => onNavigateTab('coach'), className: "p-3.5 bg-gradient-to-r from-orange-50/90 to-amber-50/70 border border-orange-200/80 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3 min-w-0", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-[#FF5500] text-white flex items-center justify-center shrink-0 shadow-soft-xs", children: _jsx(Sparkles, { className: "w-5 h-5" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "flex items-center space-x-1.5", children: _jsxs("span", { className: "text-[10px] font-black uppercase tracking-wider text-[#FF5500]", children: ["Active Schedule \u00B7 ", activePlan.scheduleSummary] }) }), _jsx("h3", { className: "text-xs font-bold text-neutral-900 truncate mt-0.5", children: todayWorkout
                                                    ? `Today (${formatWorkoutDate(new Date())}): ${todayWorkout.title}`
                                                    : activePlan.title }), todayWorkout && todayWorkout.distanceKm > 0 && (_jsxs("p", { className: "text-[11px] text-neutral-500 font-mono", children: ["Target: ", formatDistance(todayWorkout.distanceKm, unitSystem, true)] }))] })] }), _jsx(ArrowRight, { className: "w-4 h-4 text-[#FF5500] shrink-0 ml-2" })] }));
                }
                return (_jsxs(Card, { variant: "interactive", onClick: () => onNavigateTab('coach'), className: "p-3.5 bg-gradient-to-r from-orange-50/70 to-amber-50/50 border border-dashed border-orange-200 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-9 h-9 rounded-2xl bg-orange-100/80 text-[#FF5500] flex items-center justify-center shrink-0", children: _jsx(Sparkles, { className: "w-4 h-4" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-bold text-neutral-900", children: "Create AI Running Schedule" }), _jsx("p", { className: "text-[11px] text-neutral-500", children: "Ask AI Coach to set up your Tue, Thu & Sat routine" })] })] }), _jsx(ArrowRight, { className: "w-4 h-4 text-[#FF5500] shrink-0" })] }));
            })(), _jsxs("div", { className: "space-y-3 pt-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-base font-bold text-neutral-900", children: "Recent Runs" }), runs.length > 0 && (_jsx("button", { onClick: () => onNavigateTab('history'), className: "text-xs font-bold text-[#FF5500] hover:text-[#E64D00] transition-colors", children: "See all" }))] }), recentRuns.length === 0 ? (_jsxs(Card, { className: "p-8 text-center", children: [_jsx("p", { className: "text-sm font-bold text-neutral-800", children: "No runs logged yet" }), _jsxs("p", { className: "text-xs text-neutral-400 mt-1", children: ["Tap the orange ", _jsx("span", { className: "font-bold text-[#FF5500]", children: "+" }), " button below to upload and analyze your first run screenshot!"] })] })) : (_jsx("div", { className: "space-y-2.5", children: recentRuns.map((run) => (_jsxs(Card, { variant: "interactive", onClick: () => onSelectRun(run.id), className: "p-3.5 flex items-center space-x-3.5", children: [_jsx(RouteThumbnail, { routeData: run.route_data, width: 64, height: 52 }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: "text-[11px] font-semibold text-neutral-400 block", children: formatDate(run.date) }), _jsx("div", { className: "flex items-baseline space-x-1 mt-0.5", children: _jsxs("span", { className: "text-base font-black text-neutral-900", children: [run.distance_km.toFixed(2), " ", unitSystem === 'metric' ? 'km' : 'mi'] }) }), _jsxs("div", { className: "flex items-center text-xs text-neutral-500 font-mono space-x-1.5 mt-0.5", children: [_jsx("span", { children: formatDuration(run.duration_seconds) }), _jsx("span", { className: "text-neutral-300", children: "\u00B7" }), _jsx("span", { children: formatPace(run.pace_seconds_per_km, unitSystem, true) })] })] }), _jsx("div", { className: "shrink-0 pr-1", children: run.route_data ? (_jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-emerald-500" })) : (_jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-neutral-200" })) })] }, run.id))) }))] })] }));
};
