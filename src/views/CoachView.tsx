import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Run, UnitSystem } from '../types/run';
import type { PlanWorkout, TrainingPlan, AICoachMessage } from '../types/plan';

import { storageService } from '../services/storage';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { WorkoutCard } from '../components/plan/WorkoutCard';
import { PlanCard } from '../components/plan/PlanCard';
import { QuickPlanModal } from '../components/plan/QuickPlanModal';
import { ManualPlanModal } from '../components/plan/ManualPlanModal';
import { EditWorkoutModal } from '../components/plan/EditWorkoutModal';
import {
  formatDistance,
  formatFullWorkoutDate,
  formatWeekRange,
  getDateForDayOfWeek,
  formatLocalDateKey,
  parseDateSafe,
} from '../utils/formatters';

import {
  Sparkles,
  Calendar,
  Send,
  CheckCircle2,
  Footprints,
  Target,
  MessageSquare,
  Sliders,
  Trash2,
  Plus,
  X,
  Copy,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Pencil,
  FileText,
} from 'lucide-react';





import { clsx } from 'clsx';



interface CoachViewProps {
  runs: Run[];
  unitSystem: UnitSystem;
  onNavigateAddRun: () => void;
  onSelectRun?: (runId: string) => void;
  customApiKey?: string;
}

type CoachSubTab = 'schedule' | 'chat';

const DEFAULT_WELCOME_MESSAGE: AICoachMessage = {
  id: 'msg_welcome',
  role: 'assistant',
  content: `Hey! What running goal or schedule are you thinking about right now?\n\nTell me the days you like to get out there (like Tue, Thu, Sat), what pace or target you have in mind, or how your recent runs have been feeling. We can talk through what works best for you!`,
  timestamp: new Date().toISOString(),
};

const renderFormattedMessage = (content: string, isUser: boolean, isTyping?: boolean) => {
  // Strip any raw json_plan code blocks so user never sees messy curly braces
  const cleanContent = content
    .replace(/```(?:json_plan|json)?\s*\{[\s\S]*?\}\s*```?/g, '')
    .replace(/```json_plan[\s\S]*?(?:```|$)/g, '')
    .trim();

  if (!cleanContent && isTyping) {
    return (
      <div className="flex items-center space-x-1 py-0.5">
        <span className="inline-block w-2 h-4 bg-[#FF5500] rounded-xs animate-pulse" />
      </div>
    );
  }

  const lines = cleanContent.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        const isLastLine = idx === lines.length - 1;
        const trimmed = line.trim();
        if (!trimmed) {
          return (
            <div key={idx} className="h-1 flex items-center">
              {isLastLine && isTyping && (
                <span className="inline-block w-2 h-4 bg-[#FF5500] rounded-xs animate-pulse" />
              )}
            </div>
          );
        }

        const renderInline = (text: string) => {
          const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
          return (
            <>
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                  const inner = part.slice(2, -2);
                  return (
                    <strong
                      key={pIdx}
                      className={clsx('font-bold', isUser ? 'text-white' : 'text-white')}
                    >
                      {inner}
                    </strong>
                  );
                }
                if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                  const inner = part.slice(1, -1);
                  return (
                    <em key={pIdx} className="italic text-neutral-200">
                      {inner}
                    </em>
                  );
                }
                return part;
              })}
              {isLastLine && isTyping && (
                <span className="inline-block w-2 h-4 bg-[#FF5500] ml-1 rounded-xs animate-pulse align-middle" />
              )}
            </>
          );
        };

        // Heading support (### Heading)
        if (trimmed.startsWith('### ')) {
          const headingText = trimmed.replace(/^###\s+/, '');
          return (
            <h4 key={idx} className="text-xs font-black text-white pt-1 tracking-tight">
              {renderInline(headingText)}
            </h4>
          );
        }

        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          const headingText = trimmed.replace(/^#+\s+/, '');
          return (
            <h3 key={idx} className="text-sm font-black text-white pt-1.5 tracking-tight">
              {renderInline(headingText)}
            </h3>
          );
        }

        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          const bulletText = trimmed.replace(/^[-•*]\s+/, '');
          return (
            <div key={idx} className="flex items-start space-x-2 pl-1">
              <span className={clsx('text-xs mt-0.5', isUser ? 'text-white/80' : 'text-[#FF5500]')}>•</span>
              <span className="flex-1 text-neutral-200">{renderInline(bulletText)}</span>
            </div>
          );
        }

        // Numbered list (e.g. 1. 2.)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start space-x-2 pl-1">
              <span className={clsx('text-[11px] font-bold mt-0.5 w-4 shrink-0', isUser ? 'text-white/80' : 'text-[#FF5500]')}>
                {numMatch[1]}.
              </span>
              <span className="flex-1 text-neutral-200">{renderInline(numMatch[2])}</span>
            </div>
          );
        }

        return <p key={idx} className="text-neutral-200">{renderInline(line)}</p>;
      })}
    </div>
  );
};


export type CoachModelKey = 'nvidia' | 'dots' | 'gemini';

export interface CoachModelOption {
  id: CoachModelKey;
  iconSrc: string;
  name: string;
  desc: string;
}

export const COACH_MODELS: CoachModelOption[] = [
  {
    id: 'nvidia',
    iconSrc: '/models/nvidia.png',
    name: 'NVIDIA Nemotron',
    desc: 'Default · Free & Reasoning',
  },
  {
    id: 'dots',
    iconSrc: '/models/dots.png',
    name: 'Dots 3 Note',
    desc: 'Free · Ringkas & Cepat',
  },
  {
    id: 'gemini',
    iconSrc: '/models/gemini.png',
    name: 'Gemini 2.5 Flash',
    desc: 'Google · Ultra Responsif',
  },
];



