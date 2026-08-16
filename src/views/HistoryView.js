import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { RouteThumbnail } from '../components/ui/RouteThumbnail';
import { formatDate, formatDistance, formatDuration, formatPace, } from '../utils/formatters';
import { Search, ChevronRight, X } from 'lucide-react';
export const HistoryView = ({ runs, unitSystem, onSelectRun, }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [selectedSource, setSelectedSource] = useState('all');
    const filteredRuns = useMemo(() => {
        return runs.filter((r) => {
            if (selectedSource !== 'all' && r.source !== selectedSource) {
                return false;
            }
            if (!searchQuery.trim())
                return true;
            const q = searchQuery.toLowerCase();
            return (r.source.toLowerCase().includes(q) ||
                r.date.includes(q) ||
                r.distance_km.toString().includes(q));
        });
    }, [runs, searchQuery, selectedSource]);
    const groupedByMonth = useMemo(() => {
        const groups = {};
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
        const s = new Set();
        for (const r of runs) {
            if (r.source)
                s.add(r.source);
        }
        return Array.from(s);
    }, [runs]);
    return (_jsxs("div", { className: "max-w-md mx-auto px-4 pt-4 pb-28 space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between pt-2", children: [_jsx("h1", { className: "text-2xl font-black text-neutral-900 tracking-tight", children: "History" }), _jsx("div", { className: "flex items-center space-x-2", children: _jsx("button", { onClick: () => setShowSearch(!showSearch), className: "p-2.5 rounded-full bg-white border border-neutral-200/80 text-neutral-700 shadow-soft-sm hover:bg-neutral-50 active:scale-95 transition-all", "aria-label": "Search", children: _jsx(Search, { className: "w-4 h-4" }) }) })] }), showSearch && (_jsxs("div", { className: "space-y-2.5 animate-in fade-in", children: [_jsxs("div", { className: "relative flex items-center", children: [_jsx(Search, { className: "w-4 h-4 text-neutral-400 absolute left-3.5" }), _jsx("input", { type: "text", placeholder: "Search by source, date, distance...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full bg-white border border-neutral-200 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20" }), searchQuery && (_jsx("button", { onClick: () => setSearchQuery(''), className: "absolute right-3 text-neutral-400 hover:text-neutral-600", children: _jsx(X, { className: "w-4 h-4" }) }))] }), _jsxs("div", { className: "flex items-center space-x-1.5 overflow-x-auto pb-1", children: [_jsxs("button", { onClick: () => setSelectedSource('all'), className: `px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${selectedSource === 'all'
                                    ? 'bg-neutral-900 text-white'
                                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`, children: ["All (", runs.length, ")"] }), availableSources.map((src) => (_jsx("button", { onClick: () => setSelectedSource(src), className: `px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${selectedSource === src
                                    ? 'bg-[#FF5500] text-white'
                                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`, children: src }, src)))] })] })), groupedByMonth.length === 0 ? (_jsxs(Card, { className: "p-8 text-center", children: [_jsx("p", { className: "text-sm font-semibold text-neutral-700", children: "No runs match your filter" }), _jsx("p", { className: "text-xs text-neutral-400 mt-1", children: "Try resetting search or source filter." })] })) : (_jsx("div", { className: "space-y-6", children: groupedByMonth.map((group) => (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-base font-bold text-neutral-900", children: group.month }), _jsxs("p", { className: "text-xs text-neutral-400 font-medium", children: [formatDistance(group.totalDist, unitSystem, true), " \u00B7 ", group.count, " runs \u00B7", ' ', formatDuration(group.totalDuration)] })] }), _jsx("div", { className: "space-y-2.5", children: group.runs.map((run) => (_jsxs(Card, { variant: "interactive", onClick: () => onSelectRun(run.id), className: "p-3.5 flex items-center space-x-3.5", children: [_jsx(RouteThumbnail, { routeData: run.route_data, width: 64, height: 52 }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: "text-[11px] font-semibold text-neutral-400 block", children: formatDate(run.date) }), _jsx("div", { className: "flex items-baseline space-x-1 mt-0.5", children: _jsx("span", { className: "text-base font-black text-neutral-900", children: formatDistance(run.distance_km, unitSystem, true) }) }), _jsxs("div", { className: "flex items-center text-xs text-neutral-500 font-mono space-x-1.5 mt-0.5", children: [_jsx("span", { children: formatDuration(run.duration_seconds) }), _jsx("span", { className: "text-neutral-300", children: "\u00B7" }), _jsx("span", { children: formatPace(run.pace_seconds_per_km, unitSystem, true) })] })] }), _jsx("div", { className: "shrink-0 text-neutral-300 pr-1", children: _jsx(ChevronRight, { className: "w-4 h-4" }) })] }, run.id))) })] }, group.month))) }))] }));
};
