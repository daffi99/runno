import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatDate } from '../utils/formatters';
import { ChevronLeft, ChevronRight, FileCode, Download, Copy, Check, } from 'lucide-react';
export const ExportView = ({ runs, onBack }) => {
    const [selectedRunId, setSelectedRunId] = useState(runs[0]?.id || '');
    const [exportMode, setExportMode] = useState('all');
    const [copied, setCopied] = useState(false);
    const getCleanExportJson = () => {
        const targetRuns = exportMode === 'single'
            ? runs.filter((r) => r.id === selectedRunId)
            : runs;
        const formattedRuns = targetRuns.map((r) => ({
            id: r.id,
            date: formatDate(r.date, 'isoDate'),
            source: r.source.toLowerCase(),
            distance_km: r.distance_km,
            duration_seconds: r.duration_seconds,
            pace_seconds_per_km: r.pace_seconds_per_km,
            best_pace_seconds_per_km: r.best_pace_seconds_per_km || null,
            avg_speed_kmh: r.avg_speed_kmh,
            avg_heart_rate: r.avg_heart_rate,
            max_heart_rate: r.max_heart_rate,
            cadence: r.cadence,
            max_cadence: r.max_cadence || null,
            elevation_gain_m: r.elevation_gain_m,
            elevation_loss_m: r.elevation_loss_m,
            calories: r.calories,
            active_calories: r.active_calories || null,
            // Huawei Health & Advanced Running Dynamics
            total_steps: r.total_steps || null,
            stride_length_cm: r.stride_length_cm || null,
            ground_contact_time_ms: r.ground_contact_time_ms || null,
            vertical_oscillation_cm: r.vertical_oscillation_cm || null,
            ground_contact_balance: r.ground_contact_balance || null,
            aerobic_te: r.aerobic_te || null,
            vo2max: r.vo2max || null,
            training_load: r.training_load || null,
            recovery_hours: r.recovery_hours || null,
            route: r.route_data
                ? {
                    point_count: r.route_data.coordinates.length,
                    splits: r.route_data.splits,
                    coordinates: r.route_data.coordinates,
                }
                : null,
        }));
        return JSON.stringify({ runs: formattedRuns, total: formattedRuns.length }, null, 2);
    };
    const jsonContent = getCleanExportJson();
    const handleCopy = () => {
        navigator.clipboard.writeText(jsonContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const handleDownload = () => {
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
            exportMode === 'single'
                ? `run-${selectedRunId}.json`
                : `runno-export-all-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    return (_jsxs("div", { className: "max-w-md mx-auto px-4 pt-4 pb-28 space-y-5", children: [_jsxs("div", { className: "flex items-center space-x-3 pt-2", children: [_jsx("button", { onClick: onBack, className: "p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-700 transition-colors", "aria-label": "Back", children: _jsx(ChevronLeft, { className: "w-6 h-6" }) }), _jsx("h1", { className: "text-xl font-bold text-neutral-900", children: "Export" })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs(Card, { variant: "interactive", onClick: () => setExportMode('single'), className: `p-4 flex items-center justify-between border-2 transition-all ${exportMode === 'single'
                            ? 'border-[#FF5500] bg-orange-50/10'
                            : 'border-transparent bg-white'}`, children: [_jsxs("div", { className: "flex items-center space-x-3.5", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0", children: _jsx(FileCode, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-neutral-900", children: "Export Single Run" }), _jsx("p", { className: "text-xs text-neutral-400", children: "Export this run as JSON" })] })] }), _jsx(ChevronRight, { className: "w-4 h-4 text-neutral-400" })] }), _jsxs(Card, { variant: "interactive", onClick: () => setExportMode('all'), className: `p-4 flex items-center justify-between border-2 transition-all ${exportMode === 'all'
                            ? 'border-[#FF5500] bg-orange-50/10'
                            : 'border-transparent bg-white'}`, children: [_jsxs("div", { className: "flex items-center space-x-3.5", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-orange-50 text-[#FF5500] flex items-center justify-center shrink-0", children: _jsx(FileCode, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-neutral-900", children: "Export All Runs" }), _jsx("p", { className: "text-xs text-neutral-400", children: "Export all runs as JSON" })] })] }), _jsx(ChevronRight, { className: "w-4 h-4 text-neutral-400" })] })] }), exportMode === 'single' && (_jsxs("div", { className: "space-y-1.5 animate-in fade-in", children: [_jsx("label", { className: "text-xs font-bold text-neutral-600 uppercase tracking-wider", children: "Select Run to Export" }), _jsx("select", { value: selectedRunId, onChange: (e) => setSelectedRunId(e.target.value), className: "w-full bg-white border border-neutral-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20", children: runs.map((r) => (_jsxs("option", { value: r.id, children: [formatDate(r.date), " \u2014 ", r.distance_km, " km (", r.source, ")"] }, r.id))) })] })), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-400", children: "Structured JSON Preview" }), _jsx("span", { className: "text-[11px] text-neutral-400 font-mono", children: "Claude-ready schema" })] }), _jsx("div", { className: "bg-neutral-900 text-emerald-400 rounded-3xl p-4 font-mono text-[11px] max-h-64 overflow-y-auto shadow-soft leading-relaxed border border-neutral-800", children: _jsx("pre", { children: jsonContent }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [_jsx(Button, { variant: "secondary", size: "lg", onClick: handleCopy, leftIcon: copied ? _jsx(Check, { className: "w-4 h-4 text-emerald-600" }) : _jsx(Copy, { className: "w-4 h-4" }), className: "font-bold text-xs", children: copied ? 'Copied to Clipboard!' : 'Copy JSON' }), _jsx(Button, { variant: "primary", size: "lg", onClick: handleDownload, leftIcon: _jsx(Download, { className: "w-4 h-4" }), className: "font-bold text-xs shadow-glow-orange", children: "Download JSON" })] })] }));
};
