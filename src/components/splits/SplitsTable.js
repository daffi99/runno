import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatPace } from '../../utils/formatters';
import { ListOrdered } from 'lucide-react';
export const SplitsTable = ({ splits = [], avgPaceSeconds, unitSystem = 'metric', }) => {
    const validSplits = splits || [];
    if (validSplits.length === 0) {
        return (_jsxs("div", { className: "bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-soft text-center my-4 space-y-2", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-orange-50 text-[#FF5500] flex items-center justify-center mx-auto", children: _jsx(ListOrdered, { className: "w-6 h-6" }) }), _jsx("p", { className: "text-sm font-bold text-neutral-800", children: "No split breakdown available" }), _jsx("p", { className: "text-xs text-neutral-400 max-w-xs mx-auto", children: "Splits are automatically populated when visible in the screenshot or calculated from an attached GPX file." })] }));
    }
    const paces = validSplits.map((s) => s.pace_seconds).filter((p) => p > 0);
    const minPace = Math.min(...paces);
    const maxPace = Math.max(...paces);
    const paceRange = maxPace - minPace || 1;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-soft", children: [_jsxs("div", { className: "grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-neutral-400 pb-3 border-b border-neutral-100 px-1", children: [_jsx("div", { className: "col-span-2 text-left", children: "KM" }), _jsx("div", { className: "col-span-7 text-left", children: "Pace" }), _jsx("div", { className: "col-span-3 text-right", children: "Elev (m)" })] }), _jsx("div", { className: "divide-y divide-neutral-50", children: validSplits.map((split, index) => {
                            const relativeScore = 1 - (split.pace_seconds - minPace) / paceRange;
                            const barWidthPercent = Math.max(35, Math.min(100, Math.round(40 + relativeScore * 60)));
                            const isFastest = split.pace_seconds === minPace && paces.length > 1;
                            return (_jsxs("div", { className: "grid grid-cols-12 items-center py-3.5 px-1 hover:bg-neutral-50/60 rounded-xl transition-colors", children: [_jsx("div", { className: "col-span-2 text-sm font-bold text-neutral-800 font-mono", children: split.km }), _jsxs("div", { className: "col-span-7 flex items-center space-x-3", children: [_jsx("span", { className: "text-sm font-semibold text-neutral-700 w-12 font-mono", children: formatPace(split.pace_seconds, unitSystem, false) }), _jsx("div", { className: "flex-1 bg-neutral-100 rounded-full h-3.5 max-w-[130px] overflow-hidden", children: _jsx("div", { style: { width: `${barWidthPercent}%` }, className: `h-full rounded-full transition-all duration-300 ${isFastest ? 'bg-[#FF5500]' : 'bg-[#FF884D]'}` }) })] }), _jsx("div", { className: "col-span-3 text-right text-xs font-semibold", children: split.elevation_diff_m !== undefined && split.elevation_diff_m !== null ? (_jsxs("span", { className: split.elevation_diff_m > 0
                                                ? 'text-emerald-600'
                                                : split.elevation_diff_m < 0
                                                    ? 'text-rose-500'
                                                    : 'text-neutral-400', children: [split.elevation_diff_m > 0 ? `+${split.elevation_diff_m}` : split.elevation_diff_m, _jsx("span", { className: "text-[10px] text-neutral-400 ml-0.5", children: "m" })] })) : (_jsx("span", { className: "text-neutral-300", children: "--" })) })] }, index));
                        }) })] }), avgPaceSeconds && (_jsxs("div", { className: "bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-soft flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-400", children: "Average Pace" }), _jsxs("div", { className: "text-right", children: [_jsx("span", { className: "text-2xl font-black text-neutral-900 font-mono tracking-tight", children: formatPace(avgPaceSeconds, unitSystem, false) }), _jsxs("span", { className: "text-xs font-bold text-neutral-500 ml-1", children: ["/", unitSystem === 'metric' ? 'km' : 'mi'] })] })] }))] }));
};
