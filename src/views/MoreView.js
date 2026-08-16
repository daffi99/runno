import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { storageService } from '../services/storage';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronRight, Sparkles, Scale, DownloadCloud, UploadCloud, Trash2, CheckCircle2, Smartphone, Check, BarChart2, } from 'lucide-react';
export const MoreView = ({ settings, onUpdateSettings, onNavigateExport, onNavigateStats, onDataChanged, }) => {
    const [apiKeyInput, setApiKeyInput] = useState(settings.customOpenRouterKey || '');
    const [savedKeySuccess, setSavedKeySuccess] = useState(false);
    const [importStatus, setImportStatus] = useState(null);
    const fileInputRef = useRef(null);
    const handleSaveApiKey = () => {
        onUpdateSettings({ customOpenRouterKey: apiKeyInput.trim() });
        setSavedKeySuccess(true);
        setTimeout(() => setSavedKeySuccess(false), 2500);
    };
    const handleToggleUnit = () => {
        const nextUnit = settings.unitSystem === 'metric' ? 'imperial' : 'metric';
        onUpdateSettings({ unitSystem: nextUnit });
    };
    const handleImportJsonFile = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result;
            const result = storageService.importRunsJson(content);
            if (result.success) {
                onDataChanged();
                setImportStatus(`Successfully imported ${result.count} runs!`);
            }
            else {
                setImportStatus(`Import error: ${result.error}`);
            }
            setTimeout(() => setImportStatus(null), 4000);
        };
        reader.readAsText(file);
    };
    const handleClearAll = () => {
        if (confirm('Are you sure you want to clear all running logs? This will delete all local and database records.')) {
            storageService.clearAllData();
            onDataChanged();
            setImportStatus('Cleared all runs.');
            setTimeout(() => setImportStatus(null), 3000);
        }
    };
    return (_jsxs("div", { className: "max-w-md mx-auto px-4 pt-4 pb-28 space-y-5", children: [_jsxs("div", { className: "pt-2", children: [_jsx("h1", { className: "text-2xl font-black text-neutral-900 tracking-tight", children: "More & Settings" }), _jsx("p", { className: "text-xs text-neutral-400 font-medium mt-0.5", children: "Preferences, API key & data management" })] }), importStatus && (_jsxs("div", { className: "p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-emerald-800 text-xs animate-in fade-in", children: [_jsx(CheckCircle2, { className: "w-4 h-4 shrink-0 text-emerald-600" }), _jsx("span", { children: importStatus })] })), _jsxs("div", { className: "space-y-3", children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-400", children: "Preferences" }), _jsxs(Card, { className: "p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3.5", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-orange-50 text-[#FF5500] flex items-center justify-center shrink-0", children: _jsx(Scale, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-neutral-900", children: "Unit System" }), _jsx("p", { className: "text-xs text-neutral-400", children: settings.unitSystem === 'metric'
                                                    ? 'Metric (Kilometers, km/h, meters)'
                                                    : 'Imperial (Miles, mph, feet)' })] })] }), _jsx("button", { onClick: handleToggleUnit, className: "px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-800 transition-colors uppercase", children: settings.unitSystem })] }), onNavigateStats && (_jsxs(Card, { variant: "interactive", onClick: onNavigateStats, className: "p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3.5", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0", children: _jsx(BarChart2, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-neutral-900", children: "Stats & Records" }), _jsx("p", { className: "text-xs text-neutral-400", children: "Monthly mileage volume and personal bests" })] })] }), _jsx(ChevronRight, { className: "w-4 h-4 text-neutral-400" })] }))] }), _jsxs("div", { className: "space-y-3", children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-400", children: "AI Screenshot Extraction" }), _jsxs(Card, { className: "p-4 space-y-3 bg-white", children: [_jsxs("div", { className: "flex items-start space-x-3.5", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-orange-50 text-[#FF5500] flex items-center justify-center shrink-0 mt-0.5", children: _jsx(Sparkles, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-neutral-900", children: "Custom OpenRouter API Key" }), _jsx("p", { className: "text-xs text-neutral-400 mt-0.5", children: "Override server API key with your own personal OpenRouter key." })] })] }), _jsxs("div", { className: "space-y-2 pt-1", children: [_jsx("input", { type: "password", placeholder: "sk-or-v1-...", value: apiKeyInput, onChange: (e) => setApiKeyInput(e.target.value), className: "w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 font-mono" }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { variant: savedKeySuccess ? 'outline' : 'secondary', size: "sm", onClick: handleSaveApiKey, leftIcon: savedKeySuccess ? _jsx(Check, { className: "w-3.5 h-3.5 text-emerald-600" }) : undefined, className: "text-xs font-bold", children: savedKeySuccess ? 'Saved Key!' : 'Save Key' }) })] })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-400", children: "Data & Backup" }), _jsxs(Card, { variant: "interactive", onClick: onNavigateExport, className: "p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3.5", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0", children: _jsx(DownloadCloud, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-neutral-900", children: "Export Runs (JSON)" }), _jsx("p", { className: "text-xs text-neutral-400", children: "Export single run or all runs formatted for Claude" })] })] }), _jsx(ChevronRight, { className: "w-4 h-4 text-neutral-400" })] }), _jsx("input", { ref: fileInputRef, type: "file", accept: ".json,application/json", className: "hidden", onChange: handleImportJsonFile }), _jsxs(Card, { variant: "interactive", onClick: () => fileInputRef.current?.click(), className: "p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3.5", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0", children: _jsx(UploadCloud, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-neutral-900", children: "Import Runs (JSON)" }), _jsx("p", { className: "text-xs text-neutral-400", children: "Restore runs from a previously exported backup file" })] })] }), _jsx(ChevronRight, { className: "w-4 h-4 text-neutral-400" })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-red-500", children: "Danger Zone" }), _jsxs(Card, { className: "p-4 flex items-center justify-between border border-red-100 bg-red-50/30", children: [_jsxs("div", { className: "flex items-center space-x-3.5", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0", children: _jsx(Trash2, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-neutral-900", children: "Clear All Runs" }), _jsx("p", { className: "text-xs text-neutral-400", children: "Permanently delete all running activities" })] })] }), _jsx("button", { onClick: handleClearAll, className: "px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors", children: "Clear All" })] })] }), _jsxs("div", { className: "pt-2 text-center text-xs text-neutral-400 space-y-1", children: [_jsxs("div", { className: "flex items-center justify-center space-x-1.5 font-semibold text-neutral-600", children: [_jsx(Smartphone, { className: "w-3.5 h-3.5 text-[#FF5500]" }), _jsx("span", { children: "Runno PWA \u2022 v1.0.0" })] }), _jsx("p", { className: "text-[11px] text-neutral-400", children: "Precision Personal Running Tracker \u2022 Mobile-First PWA" })] })] }));
};
