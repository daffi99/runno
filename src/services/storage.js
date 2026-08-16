import { getDateForDayOfWeek } from '../utils/formatters';
const STORAGE_KEY = 'runno_runs_v1';
const SETTINGS_KEY = 'runno_settings_v1';
const ACTIVE_PLAN_KEY = 'runno_active_plan_v1';
const COACH_MESSAGES_KEY = 'runno_coach_messages_v1';
const DEFAULT_SETTINGS = {
    unitSystem: 'metric',
    customOpenRouterKey: '',
    enabledSources: ['Huawei Health', 'Amazfit', 'Apple Fitness', 'Garmin', 'Strava', 'Nike Run Club', 'Zepp', 'Coros'],
};
export const storageService = {
    getRuns() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        }
        catch (e) {
            console.error('Error loading runs from localStorage', e);
            return [];
        }
    },
    async syncWithServer() {
        const localRuns = this.getRuns();
        try {
            const res = await fetch('/api/runs');
            if (res.ok) {
                const data = await res.json();
                if (data.runs && Array.isArray(data.runs)) {
                    // Smart merge local and server runs (never drop un-synced local runs)
                    const runMap = new Map();
                    // Add server runs
                    for (const r of data.runs) {
                        if (r && r.id) {
                            runMap.set(r.id, r);
                        }
                    }
                    // Merge local runs (preserve local runs if not yet in DB)
                    for (const r of localRuns) {
                        if (r && r.id) {
                            const existing = runMap.get(r.id);
                            if (!existing) {
                                runMap.set(r.id, r);
                            }
                            else {
                                // Keep the version with the newer updated_at timestamp
                                const localTime = new Date(r.updated_at || r.created_at || 0).getTime();
                                const serverTime = new Date(existing.updated_at || existing.created_at || 0).getTime();
                                if (localTime >= serverTime) {
                                    runMap.set(r.id, r);
                                }
                            }
                        }
                    }
                    const merged = Array.from(runMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    this.saveRuns(merged);
                    this.syncPlanWithRuns(merged);
                    return merged;
                }
            }
        }
        catch (e) {
            console.warn('Could not sync with server DB, using local data', e);
        }
        return localRuns;
    },
    saveRuns(runs) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
        }
        catch (e) {
            console.error('Error saving runs to localStorage', e);
        }
    },
    getRunById(id) {
        const runs = this.getRuns();
        return runs.find((r) => r.id === id);
    },
    async saveRun(run) {
        const runs = this.getRuns();
        const existingIndex = runs.findIndex((r) => r.id === run.id);
        const updatedRun = {
            ...run,
            created_at: run.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        if (existingIndex >= 0) {
            runs[existingIndex] = updatedRun;
        }
        else {
            runs.unshift(updatedRun);
        }
        // Immediately write to local storage
        this.saveRuns(runs);
        // Automatically sync active plan completion with newly logged run
        this.syncPlanWithRuns(runs);
        // Save to PostgreSQL database via API
        try {
            fetch('/api/runs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRun),
            })
                .then((r) => r.json())
                .then((data) => {
                console.log('[Runno Client] Synced run to PostgreSQL database:', data?.run?.id);
            })
                .catch((err) => {
                console.warn('[Runno Client] Offline or DB sync pending:', err);
            });
        }
        catch (err) {
            console.warn('[Runno Client] DB async save error:', err);
        }
        return updatedRun;
    },
    deleteRun(id) {
        const runs = this.getRuns();
        const filtered = runs.filter((r) => r.id !== id);
        this.saveRuns(filtered);
        fetch(`/api/runs/${id}`, {
            method: 'DELETE',
        }).catch(() => { });
        return true;
    },
    getSettings() {
        try {
            const data = localStorage.getItem(SETTINGS_KEY);
            if (!data)
                return DEFAULT_SETTINGS;
            return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
        }
        catch {
            return DEFAULT_SETTINGS;
        }
    },
    saveSettings(settings) {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
        }
        catch (e) {
            console.error('Error saving settings', e);
        }
        return updated;
    },
    exportRunsJson(singleRunId) {
        const runs = this.getRuns();
        if (singleRunId) {
            const single = runs.find((r) => r.id === singleRunId);
            return JSON.stringify({ runs: single ? [single] : [] }, null, 2);
        }
        return JSON.stringify({ runs, exported_at: new Date().toISOString(), total_count: runs.length }, null, 2);
    },
    importRunsJson(jsonStr) {
        try {
            const parsed = JSON.parse(jsonStr);
            let newRuns = [];
            if (Array.isArray(parsed)) {
                newRuns = parsed;
            }
            else if (parsed && Array.isArray(parsed.runs)) {
                newRuns = parsed.runs;
            }
            else {
                return { success: false, count: 0, error: 'Invalid JSON format.' };
            }
            const existingRuns = this.getRuns();
            const runMap = new Map();
            for (const r of existingRuns) {
                runMap.set(r.id, r);
            }
            for (const r of newRuns) {
                if (r.id) {
                    runMap.set(r.id, r);
                }
            }
            const merged = Array.from(runMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            this.saveRuns(merged);
            // Sync all imported runs to DB
            for (const r of newRuns) {
                fetch('/api/runs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(r),
                }).catch(() => { });
            }
            return { success: true, count: newRuns.length };
        }
        catch (err) {
            return { success: false, count: 0, error: err.message || 'Failed to parse JSON' };
        }
    },
    clearAllData() {
        this.saveRuns([]);
        this.saveActivePlan(null);
        this.clearCoachChat();
        fetch('/api/runs', { method: 'GET' })
            .then((r) => r.json())
            .then((data) => {
            if (data.runs) {
                for (const r of data.runs) {
                    fetch(`/api/runs/${r.id}`, { method: 'DELETE' }).catch(() => { });
                }
            }
        })
            .catch(() => { });
    },
    // -------------------------------------------------------------------------
    // Training Plans & AI Coach Chat
    // -------------------------------------------------------------------------
    getActivePlan() {
        try {
            const data = localStorage.getItem(ACTIVE_PLAN_KEY);
            return data ? JSON.parse(data) : null;
        }
        catch (e) {
            console.error('Error loading active plan from localStorage', e);
            return null;
        }
    },
    saveActivePlan(plan) {
        try {
            if (!plan) {
                localStorage.removeItem(ACTIVE_PLAN_KEY);
                return;
            }
            const updatedPlan = {
                ...plan,
                updatedAt: new Date().toISOString(),
            };
            localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(updatedPlan));
            // Sync with server DB in background
            fetch('/api/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPlan),
            }).catch((e) => console.warn('[Runno Storage] Plan DB sync notice:', e));
        }
        catch (e) {
            console.error('Error saving active plan to localStorage', e);
        }
    },
    async syncActivePlanWithServer() {
        const localPlan = this.getActivePlan();
        try {
            const res = await fetch('/api/plans/active');
            if (res.ok) {
                const data = await res.json();
                if (data.plan) {
                    const serverTime = new Date(data.plan.updatedAt || data.plan.createdAt || 0).getTime();
                    const localTime = new Date(localPlan?.updatedAt || localPlan?.createdAt || 0).getTime();
                    if (serverTime >= localTime) {
                        this.saveActivePlan(data.plan);
                        return data.plan;
                    }
                }
            }
        }
        catch (e) {
            console.warn('[Runno Storage] Could not sync active plan with DB, using local', e);
        }
        return localPlan;
    },
    toggleWorkoutCompletion(workoutId, completed) {
        const plan = this.getActivePlan();
        if (!plan)
            return null;
        const updatedWorkouts = plan.workouts.map((w) => {
            if (w.id === workoutId) {
                const nextCompleted = completed !== undefined ? completed : !w.completed;
                return {
                    ...w,
                    completed: nextCompleted,
                    completedAt: nextCompleted ? new Date().toISOString() : null,
                };
            }
            return w;
        });
        const updatedPlan = {
            ...plan,
            workouts: updatedWorkouts,
            updatedAt: new Date().toISOString(),
        };
        this.saveActivePlan(updatedPlan);
        return updatedPlan;
    },
    syncPlanWithRuns(runs) {
        const plan = this.getActivePlan();
        if (!plan || !plan.workouts || plan.workouts.length === 0)
            return null;
        let hasChanges = false;
        const today = new Date();
        const updatedWorkouts = plan.workouts.map((w) => {
            // Rest or 0-km recovery days don't have running checklists
            if (w.type === 'rest' || (w.distanceKm === 0 && w.type === 'recovery')) {
                return w;
            }
            // Calculate target calendar date for this workout in the current week (YYYY-MM-DD)
            let workoutDateStr = '';
            if (w.date) {
                workoutDateStr = w.date.split('T')[0];
            }
            else if (typeof w.dayOfWeek === 'number') {
                const calculated = getDateForDayOfWeek(w.dayOfWeek, today);
                workoutDateStr = calculated.toISOString().split('T')[0];
            }
            if (!workoutDateStr)
                return w;
            // Check if there is a run logged on this date
            const matchingRun = runs.find((r) => {
                if (!r.date)
                    return false;
                const runIso = r.date.split('T')[0];
                return runIso === workoutDateStr;
            });
            if (matchingRun) {
                if (!w.completed || w.completedRunId !== matchingRun.id || w.date !== workoutDateStr) {
                    hasChanges = true;
                    return {
                        ...w,
                        date: workoutDateStr,
                        completed: true,
                        completedRunId: matchingRun.id,
                        completedAt: matchingRun.date || matchingRun.created_at,
                    };
                }
            }
            return w;
        });
        if (hasChanges) {
            const updatedPlan = {
                ...plan,
                workouts: updatedWorkouts,
                updatedAt: new Date().toISOString(),
            };
            this.saveActivePlan(updatedPlan);
            return updatedPlan;
        }
        return plan;
    },
    getCoachMessages() {
        try {
            const data = localStorage.getItem(COACH_MESSAGES_KEY);
            return data ? JSON.parse(data) : [];
        }
        catch (e) {
            console.error('Error loading coach messages from localStorage', e);
            return [];
        }
    },
    saveCoachMessages(messages) {
        try {
            localStorage.setItem(COACH_MESSAGES_KEY, JSON.stringify(messages));
        }
        catch (e) {
            console.error('Error saving coach messages to localStorage', e);
        }
    },
    clearCoachChat() {
        try {
            localStorage.removeItem(COACH_MESSAGES_KEY);
        }
        catch (e) {
            console.error('Error clearing coach chat', e);
        }
    },
};