export const CoachView: React.FC<CoachViewProps> = ({
  runs,
  unitSystem,
  onNavigateAddRun,
  onSelectRun,
  customApiKey,
}) => {

  const [activeTab, setActiveTab] = useState<CoachSubTab>(() => {
    try {
      const saved = localStorage.getItem('runno_coach_subtab') as CoachSubTab;
      return saved === 'chat' || saved === 'schedule' ? saved : 'schedule';
    } catch (_) {
      return 'schedule';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('runno_coach_subtab', activeTab);
    } catch (_) {}
  }, [activeTab]);

  const [selectedModelId, setSelectedModelId] = useState<CoachModelKey>(() => {
    try {
      const saved = localStorage.getItem('runno_coach_model') as CoachModelKey;
      if (saved === 'nvidia' || saved === 'dots' || saved === 'gemini') {
        return saved;
      }
    } catch (_) {}
    return 'nvidia'; // Default to NVIDIA
  });
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);


  const activeModelOption = useMemo(() => {
    return COACH_MODELS.find((m) => m.id === selectedModelId) || COACH_MODELS[0];
  }, [selectedModelId]);

  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(storageService.getActivePlan());
  const [messages, setMessages] = useState<AICoachMessage[]>(() => {
    const saved = storageService.getCoachMessages();
    if (saved.length === 0) return [DEFAULT_WELCOME_MESSAGE];
    // Replace old robotic greeting if present in local storage
    if (saved[0]?.id === 'msg_welcome' && (saved[0].content.includes('Coach Runno') || saved[0].content.includes('personal AI'))) {
      const updated = [...saved];
      updated[0] = DEFAULT_WELCOME_MESSAGE;
      storageService.saveCoachMessages(updated);
      return updated;
    }
    return saved;
  });
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDebugInfo, setSelectedDebugInfo] = useState<any>(null);
  const [copiedTrace, setCopiedTrace] = useState<boolean>(false);

  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState<boolean>(false);
  const [isManualPlanModalOpen, setIsManualPlanModalOpen] = useState<boolean>(false);
  const [editingWorkout, setEditingWorkout] = useState<PlanWorkout | null>(null);
  const [appliedPlanToast, setAppliedPlanToast] = useState<string | null>(null);

  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [editedNoteText, setEditedNoteText] = useState<string>('');

  const handleStartEditNote = () => {
    setEditedNoteText(activePlan?.aiAdvice || '');
    setIsEditingNote(true);
  };

  const handleSaveNote = () => {
    if (!activePlan) return;
    const updatedPlan: TrainingPlan = {
      ...activePlan,
      aiAdvice: editedNoteText.trim(),
      updatedAt: new Date().toISOString(),
    };
    storageService.saveActivePlan(updatedPlan);
    setActivePlan(updatedPlan);
    setIsEditingNote(false);
  };



  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const typingIntervalRef = useRef<any>(null);

  // Clean up typing animation on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Stream assistant reply one word at a time
  const streamTextWordByWord = (
    msgId: string,
    fullText: string,
    suggestedPlan: TrainingPlan | null,
    debugInfo?: any
  ) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    setTypingMessageId(msgId);

    // Split preserving whitespaces/words
    const tokens = fullText.match(/\S+|\s+/g) || [fullText];
    let currentIndex = 0;
    let accumulated = '';

    typingIntervalRef.current = setInterval(() => {
      if (currentIndex >= tokens.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setTypingMessageId(null);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, content: fullText, suggestedPlan, debugInfo } : m
          )
        );
        return;
      }

      accumulated += tokens[currentIndex];
      currentIndex++;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, content: accumulated, suggestedPlan, debugInfo } : m
        )
      );
    }, 18);

  };

  // Sync plan from server and match completion with run log on mount and runs update
  useEffect(() => {
    storageService.syncActivePlanWithServer().then((synced) => {
      if (synced) {
        const syncedWithRuns = storageService.syncPlanWithRuns(runs);
        setActivePlan(syncedWithRuns || synced);
      } else if (activePlan) {
        const syncedWithRuns = storageService.syncPlanWithRuns(runs);
        if (syncedWithRuns) setActivePlan(syncedWithRuns);
      }
    });
  }, [runs]);

  // Sync coach messages from server on mount
  useEffect(() => {
    storageService.syncCoachMessagesWithServer().then((syncedMsgs) => {
      if (syncedMsgs && syncedMsgs.length > 0) {
        setMessages(syncedMsgs);
      }
    });
  }, []);




  // Save messages on update (only when not actively typing partial words)
  useEffect(() => {
    if (!typingMessageId) {
      storageService.saveCoachMessages(messages);
    }
  }, [messages, typingMessageId]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab, typingMessageId]);


  // Today's day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const currentDayOfWeek = new Date().getDay();

  const totalPlanWeeks = Math.max(activePlan?.totalWeeks || 4, 4);

  // Dynamic current week based on startDate (e.g. today compared to Monday of startDate)
  const currentPlanWeek = useMemo(() => {
    if (activePlan?.startDate) {
      const start = parseDateSafe(activePlan.startDate);
      const startMonday = getDateForDayOfWeek(1, start);
      const today = new Date();
      const todayMonday = getDateForDayOfWeek(1, today);
      const diffDays = Math.round((todayMonday.getTime() - startMonday.getTime()) / (24 * 3600 * 1000));
      const diffWeeks = Math.floor(diffDays / 7);
      return Math.max(1, Math.min(totalPlanWeeks, 1 + diffWeeks));
    }
    return activePlan?.currentWeek || 1;
  }, [activePlan?.startDate, activePlan?.currentWeek, totalPlanWeeks]);

  const [viewedWeek, setViewedWeek] = useState<number>(() => currentPlanWeek);

  // Sync viewedWeek whenever activePlan is loaded or updated
  useEffect(() => {
    if (activePlan) {
      setViewedWeek(currentPlanWeek);
    }
  }, [activePlan?.id, activePlan?.startDate, currentPlanWeek]);

  const isViewingCurrentWeek = viewedWeek === currentPlanWeek;
  const isViewingNextWeek = viewedWeek === currentPlanWeek + 1;

  // Selected week base date (calculated based on Monday of plan.startDate + (viewedWeek - 1) * 7 days)
  const selectedWeekBaseDate = useMemo(() => {
    if (activePlan?.startDate) {
      const start = parseDateSafe(activePlan.startDate);
      const startMonday = getDateForDayOfWeek(1, start);
      const targetMonday = new Date(startMonday.getFullYear(), startMonday.getMonth(), startMonday.getDate());
      targetMonday.setDate(targetMonday.getDate() + (viewedWeek - 1) * 7);
      return targetMonday;
    }
    const d = new Date();
    d.setDate(d.getDate() + (viewedWeek - currentPlanWeek) * 7);
    return d;
  }, [activePlan?.startDate, viewedWeek, currentPlanWeek]);

  // Helper to compute accurate workout completion for any target calendar date
  // Prevents past runs from falsely showing as completed on future/next week schedules
  const getWorkoutForDate = (w: PlanWorkout, targetDate: Date, isViewingThisWeek: boolean): PlanWorkout => {
    const targetIso = formatLocalDateKey(targetDate);
    const todayIso = formatLocalDateKey(new Date());
    const isFutureDate = targetIso > todayIso;

    // Find if there is an actual run logged on this specific calendar date
    const matchingRun = runs.find((r) => {
      if (!r.date) return false;
      return formatLocalDateKey(r.date) === targetIso;
    });

    if (matchingRun) {
      return {
        ...w,
        date: targetIso,
        completed: true,
        completedRunId: matchingRun.id,
      };
    }

    if (isFutureDate) {
      // Future dates cannot be completed yet
      return {
        ...w,
        date: targetIso,
        completed: false,
        completedRunId: null,
      };
    }

    if (isViewingThisWeek) {
      return {
        ...w,
        date: targetIso,
        completed: Boolean(w.completed),
        completedRunId: w.completedRunId || null,
      };
    }

    return {
      ...w,
      date: targetIso,
      completed: false,
      completedRunId: null,
    };
  };

  // Tomorrow's Date & Workout calculation (e.g. for Sunday looking at Monday tomorrow)
  const tomorrowDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  const tomorrowDayOfWeek = tomorrowDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const tomorrowWorkout = useMemo(() => {
    if (!activePlan) return null;
    return activePlan.workouts.find((w) => w.dayOfWeek === tomorrowDayOfWeek) || null;
  }, [activePlan, tomorrowDayOfWeek]);

  // If today is Sunday (day 0), tomorrow (Monday) begins next week
  const isSunday = currentDayOfWeek === 0;

  // Helper to fetch workouts for a specific week (preserves distinct per-week workouts)
  const getViewedWeekWorkouts = (weekNum: number): PlanWorkout[] => {
    if (!activePlan) return [];
    if (activePlan.weeklySchedules && activePlan.weeklySchedules[weekNum]) {
      return activePlan.weeklySchedules[weekNum];
    }
    return activePlan.workouts;
  };

  const currentViewedWorkouts = useMemo(() => {
    return getViewedWeekWorkouts(viewedWeek);
  }, [activePlan, viewedWeek]);

  // Find today's workout in the active plan (from current week's schedule)
  const todayWorkout = useMemo(() => {
    if (!activePlan) return null;
    const currentWeekWorkouts = getViewedWeekWorkouts(currentPlanWeek);
    return currentWeekWorkouts.find((w) => w.dayOfWeek === currentDayOfWeek) || null;
  }, [activePlan, currentPlanWeek, currentDayOfWeek]);

  // Weekly progress calculation
  const weeklyProgress = useMemo(() => {
    if (!activePlan) return { completedKm: 0, targetKm: 0, percent: 0, completedCount: 0, totalWorkouts: 0 };
    const weekWorkouts = getViewedWeekWorkouts(viewedWeek);
    const runningWorkouts = weekWorkouts.filter((w) => w.type !== 'rest' && w.distanceKm > 0);
    const targetKm = runningWorkouts.reduce((acc, w) => acc + (Number(w.distanceKm) || 0), 0) || activePlan.weeklyTargetKm;

    if (isViewingCurrentWeek) {
      const evaluatedWorkouts = runningWorkouts.map((w) => {
        const targetDate = getDateForDayOfWeek(w.dayOfWeek, new Date());
        return getWorkoutForDate(w, targetDate, true);
      });
      const completedWorkouts = evaluatedWorkouts.filter((w) => w.completed);
      const completedKm = completedWorkouts.reduce((acc, w) => acc + (Number(w.distanceKm) || 0), 0);
      const percent = targetKm > 0 ? Math.min(100, Math.round((completedKm / targetKm) * 100)) : 0;
      return {
        completedKm,
        targetKm,
        percent,
        completedCount: completedWorkouts.length,
        totalWorkouts: runningWorkouts.length,
      };
    } else {
      const weekDates = weekWorkouts.map((w) =>
        formatLocalDateKey(getDateForDayOfWeek(w.dayOfWeek, selectedWeekBaseDate))
      );
      const completedRunsThisWeek = runs.filter((r) => r.date && weekDates.includes(formatLocalDateKey(r.date)));
      const completedKm = completedRunsThisWeek.reduce((acc, r) => acc + (r.distance_km || 0), 0);
      const percent = targetKm > 0 ? Math.min(100, Math.round((completedKm / targetKm) * 100)) : 0;

      return {
        completedKm,
        targetKm,
        percent,
        completedCount: completedRunsThisWeek.length,
        totalWorkouts: runningWorkouts.length,
      };
    }
  }, [activePlan, isViewingCurrentWeek, viewedWeek, selectedWeekBaseDate, runs]);

  const handleToggleWorkout = (workoutId: string) => {
    if (!activePlan) return;
    const existingWeeklySchedules: Record<number, PlanWorkout[]> = {
      ...(activePlan.weeklySchedules || {}),
    };

    const baseWeekWorkouts = existingWeeklySchedules[viewedWeek]
      ? [...existingWeeklySchedules[viewedWeek]]
      : [...activePlan.workouts];

    const updatedWeekWorkouts = baseWeekWorkouts.map((w) =>
      w.id === workoutId
        ? { ...w, completed: !w.completed, completedAt: !w.completed ? new Date().toISOString() : null }
        : w
    );

    existingWeeklySchedules[viewedWeek] = updatedWeekWorkouts;

    const isCurrentWeek = viewedWeek === currentPlanWeek;
    const updatedDefaultWorkouts = isCurrentWeek
      ? updatedWeekWorkouts
      : activePlan.workouts.map((w) =>
          w.id === workoutId
            ? { ...w, completed: !w.completed, completedAt: !w.completed ? new Date().toISOString() : null }
            : w
        );

    const updatedPlan: TrainingPlan = {
      ...activePlan,
      workouts: updatedDefaultWorkouts,
      weeklySchedules: existingWeeklySchedules,
      updatedAt: new Date().toISOString(),
    };

    storageService.saveActivePlan(updatedPlan);
    setActivePlan(updatedPlan);
  };



  const handleApplyPlan = (planToApply: TrainingPlan) => {
    const newActivePlan: TrainingPlan = {
      ...planToApply,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
    storageService.saveActivePlan(newActivePlan);
    setActivePlan(newActivePlan);
    setAppliedPlanToast(`Applied "${newActivePlan.title}" to your schedule!`);
    setTimeout(() => {
      setAppliedPlanToast(null);
      setActiveTab('schedule');
    }, 1500);
  };

  const handleSendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: AICoachMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Strip heavy raw json_plan block from previous messages to cut ~70% input tokens while preserving conversation context
      const cleanHistory = messages
        .filter((m) => !m.content.includes('Sorry, I encountered an issue') && !m.content.includes('API error'))
        .slice(-20)
        .map((m) => ({
          role: m.role,
          content: m.content.replace(/```json_plan\s*[\s\S]*?\s*```/g, '').trim(),
        }))
        .filter((m) => m.content.length > 0);


      // Sanitize all runs so AI has complete visibility into 100% of uploaded runs without heavy image payloads
      const sanitizedRuns = runs.map((r) => ({
        id: r.id,
        date: r.date,
        distance_km: r.distance_km,
        duration_seconds: r.duration_seconds,
        pace_seconds_per_km: r.pace_seconds_per_km,
        avg_heart_rate: r.avg_heart_rate,
        max_heart_rate: r.max_heart_rate,
        cadence: r.cadence,
        elevation_gain_m: r.elevation_gain_m,
        source: r.source,
        splits: r.splits?.map((s) => ({
          km: s.km,
          type: s.type,
          distance_km: s.distance_km,
          duration_seconds: s.duration_seconds,
          pace_seconds: s.pace_seconds,
          avg_heart_rate: s.avg_heart_rate,
        })),
      }));

      const payload = {
        message: trimmed,
        history: cleanHistory,
        currentPlan: activePlan,
        coachModel: selectedModelId,
        runnerContext: {
          recentRuns: sanitizedRuns,
          unitSystem,
        },
        customApiKey,
      };





      let data: any = null;
      let errorDebug: any = null;

      try {
        const res = await fetch('/api/ai-coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await res.json();
          if (data.debugInfo) {
            errorDebug = data.debugInfo;
          }
        } else {
          const rawText = await res.text();
          errorDebug = {
            endpoint: '/api/ai-coach',
            status: res.status,
            environment: 'vercel_serverless',
            rawError: rawText.substring(0, 500),
            clientTimestamp: new Date().toISOString(),
          };
          throw new Error(`Server returned non-JSON (${res.status}): ${rawText.substring(0, 100)}`);
        }

        if (!res.ok && !data?.reply) {
          throw new Error(data?.error || `HTTP ${res.status}`);
        }
      } catch (networkOrServerErr: any) {
        console.error('[Runno Coach] Request failed:', networkOrServerErr);
        if (!data) {
          let healthData: any = {};
          try {
            const healthRes = await fetch('/api/health');
            if (healthRes.ok) healthData = await healthRes.json();
          } catch (_) {}

          errorDebug = {
            endpoint: '/api/ai-coach',
            status: networkOrServerErr.message || 500,
            environment: healthData.environment || 'vercel_serverless',
            hasServerEnvKey: Boolean(healthData.hasOpenRouterKey),
            hasCustomClientKey: Boolean(customApiKey && customApiKey.length > 0),
            rawError: networkOrServerErr.stack || networkOrServerErr.message,
            clientTimestamp: new Date().toISOString(),
          };

          data = {
            reply: `⚠️ **Gagal Terhubung ke Coaching Engine**\n\n${networkOrServerErr.message || 'Error koneksi'}\n\nSilakan cek panel debug di bawah untuk melihat penyebab detailnya.`,
            suggestedPlan: null,
            debugInfo: errorDebug,
          };
        }
      }

      const fullReply = data?.reply || "Here is what I've prepared for you:";

      const plan = data?.suggestedPlan || null;
      const debugInfo = data?.debugInfo || errorDebug || null;
      const assistantMsgId = `msg_asst_${Date.now()}`;

      // Insert assistant message placeholder with plan attached
      const initialAssistantMsg: AICoachMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        suggestedPlan: plan,
        debugInfo,
      };

      setMessages((prev) => [...prev, initialAssistantMsg]);
      setIsLoading(false);

      // Stream text word-by-word in real time
      streamTextWordByWord(assistantMsgId, fullReply, plan, debugInfo);

    } catch (err: any) {
      console.error('[Runno Coach] Error sending message:', err);
      const errorMsg: AICoachMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an issue connecting to the coaching engine: ${err.message}.`,
        timestamp: new Date().toISOString(),
        debugInfo: {
          endpoint: '/api/ai-coach',
          status: err.message,
          rawError: err.stack || err.message,
          clientTimestamp: new Date().toISOString(),
        },
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };



  const handleQuickModalGenerate = (params: {
    selectedDays: string[];
    goal: string;
    level: string;
    customNotes?: string;
  }) => {
    setIsQuickModalOpen(false);
    setActiveTab('chat');
    const prompt = `Create a running plan for ${params.selectedDays.join(', ')} targeting ${params.goal} (${params.level} level).`;
    handleSendMessage(prompt);
  };

  const handleClearChat = () => {
    if (confirm('Clear coach conversation history?')) {
      storageService.clearCoachChat();
      setMessages([DEFAULT_WELCOME_MESSAGE]);
    }
  };

  const handleClearPlan = () => {
    if (confirm('Are you sure you want to remove the current active training plan?')) {
      storageService.saveActivePlan(null);
      setActivePlan(null);
    }
  };

  const handleSaveManualPlan = (savedPlan: TrainingPlan) => {
    storageService.saveActivePlan(savedPlan);
    setActivePlan(savedPlan);
    setIsManualPlanModalOpen(false);
    setAppliedPlanToast('Program latihan berhasil disimpan!');
    setTimeout(() => setAppliedPlanToast(null), 3000);
  };

  const handleSaveSingleWorkout = (updatedWorkout: PlanWorkout) => {
    if (!activePlan) return;

    const existingWeeklySchedules: Record<number, PlanWorkout[]> = {
      ...(activePlan.weeklySchedules || {}),
    };

    // Base workouts for this specific viewed week
    const baseWeekWorkouts = existingWeeklySchedules[viewedWeek]
      ? [...existingWeeklySchedules[viewedWeek]]
      : [...activePlan.workouts];

    const updatedWeekWorkouts = baseWeekWorkouts.map((w) =>
      w.id === updatedWorkout.id || w.dayOfWeek === updatedWorkout.dayOfWeek
        ? updatedWorkout
        : w
    );

    existingWeeklySchedules[viewedWeek] = updatedWeekWorkouts;

    const isCurrentWeek = viewedWeek === currentPlanWeek;
    const updatedDefaultWorkouts = isCurrentWeek ? updatedWeekWorkouts : activePlan.workouts;

    const activeDays = updatedWeekWorkouts.filter((w) => w.type !== 'rest' && w.distanceKm > 0);
    const totalKm = updatedWeekWorkouts.reduce(
      (sum, w) => sum + (w.type !== 'rest' ? (Number(w.distanceKm) || 0) : 0),
      0
    );
    const summary = activeDays.map((w) => w.dayName).join(', ');

    const updatedPlan: TrainingPlan = {
      ...activePlan,
      workouts: updatedDefaultWorkouts,
      weeklySchedules: existingWeeklySchedules,
      selectedDays: isCurrentWeek ? activeDays.map((w) => w.dayName) : activePlan.selectedDays,
      scheduleSummary: isCurrentWeek ? (summary || 'Flexible Schedule') : activePlan.scheduleSummary,
      weeklyTargetKm: isCurrentWeek ? Number(totalKm.toFixed(1)) : activePlan.weeklyTargetKm,
      updatedAt: new Date().toISOString(),
    };

    storageService.saveActivePlan(updatedPlan);
    setActivePlan(updatedPlan);
    setAppliedPlanToast(`Sesi ${updatedWorkout.dayName} (Week ${viewedWeek}) berhasil diperbarui!`);
    setTimeout(() => setAppliedPlanToast(null), 3000);
  };


  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-4">
      {/* Toast Notification */}
      {appliedPlanToast && (
        <div className="fixed top-5 left-4 right-4 max-w-md mx-auto z-50 p-3.5 rounded-2xl bg-neutral-900 text-white flex items-center space-x-2.5 shadow-2xl animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{appliedPlanToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#FF5500]/15 text-[#FF5500] flex items-center justify-center shadow-soft-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">AI Coach</h1>
            <p className="text-xs text-neutral-400 font-medium">
              Smart training plans & schedule assistant
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsManualPlanModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-[#1E1E1E] hover:bg-[#252525] text-white text-xs font-bold transition-all active:scale-95 border border-white/5 shadow-soft-sm"
            title={activePlan ? "Edit training plan" : "Create training plan"}
          >
            {activePlan ? <Pencil className="w-3.5 h-3.5 text-neutral-300" /> : <Plus className="w-3.5 h-3.5 text-[#FF5500]" />}
            <span>{activePlan ? 'Edit Plan' : 'New Plan'}</span>
          </button>
        </div>
      </div>


      {/* Sticky Top Segmented Sub-Tab Switcher */}
      <div className="sticky top-0 z-30 pt-1 pb-1.5 -mx-4 px-4 bg-[#111111]/90 backdrop-blur-md">
        <div className="grid grid-cols-2 p-1 bg-[#1E1E1E] rounded-2xl border border-white/5 shadow-soft-xs">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={clsx(
              'py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-2',
              activeTab === 'schedule'
                ? 'bg-[#2A2A2A] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Active Plan</span>
            {activePlan && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={clsx(
              'py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-2',
              activeTab === 'chat'
                ? 'bg-[#2A2A2A] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Coach Chat</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#FF5500]/15 text-[#FF5500] text-[10px] font-black border border-[#FF5500]/30">
              AI
            </span>
          </button>
        </div>
      </div>


      {/* =================================================================== */}
      {/* SUB-VIEW 1: ACTIVE SCHEDULE & WORKOUT CALENDAR */}
      {/* =================================================================== */}
      {activeTab === 'schedule' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {activePlan ? (
            <>
              {/* Clean Interactive Week Switcher Bar */}
              <div className="flex items-center justify-between bg-[#1E1E1E] p-2.5 rounded-2xl border border-white/5 shadow-soft-xs">
                <button
                  type="button"
                  onClick={() => setViewedWeek((prev) => Math.max(1, prev - 1))}
                  disabled={viewedWeek <= 1}
                  className="py-1.5 px-2.5 rounded-xl text-neutral-300 hover:bg-[#252525] disabled:opacity-30 disabled:hover:bg-transparent text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-xs">Prev</span>
                </button>

                <div className="text-center">
                  <span className="text-sm font-black text-white tracking-tight">
                    Week {viewedWeek} of {totalPlanWeeks}
                  </span>
                  <span className="text-[11px] font-semibold text-neutral-400 block">
                    {formatWeekRange(selectedWeekBaseDate)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setViewedWeek((prev) => Math.min(totalPlanWeeks, prev + 1))}
                  disabled={viewedWeek >= totalPlanWeeks}
                  className="py-1.5 px-2.5 rounded-xl text-neutral-300 hover:bg-[#252525] disabled:opacity-30 disabled:hover:bg-transparent text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                  aria-label="Next week"
                >
                  <span className="text-xs">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>


              {/* 7-Day Weekly Schedule */}
              <div className="space-y-2 pt-1">
                {currentViewedWorkouts.map((w) => {
                  const workoutDate = getDateForDayOfWeek(w.dayOfWeek, selectedWeekBaseDate);
                  const isToday = isViewingCurrentWeek && w.dayOfWeek === currentDayOfWeek;
                  const dateBoundWorkout = getWorkoutForDate(w, workoutDate, isViewingCurrentWeek);
                  return (
                    <WorkoutCard
                      key={`${w.id}_w${viewedWeek}`}
                      workout={dateBoundWorkout}
                      unitSystem={unitSystem}
                      isToday={isToday}
                      date={workoutDate}
                      onToggleComplete={handleToggleWorkout}
                      onSelectRun={onSelectRun}
                      onEditWorkout={(wk) => setEditingWorkout(wk)}
                    />
                  );
                })}
              </div>


              {/* Training Note Card */}
              <div className="p-4 rounded-3xl bg-[#1E1E1E] border border-white/5 shadow-soft-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-white font-bold text-xs">
                    <FileText className="w-4 h-4 text-[#FF5500]" />
                    <span>Note Training</span>
                  </div>
                  {!isEditingNote ? (
                    <button
                      onClick={handleStartEditNote}
                      className="text-[11px] font-bold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-xl hover:bg-white/5 active:scale-95"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{activePlan.aiAdvice ? 'Edit' : 'Tulis Note'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setIsEditingNote(false)}
                        className="text-[11px] font-bold text-neutral-400 hover:text-white px-2 py-1 rounded-xl hover:bg-white/5"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSaveNote}
                        className="text-[11px] font-bold text-white bg-[#FF5500] hover:bg-[#E64D00] px-2.5 py-1 rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Simpan</span>
                      </button>
                    </div>
                  )}
                </div>

                {isEditingNote ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      value={editedNoteText}
                      onChange={(e) => setEditedNoteText(e.target.value)}
                      placeholder="Tulis catatan latihan atau target Anda di sini..."
                      rows={3}
                      className="w-full bg-[#151515] border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF5500] transition-colors resize-none leading-relaxed"
                      autoFocus
                    />
                  </div>
                ) : activePlan.aiAdvice ? (
                  <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
                    {activePlan.aiAdvice}
                  </p>
                ) : (
                  <div
                    onClick={handleStartEditNote}
                    className="p-3.5 rounded-2xl bg-black/20 border border-dashed border-white/10 text-center cursor-pointer hover:border-white/20 transition-all group"
                  >
                    <p className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors">
                      + Tambah catatan latihan...
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty State: No Active Plan */
            <Card className="p-7 text-center space-y-4 bg-[#1E1E1E] border border-white/5 shadow-soft-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#FF5500]/15 text-[#FF5500] flex items-center justify-center mx-auto shadow-soft-xs">
                <Calendar className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">
                  No Active Training Plan
                </h3>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                  Ready to get into a steady rhythm? Setup your weekly training manually or let the AI Coach design one for you.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsManualPlanModalOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="font-bold text-xs shadow-glow-orange rounded-2xl py-3"
                >
                  Create Plan Manually (Custom Days & Pace)
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setIsQuickModalOpen(true)}
                  leftIcon={<Sliders className="w-4 h-4 text-[#FF5500]" />}
                  className="font-bold text-xs rounded-2xl py-3"
                >
                  Quick Setup Assistant (AI)
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setActiveTab('chat');
                    setTimeout(() => chatInputRef.current?.focus(), 150);
                  }}
                  leftIcon={<Sparkles className="w-4 h-4 text-[#FF5500]" />}
                  className="font-bold text-xs rounded-2xl py-3"
                >
                  Chat with Coach
                </Button>
              </div>
            </Card>
          )}
        </div>


      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 2: AI COACH CONVERSATIONAL CHAT */}
      {/* =================================================================== */}
      {activeTab === 'chat' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Runner Context Chip */}
          <div className="p-2.5 rounded-2xl bg-[#1E1E1E] border border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-neutral-300 font-medium">
              <Footprints className="w-4 h-4 text-[#FF5500] shrink-0" />
              <span className="text-[11px] truncate">
                {runs.length > 0
                  ? `Aware of ${runs.length} logged runs in your history`
                  : 'Ready to build your first routine'}
              </span>
            </div>

            <button
              onClick={handleClearChat}
              className="text-[11px] font-bold text-neutral-500 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { label: '💬 Discuss Tue/Thu/Sat Routine', prompt: 'I want to discuss running on Tuesday, Thursday, and Saturday. How should I balance easy vs quality sessions?' },
              { label: '🎯 Discuss 5K / 10K Target', prompt: 'I want to discuss my goals for a 5K or 10K target. What do you recommend based on my recent runs?' },
              { label: '⚡ Make this as Active Plan', prompt: 'Make this as plan for Tuesday, Thursday, and Saturday.' },
              { label: '🔋 Zone 2 & Recovery Tips', prompt: 'How should I pace my easy recovery runs to build an aerobic base?' },
            ].map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => {
                  setInputPrompt(pill.prompt);
                  chatInputRef.current?.focus();
                }}
                className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full bg-[#1E1E1E] border border-white/5 text-neutral-300 hover:border-[#FF5500] hover:text-[#FF5500] active:scale-95 transition-all shadow-xs"
              >
                {pill.label}
              </button>
            ))}
          </div>


          {/* Chat Messages Feed */}
          <div className="space-y-3.5 min-h-[300px]">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={clsx(
                    'flex flex-col',
                    isUser ? 'items-end' : 'items-start'
                  )}
                >
                  <div className="flex items-center space-x-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      {isUser ? 'You' : 'Coach'}
                    </span>
                  </div>

                  <div
                    className={clsx(
                      'p-3.5 rounded-2xl text-xs max-w-[90%] sm:max-w-[85%] leading-relaxed shadow-soft-xs',
                      isUser
                        ? 'bg-[#FF5500] text-white rounded-tr-none font-medium'
                        : 'bg-[#1E1E1E] text-neutral-100 border border-white/5 rounded-tl-none space-y-2'
                    )}
                  >
                    {renderFormattedMessage(msg.content, isUser, msg.id === typingMessageId)}

                    {/* Inline Suggested Plan Card (shown once typing is complete) */}
                    {(() => {
                      const planToRender = msg.suggestedPlan || (msg.role === 'assistant' ? (() => {
                        const match = msg.content.match(/(\{[\s\r\n]*"title"[\s\S]*?"workouts"[\s\S]*?\})/);
                        if (match && match[1]) {
                          try {
                            const cleaned = match[1].replace(/,\s*([}\]])/g, '$1');
                            const parsed = JSON.parse(cleaned);
                            if (parsed.workouts) {
                              return {
                                ...parsed,
                                id: parsed.id || `plan_fallback_${msg.id}`,
                                status: parsed.status || 'draft',
                              };
                            }
                          } catch (_) {}
                        }
                        return null;
                      })() : null);

                      if (!planToRender) return null;

                      return (
                        <div className="pt-2 animate-in fade-in duration-300">

                          <PlanCard
                            plan={planToRender}
                            unitSystem={unitSystem}
                            isActive={activePlan?.id === planToRender.id}
                            onApplyPlan={handleApplyPlan}
                          />
                        </div>
                      );
                    })()}


                    {/* Minimized Search Icon + Status Pill */}
                    {!isUser && msg.debugInfo && (
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDebugInfo(msg.debugInfo)}
                          className="text-[10px] font-mono text-neutral-400 hover:text-white bg-[#252525] hover:bg-[#2F2F2F] px-2 py-0.5 rounded-full border border-white/5 flex items-center gap-1 transition-all active:scale-95 cursor-pointer select-none"
                          title="View Diagnostics"
                        >
                          <Search className="w-3 h-3 text-neutral-400" />
                          <span className={clsx(
                            "text-[9.5px] font-bold font-mono",
                            msg.debugInfo.status === 200 || msg.debugInfo.status === '200' || msg.debugInfo.status === 'OK'
                              ? "text-emerald-400"
                              : "text-rose-400"
                          )}>
                            {String(msg.debugInfo.status || '200')}
                          </span>
                        </button>
                      </div>
                    )}


                  </div>
                </div>
              );
            })}


            {isLoading && (
              <div className="flex items-center space-x-2 text-xs text-neutral-400 p-3 bg-[#1E1E1E] border border-white/5 rounded-2xl rounded-tl-none w-fit animate-pulse">
                <Sparkles className="w-4 h-4 text-[#FF5500] animate-spin" />
                <span>Coach is thinking...</span>
              </div>
            )}


            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="sticky bottom-20 pt-2 bg-gradient-to-t from-[#111111] via-[#111111] to-transparent">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputPrompt);
              }}
              className="relative flex items-center space-x-1.5 bg-[#1E1E1E] p-1.5 rounded-2xl border border-white/10 shadow-lg focus-within:ring-2 focus-within:ring-[#FF5500]/30 focus-within:border-[#FF5500]"
            >
              {/* Compact Model Selector Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center space-x-1 p-1.5 rounded-xl border border-white/10 bg-[#252525] hover:bg-[#2F2F2F] transition-all active:scale-95 shadow-2xs"
                  aria-label="Select AI Model"
                  title={`Active Model: ${activeModelOption.name}`}
                >
                  <img
                    src={activeModelOption.iconSrc}
                    alt={activeModelOption.name}
                    className="w-4 h-4 rounded-md object-contain shrink-0"
                  />
                  <ChevronDown className="w-3 h-3 text-neutral-400 opacity-80" />
                </button>

                {isModelDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsModelDropdownOpen(false)}
                    />
                    <div className="absolute bottom-full mb-2 left-0 z-50 w-64 bg-[#1E1E1E] rounded-2xl border border-white/10 shadow-xl p-1.5 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Select Coach AI Model
                      </div>
                      {COACH_MODELS.map((m) => {
                        const isSelected = selectedModelId === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setSelectedModelId(m.id);
                              setIsModelDropdownOpen(false);
                              try {
                                localStorage.setItem('runno_coach_model', m.id);
                              } catch (_) {}
                            }}
                            className={clsx(
                              'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-left',
                              isSelected
                                ? 'bg-white text-neutral-900 font-bold'
                                : 'text-neutral-300 hover:bg-[#252525]'
                            )}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className={clsx(
                                "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border p-0.5 bg-white",
                                isSelected ? "border-neutral-700 shadow-xs" : "border-neutral-200/80"
                              )}>
                                <img src={m.iconSrc} alt={m.name} className="w-4.5 h-4.5 object-contain" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold leading-tight truncate">
                                  {m.name}
                                </div>
                                <div
                                  className={clsx(
                                    'text-[10px] leading-tight mt-0.5 truncate',
                                    isSelected ? 'text-neutral-600' : 'text-neutral-400'
                                  )}
                                >
                                  {m.desc}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#FF5500] shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}


              </div>

              <input
                ref={chatInputRef}
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={
                  typingMessageId
                    ? 'Coach is writing...'
                    : 'Ask coach (e.g. Tue, Thu, Sat for 10K)...'
                }
                disabled={isLoading || !!typingMessageId}
                className="flex-1 px-2 py-2 text-xs text-white bg-transparent focus:outline-none placeholder:text-neutral-500 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={!inputPrompt.trim() || isLoading || !!typingMessageId}
                className="w-9 h-9 rounded-xl bg-[#FF5500] hover:bg-[#E64D00] disabled:bg-[#252525] disabled:text-neutral-600 text-white flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:active:scale-100 shadow-xs"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>


        </div>
      )}

      {/* Quick Setup Plan Modal */}
      <QuickPlanModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        onGenerate={handleQuickModalGenerate}
        isLoading={isLoading}
      />

      {/* Diagnostics & Debug Info Popup Modal (Greyed Out Backdrop) */}
      {selectedDebugInfo && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-neutral-900 text-neutral-100 rounded-3xl p-5 max-w-md w-full border border-neutral-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Backend & LLM Diagnostics
                </h3>
              </div>
              <button
                onClick={() => setSelectedDebugInfo(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                aria-label="Close popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of details */}
            <div className="space-y-2 text-xs font-mono overflow-y-auto flex-1 pr-1">
              <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Endpoint:</span>
                  <span className="font-bold text-neutral-200">{selectedDebugInfo.endpoint || '/api/ai-coach'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">HTTP Status:</span>
                  <span className={clsx(
                    "px-2 py-0.5 rounded text-[10px] font-bold",
                    selectedDebugInfo.status === 200 || selectedDebugInfo.status === '200' || selectedDebugInfo.status === 'OK'
                      ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700/50"
                      : "bg-rose-900/60 text-rose-300 border border-rose-700/50"
                  )}>
                    {String(selectedDebugInfo.status || 'OK')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Environment:</span>
                  <span className="text-neutral-300">{selectedDebugInfo.environment || 'vercel_serverless'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Server Env Key:</span>
                  <span className="text-neutral-300">
                    {selectedDebugInfo.hasServerEnvKey || selectedDebugInfo.hasApiKey
                      ? '✅ Configured (Active)'
                      : '❌ Not Set'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Custom Browser Key:</span>
                  <span className="text-neutral-300">
                    {selectedDebugInfo.hasCustomClientKey ? '✅ Configured (Active)' : '❌ Not Set'}
                  </span>
                </div>

                {selectedDebugInfo.modelUsed && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Model:</span>
                    <span className="text-neutral-300">{selectedDebugInfo.modelUsed}</span>
                  </div>
                )}
              </div>

              {/* Raw Error / Trace if present */}
              {selectedDebugInfo.rawError && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-rose-400 font-bold">Raw Trace / Error Output:</span>
                    <button
                      onClick={() => {
                        const textToCopy = typeof selectedDebugInfo.rawError === 'object'
                          ? JSON.stringify(selectedDebugInfo.rawError, null, 2)
                          : String(selectedDebugInfo.rawError);
                        navigator.clipboard.writeText(textToCopy);
                        setCopiedTrace(true);
                        setTimeout(() => setCopiedTrace(false), 2000);
                      }}
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded"
                    >
                      {copiedTrace ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedTrace ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-rose-300 text-[10.5px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
                    {typeof selectedDebugInfo.rawError === 'object'
                      ? JSON.stringify(selectedDebugInfo.rawError, null, 2)
                      : String(selectedDebugInfo.rawError)}
                  </pre>
                </div>
              )}

              <div className="text-[10px] text-neutral-500 pt-1 text-right">
                Timestamp: {selectedDebugInfo.clientTimestamp || new Date().toISOString()}
              </div>
            </div>

            {/* Close button */}
            <div className="pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedDebugInfo(null)}
                className="w-full font-bold text-xs bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700 rounded-2xl py-2.5"
              >
                Close Diagnostics
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Plan Creator & Editor Modal */}
      <ManualPlanModal
        isOpen={isManualPlanModalOpen}
        onClose={() => setIsManualPlanModalOpen(false)}
        onSave={handleSaveManualPlan}
        existingPlan={activePlan}
        unitSystem={unitSystem}
      />

      {/* Single Workout Editor Modal */}
      <EditWorkoutModal
        isOpen={!!editingWorkout}
        workout={editingWorkout}
        onClose={() => setEditingWorkout(null)}
        onSaveWorkout={handleSaveSingleWorkout}
      />
    </div>
  );
};


