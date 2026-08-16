import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { storageService } from './services/storage';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './views/DashboardView';
import { HistoryView } from './views/HistoryView';
import { AddRunView } from './views/AddRunView';
import { ReviewRunView } from './views/ReviewRunView';
import { RunDetailView } from './views/RunDetailView';
import { StatsView } from './views/StatsView';
import { ExportView } from './views/ExportView';
import { MoreView } from './views/MoreView';
import { CoachView } from './views/CoachView';
export const App = () => {
    const [runs, setRuns] = useState([]);
    const [settings, setSettings] = useState(storageService.getSettings());
    const [screen, setScreen] = useState({ type: 'tab', tab: 'dashboard' });
    const loadData = async () => {
        // 1. Immediately read local storage
        const local = storageService.getRuns();
        setRuns(local);
        setSettings(storageService.getSettings());
        // 2. Sync in background with smart merge
        const synced = await storageService.syncWithServer();
        setRuns(synced);
    };
    useEffect(() => {
        loadData();
    }, []);
    const handleSelectTab = (tab) => {
        if (tab === 'add') {
            setScreen({ type: 'tab', tab: 'add' });
        }
        else {
            setScreen({ type: 'tab', tab });
        }
    };
    const handleSelectRun = (runId) => {
        const currentTab = screen.type === 'tab' ? screen.tab : 'dashboard';
        setScreen({ type: 'runDetail', runId, previousTab: currentTab });
    };
    const handleAnalysisComplete = (payload) => {
        setScreen({
            type: 'reviewRun',
            screenshotBase64: payload.screenshotBase64,
            routeData: payload.routeData,
            extractedData: payload.extractedData,
        });
    };
    const handleSaveRun = async (newRun) => {
        // 1. Immediate optimistic UI update
        setRuns((prev) => {
            const idx = prev.findIndex((r) => r.id === newRun.id);
            if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = newRun;
                return copy;
            }
            return [newRun, ...prev];
        });
        // 2. Save to storage & DB
        await storageService.saveRun(newRun);
        // 3. Immediately show Run Detail
        setScreen({ type: 'runDetail', runId: newRun.id, previousTab: 'dashboard' });
    };
    const handleDeleteRun = (id) => {
        storageService.deleteRun(id);
        setRuns((prev) => prev.filter((r) => r.id !== id));
        setScreen({ type: 'tab', tab: 'history' });
    };
    const handleUpdateSettings = (newSettings) => {
        const updated = storageService.saveSettings(newSettings);
        setSettings(updated);
    };
    const handleExportJson = () => {
        setScreen({ type: 'export' });
    };
    const currentTab = screen.type === 'tab' ? screen.tab : 'dashboard';
    const showBottomNav = screen.type === 'tab' && screen.tab !== 'add';
    return (_jsxs("div", { className: "min-h-screen bg-[#F9FAFB] text-neutral-900 font-sans antialiased selection:bg-orange-100 selection:text-[#FF5500]", children: [_jsxs("main", { className: "max-w-md mx-auto min-h-screen relative", children: [screen.type === 'tab' && screen.tab === 'dashboard' && (_jsx(DashboardView, { runs: runs, unitSystem: settings.unitSystem, onSelectRun: handleSelectRun, onNavigateTab: handleSelectTab })), screen.type === 'tab' && screen.tab === 'history' && (_jsx(HistoryView, { runs: runs, unitSystem: settings.unitSystem, onSelectRun: handleSelectRun })), screen.type === 'tab' && screen.tab === 'coach' && (_jsx(CoachView, { runs: runs, unitSystem: settings.unitSystem, onNavigateAddRun: () => setScreen({ type: 'tab', tab: 'add' }), onSelectRun: handleSelectRun, customApiKey: settings.customOpenRouterKey })), screen.type === 'tab' && screen.tab === 'add' && (_jsx(AddRunView, { onBack: () => setScreen({ type: 'tab', tab: 'dashboard' }), onAnalysisComplete: handleAnalysisComplete, customApiKey: settings.customOpenRouterKey })), screen.type === 'tab' && screen.tab === 'stats' && (_jsx(StatsView, { runs: runs, unitSystem: settings.unitSystem })), screen.type === 'tab' && screen.tab === 'more' && (_jsx(MoreView, { settings: settings, onUpdateSettings: handleUpdateSettings, onNavigateExport: handleExportJson, onNavigateStats: () => setScreen({ type: 'tab', tab: 'stats' }), onDataChanged: loadData })), screen.type === 'reviewRun' && (_jsx(ReviewRunView, { screenshotBase64: screen.screenshotBase64, routeData: screen.routeData, extractedData: screen.extractedData, onBack: () => setScreen({ type: 'tab', tab: 'add' }), onSaveRun: handleSaveRun })), screen.type === 'runDetail' && ((() => {
                        const run = runs.find((r) => r.id === screen.runId) || storageService.getRunById(screen.runId);
                        if (!run) {
                            return (_jsxs("div", { className: "p-8 text-center", children: [_jsx("p", { className: "text-sm font-semibold text-neutral-600", children: "Run not found." }), _jsx("button", { onClick: () => setScreen({ type: 'tab', tab: screen.previousTab || 'dashboard' }), className: "mt-4 px-4 py-2 bg-[#FF5500] text-white text-xs font-bold rounded-2xl", children: "Go Back" })] }));
                        }
                        return (_jsx(RunDetailView, { run: run, unitSystem: settings.unitSystem, onBack: () => setScreen({ type: 'tab', tab: screen.previousTab || 'dashboard' }), onDeleteRun: handleDeleteRun, onExportJson: handleExportJson, onUpdateRun: handleSaveRun }));
                    })()), screen.type === 'export' && (_jsx(ExportView, { runs: runs, onBack: () => setScreen({ type: 'tab', tab: 'more' }) }))] }), showBottomNav && (_jsx(BottomNav, { currentTab: currentTab, onSelectTab: handleSelectTab }))] }));
};
export default App;
