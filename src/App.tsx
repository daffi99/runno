import React, { useState, useEffect } from 'react';
import type { Run, ExtractedRunData, RouteData } from './types/run';
import { storageService, type AppSettings } from './services/storage';
import { BottomNav, type NavTab } from './components/layout/BottomNav';
import { DashboardView } from './views/DashboardView';
import { HistoryView } from './views/HistoryView';
import { AddRunView } from './views/AddRunView';
import { ReviewRunView } from './views/ReviewRunView';
import { RunDetailView } from './views/RunDetailView';
import { StatsView } from './views/StatsView';
import { ExportView } from './views/ExportView';
import { MoreView } from './views/MoreView';
import { CoachView } from './views/CoachView';


type AppScreen =
  | { type: 'tab'; tab: NavTab }
  | { type: 'runDetail'; runId: string; previousTab?: NavTab }
  | {
      type: 'reviewRun';
      screenshotBase64: string | null;
      routeData: RouteData | null;
      extractedData: ExtractedRunData;
    }
  | { type: 'export' };

const VALID_TABS: NavTab[] = ['dashboard', 'history', 'add', 'coach', 'stats', 'more'];

const getInitialScreen = (): AppScreen => {
  if (typeof window === 'undefined') {
    return { type: 'tab', tab: 'dashboard' };
  }

  // 1. Try to read from URL Hash
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (hash) {
    if (VALID_TABS.includes(hash as NavTab)) {
      return { type: 'tab', tab: hash as NavTab };
    }
    if (hash.startsWith('run/')) {
      const runId = hash.replace('run/', '').trim();
      if (runId) {
        return { type: 'runDetail', runId, previousTab: 'history' };
      }
    }
    if (hash === 'export') {
      return { type: 'export' };
    }
  }

  // 2. Try to read from localStorage
  try {
    const saved = localStorage.getItem('runno_last_screen');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.type === 'tab' && VALID_TABS.includes(parsed.tab)) {
        return { type: 'tab', tab: parsed.tab };
      }
      if (parsed?.type === 'runDetail' && parsed.runId) {
        return { type: 'runDetail', runId: parsed.runId, previousTab: parsed.previousTab || 'history' };
      }
      if (parsed?.type === 'export') {
        return { type: 'export' };
      }
    }
  } catch (_) {}

  return { type: 'tab', tab: 'dashboard' };
};

