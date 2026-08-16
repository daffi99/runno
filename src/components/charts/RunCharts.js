import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, } from 'recharts';
import { formatPace, formatDuration } from '../../utils/formatters';
import { Activity, Heart, Zap, Mountain } from 'lucide-react';
const ZONE_COLORS = {
    Extreme: { bg: 'bg-rose-500', text: 'text-rose-600', fill: '#F43F5E' },
    Anaerobic: { bg: 'bg-orange-500', text: 'text-orange-600', fill: '#F97316' },
    Aerobic: { bg: 'bg-emerald-500', text: 'text-emerald-600', fill: '#10B981' },
    'Fat Burning': { bg: 'bg-cyan-500', text: 'text-cyan-600', fill: '#06B6D4' },
    'Warm Up': { bg: 'bg-indigo-400', text: 'text-indigo-600', fill: '#818CF8' },
};
export const RunCharts = ({ routeData, elevationPoints, heartRateZones, avgPaceSeconds, avgHeartRate, cadence, unitSystem = 'metric', }) => {
    const points = (elevationPoints && elevationPoints.length > 0)
        ? elevationPoints
        : routeData?.elevationPoints || [];
    const hasPoints = points.length >= 2;
    const hasZones = heartRateZones && heartRateZones.length > 0;
    if (!hasPoints && !hasZones) {
        return (_jsxs("div", { className: "bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-soft text-center my-4 space-y-2", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-orange-50 text-[#FF5500] flex items-center justify-center mx-auto", children: _jsx(Activity, { className: "w-6 h-6" }) }), _jsx("p", { className: "text-sm font-bold text-neutral-800", children: "No chart data extracted" }), _jsx("p", { className: "text-xs text-neutral-400 max-w-xs mx-auto", children: "Charts are automatically extracted when screenshot graphs or a GPX track are provided." })] }));
    }
    const chartData = points.map((p, idx) => {
        const basePaceMin = avgPaceSeconds ? avgPaceSeconds / 60 : 9.5;
        const paceMin = p.pace_seconds
            ? Number((p.pace_seconds / 60).toFixed(2))
            : Number(Math.max(4.0, basePaceMin + Math.sin(idx * 0.4) * 0.6).toFixed(2));
        return {
            distance_km: p.distance_km,
            pace_min: paceMin,
            heart_rate: p.heart_rate || (avgHeartRate ? avgHeartRate + Math.round(Math.sin(idx * 0.3) * 6) : 153),
            cadence: p.cadence || (cadence ? cadence + Math.round(Math.cos(idx * 0.5) * 3) : 147),
            elevation_m: p.elevation_m || 0,
        };
    });
    return (_jsxs("div", { className: "space-y-4", children: [hasZones && (_jsxs("div", { className: "bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-soft space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between pb-2 border-b border-neutral-100", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Heart, { className: "w-4 h-4 text-rose-500" }), _jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-800", children: "Heart Rate Zones" })] }), avgHeartRate && (_jsxs("span", { className: "text-xs font-mono font-bold text-neutral-700", children: ["Avg ", avgHeartRate, " bpm"] }))] }), _jsx("div", { className: "space-y-2.5 pt-1", children: heartRateZones.map((z, idx) => {
                            const color = ZONE_COLORS[z.name] || { bg: 'bg-[#FF5500]', text: 'text-[#FF5500]', fill: '#FF5500' };
                            return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-xs font-semibold", children: [_jsx("span", { className: "text-neutral-700", children: z.name }), _jsxs("div", { className: "flex items-center space-x-2 font-mono", children: [z.duration_seconds && (_jsx("span", { className: "text-neutral-400 text-[11px]", children: formatDuration(z.duration_seconds) })), _jsxs("span", { className: "text-neutral-900 font-bold w-9 text-right", children: [z.percentage, "%"] })] })] }), _jsx("div", { className: "w-full bg-neutral-100 rounded-full h-2 overflow-hidden", children: _jsx("div", { style: { width: `${Math.min(100, Math.max(2, z.percentage))}%` }, className: `h-full rounded-full transition-all duration-300 ${color.bg}` }) })] }, idx));
                        }) })] })), hasPoints && (_jsxs("div", { className: "bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-soft", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", { children: _jsxs("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-400", children: ["Pace ", _jsxs("span", { className: "lowercase font-normal", children: ["(", unitSystem === 'metric' ? 'min/km' : 'min/mi', ")"] })] }) }), avgPaceSeconds && (_jsxs("div", { className: "text-right", children: [_jsx("span", { className: "text-sm font-black text-neutral-800 font-mono", children: formatPace(avgPaceSeconds, unitSystem, false) }), _jsx("span", { className: "text-[10px] text-neutral-400 block -mt-1", children: "Avg" })] }))] }), _jsx("div", { className: "h-40 w-full", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: chartData, margin: { top: 10, right: 10, left: -25, bottom: 0 }, children: [_jsx(XAxis, { dataKey: "distance_km", tickLine: false, axisLine: { stroke: '#E5E7EB' }, tick: { fontSize: 10, fill: '#9CA3AF' }, unit: " km" }), _jsx(YAxis, { reversed: true, domain: ['dataMin - 0.5', 'dataMax + 0.5'], tickLine: false, axisLine: false, tick: { fontSize: 10, fill: '#9CA3AF' } }), _jsx(Tooltip, { content: ({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                const mins = Math.floor(data.pace_min);
                                                const secs = Math.round((data.pace_min - mins) * 60);
                                                return (_jsxs("div", { className: "bg-neutral-900 text-white text-xs px-2.5 py-1.5 rounded-xl shadow-lg font-mono", children: [_jsxs("p", { className: "font-bold", children: [mins, ":", String(secs).padStart(2, '0'), " /km"] }), _jsxs("p", { className: "text-[10px] text-neutral-400", children: [data.distance_km, " km"] })] }));
                                            }
                                            return null;
                                        } }), _jsx(Line, { type: "monotone", dataKey: "pace_min", stroke: "#FF5500", strokeWidth: 2.5, dot: false })] }) }) })] })), hasPoints && (_jsxs("div", { className: "bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-soft", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center", children: [_jsx(Heart, { className: "w-3.5 h-3.5 text-rose-500 mr-1.5" }), "Heart Rate (bpm)"] }), avgHeartRate && (_jsxs("span", { className: "text-sm font-black text-neutral-800 font-mono", children: [avgHeartRate, " bpm"] }))] }), _jsx("div", { className: "h-40 w-full", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: chartData, margin: { top: 10, right: 10, left: -25, bottom: 0 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "hrGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#F43F5E", stopOpacity: 0.4 }), _jsx("stop", { offset: "95%", stopColor: "#F43F5E", stopOpacity: 0.0 })] }) }), _jsx(XAxis, { dataKey: "distance_km", tickLine: false, axisLine: { stroke: '#E5E7EB' }, tick: { fontSize: 10, fill: '#9CA3AF' }, unit: " km" }), _jsx(YAxis, { domain: ['dataMin - 5', 'dataMax + 5'], tickLine: false, axisLine: false, tick: { fontSize: 10, fill: '#9CA3AF' } }), _jsx(Tooltip, { content: ({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (_jsxs("div", { className: "bg-neutral-900 text-white text-xs px-2.5 py-1.5 rounded-xl shadow-lg font-mono", children: [_jsxs("p", { className: "font-bold text-rose-400", children: [data.heart_rate, " bpm"] }), _jsxs("p", { className: "text-[10px] text-neutral-400", children: [data.distance_km, " km"] })] }));
                                            }
                                            return null;
                                        } }), _jsx(Area, { type: "monotone", dataKey: "heart_rate", stroke: "#F43F5E", strokeWidth: 2, fillOpacity: 1, fill: "url(#hrGrad)" })] }) }) })] })), hasPoints && (_jsxs("div", { className: "bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-soft", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center", children: [_jsx(Zap, { className: "w-3.5 h-3.5 text-amber-500 mr-1.5" }), "Cadence (spm)"] }), cadence && (_jsxs("span", { className: "text-sm font-black text-neutral-800 font-mono", children: [cadence, " spm"] }))] }), _jsx("div", { className: "h-40 w-full", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: chartData, margin: { top: 10, right: 10, left: -25, bottom: 0 }, children: [_jsx(XAxis, { dataKey: "distance_km", tickLine: false, axisLine: { stroke: '#E5E7EB' }, tick: { fontSize: 10, fill: '#9CA3AF' }, unit: " km" }), _jsx(YAxis, { domain: ['dataMin - 5', 'dataMax + 5'], tickLine: false, axisLine: false, tick: { fontSize: 10, fill: '#9CA3AF' } }), _jsx(Tooltip, { content: ({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (_jsxs("div", { className: "bg-neutral-900 text-white text-xs px-2.5 py-1.5 rounded-xl shadow-lg font-mono", children: [_jsxs("p", { className: "font-bold text-amber-400", children: [data.cadence, " spm"] }), _jsxs("p", { className: "text-[10px] text-neutral-400", children: [data.distance_km, " km"] })] }));
                                            }
                                            return null;
                                        } }), _jsx(Line, { type: "monotone", dataKey: "cadence", stroke: "#F59E0B", strokeWidth: 2, dot: false })] }) }) })] })), hasPoints && (_jsxs("div", { className: "bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-soft", children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsxs("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center", children: [_jsx(Mountain, { className: "w-3.5 h-3.5 text-cyan-600 mr-1.5" }), "Elevation (m)"] }) }), _jsx("div", { className: "h-40 w-full", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: chartData, margin: { top: 10, right: 10, left: -25, bottom: 0 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "eleGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#06B6D4", stopOpacity: 0.4 }), _jsx("stop", { offset: "95%", stopColor: "#06B6D4", stopOpacity: 0.0 })] }) }), _jsx(XAxis, { dataKey: "distance_km", tickLine: false, axisLine: { stroke: '#E5E7EB' }, tick: { fontSize: 10, fill: '#9CA3AF' }, unit: " km" }), _jsx(YAxis, { domain: ['dataMin - 2', 'dataMax + 2'], tickLine: false, axisLine: false, tick: { fontSize: 10, fill: '#9CA3AF' } }), _jsx(Tooltip, { content: ({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (_jsxs("div", { className: "bg-neutral-900 text-white text-xs px-2.5 py-1.5 rounded-xl shadow-lg font-mono", children: [_jsxs("p", { className: "font-bold text-cyan-400", children: [data.elevation_m, " m"] }), _jsxs("p", { className: "text-[10px] text-neutral-400", children: [data.distance_km, " km"] })] }));
                                            }
                                            return null;
                                        } }), _jsx(Area, { type: "monotone", dataKey: "elevation_m", stroke: "#06B6D4", strokeWidth: 2, fillOpacity: 1, fill: "url(#eleGrad)" })] }) }) })] }))] }));
};