export const App: React.FC = () => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [screen, setScreen] = useState<AppScreen>(getInitialScreen);

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

  // Persist current screen to localStorage & sync with URL hash
  useEffect(() => {
    try {
      if (screen.type === 'tab' || screen.type === 'runDetail' || screen.type === 'export') {
        localStorage.setItem('runno_last_screen', JSON.stringify(screen));
      }
    } catch (_) {}

    let newHash = '';
    if (screen.type === 'tab') {
      newHash = `#${screen.tab}`;
    } else if (screen.type === 'runDetail') {
      newHash = `#run/${screen.runId}`;
    } else if (screen.type === 'export') {
      newHash = '#export';
    }

    if (newHash && window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }

    // Scroll window and document to top on screen change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [screen]);

  // Listen to browser Back/Forward & hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (VALID_TABS.includes(hash as NavTab)) {
        setScreen({ type: 'tab', tab: hash as NavTab });
      } else if (hash.startsWith('run/')) {
        const runId = hash.replace('run/', '').trim();
        if (runId) setScreen({ type: 'runDetail', runId, previousTab: 'history' });
      } else if (hash === 'export') {
        setScreen({ type: 'export' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tab: NavTab) => {
    if (tab === 'add') {
      setScreen({ type: 'tab', tab: 'add' });
    } else {
      setScreen({ type: 'tab', tab });
    }
  };

  const handleSelectRun = (runId: string) => {
    const currentTab = screen.type === 'tab' ? screen.tab : 'dashboard';
    setScreen({ type: 'runDetail', runId, previousTab: currentTab });
  };


  const handleAnalysisComplete = (payload: {
    screenshotBase64: string | null;
    routeData: RouteData | null;
    extractedData: ExtractedRunData;
  }) => {
    setScreen({
      type: 'reviewRun',
      screenshotBase64: payload.screenshotBase64,
      routeData: payload.routeData,
      extractedData: payload.extractedData,
    });
  };

  const handleSaveRun = async (newRun: Run) => {
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

  const handleDeleteRun = (id: string) => {
    storageService.deleteRun(id);
    setRuns((prev) => prev.filter((r) => r.id !== id));
    setScreen({ type: 'tab', tab: 'history' });
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = storageService.saveSettings(newSettings);
    setSettings(updated);
  };

  const handleExportJson = () => {
    setScreen({ type: 'export' });
  };

  const currentTab: NavTab = screen.type === 'tab' ? screen.tab : 'dashboard';
  const showBottomNav = screen.type === 'tab' && screen.tab !== 'add';

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans antialiased selection:bg-orange-900 selection:text-[#FF5500]">
      <main className="max-w-md mx-auto min-h-screen relative">
        {screen.type === 'tab' && screen.tab === 'dashboard' && (
          <DashboardView
            runs={runs}
            unitSystem={settings.unitSystem}
            onSelectRun={handleSelectRun}
            onNavigateTab={handleSelectTab}
            onRefresh={loadData}
          />
        )}


        {screen.type === 'tab' && screen.tab === 'history' && (
          <HistoryView
            runs={runs}
            unitSystem={settings.unitSystem}
            onSelectRun={handleSelectRun}
          />
        )}

        {screen.type === 'tab' && screen.tab === 'coach' && (
          <CoachView
            runs={runs}
            unitSystem={settings.unitSystem}
            onNavigateAddRun={() => setScreen({ type: 'tab', tab: 'add' })}
            onSelectRun={handleSelectRun}
            customApiKey={settings.customOpenRouterKey}
          />
        )}


        {screen.type === 'tab' && screen.tab === 'add' && (
          <AddRunView
            onBack={() => setScreen({ type: 'tab', tab: 'dashboard' })}
            onAnalysisComplete={handleAnalysisComplete}
            customApiKey={settings.customOpenRouterKey}
          />
        )}

        {screen.type === 'tab' && screen.tab === 'stats' && (
          <StatsView runs={runs} unitSystem={settings.unitSystem} />
        )}

        {screen.type === 'tab' && screen.tab === 'more' && (
          <MoreView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onNavigateExport={handleExportJson}
            onNavigateStats={() => setScreen({ type: 'tab', tab: 'stats' })}
            onDataChanged={loadData}
          />
        )}


        {screen.type === 'reviewRun' && (
          <ReviewRunView
            screenshotBase64={screen.screenshotBase64}
            routeData={screen.routeData}
            extractedData={screen.extractedData}
            onBack={() => setScreen({ type: 'tab', tab: 'add' })}
            onSaveRun={handleSaveRun}
          />
        )}

        {screen.type === 'runDetail' && (
          (() => {
            const run = runs.find((r) => r.id === screen.runId) || storageService.getRunById(screen.runId);
            if (!run) {
              return (
                <div className="p-8 text-center">
                  <p className="text-sm font-semibold text-neutral-600">Run not found.</p>
                  <button
                    onClick={() => setScreen({ type: 'tab', tab: screen.previousTab || 'dashboard' })}
                    className="mt-4 px-4 py-2 bg-[#FF5500] text-white text-xs font-bold rounded-2xl"
                  >
                    Go Back
                  </button>
                </div>
              );
            }
            return (
              <RunDetailView
                run={run}
                unitSystem={settings.unitSystem}
                onBack={() => setScreen({ type: 'tab', tab: screen.previousTab || 'dashboard' })}
                onDeleteRun={handleDeleteRun}
                onExportJson={handleExportJson}
                onUpdateRun={handleSaveRun}
                customApiKey={settings.customOpenRouterKey}
              />
            );


          })()
        )}

        {screen.type === 'export' && (
          <ExportView runs={runs} onBack={() => setScreen({ type: 'tab', tab: 'more' })} />
        )}
      </main>

      {showBottomNav && (
        <BottomNav
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
        />
      )}
    </div>
  );
};
export default App;
