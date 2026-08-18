import React, { useState, useEffect, useMemo } from 'react';
import type { TrainingPlan, PlanWorkout, WorkoutType, UnitSystem } from '../../types/run';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  X,
  Plus,
  Minus,
  Calendar,
  Clock,
  Zap,
  Flame,
  Heart,
  Moon,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  formatLocalDateKey,
  formatWeekRange,
  getDateForDayOfWeek,
  parseDateSafe,
} from '../../utils/formatters';

interface ManualPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: TrainingPlan) => void;
  existingPlan?: TrainingPlan | null;
  unitSystem?: UnitSystem;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DAY_LABELS: Record<string, string> = {
  Monday: 'Senin',
  Tuesday: 'Selasa',
  Wednesday: 'Rabu',
  Thursday: 'Kamis',
  Friday: 'Jumat',
  Saturday: 'Sabtu',
  Sunday: 'Minggu',
};

const WORKOUT_TYPES: { type: WorkoutType; label: string; icon: React.ReactNode }[] = [
  { type: 'easy', label: 'Easy Run', icon: <Heart className="w-3.5 h-3.5" /> },
  { type: 'tempo', label: 'Tempo Run', icon: <Zap className="w-3.5 h-3.5" /> },
  { type: 'intervals', label: 'Intervals', icon: <Zap className="w-3.5 h-3.5" /> },
  { type: 'long_run', label: 'Long Run', icon: <Flame className="w-3.5 h-3.5" /> },
  { type: 'recovery', label: 'Recovery', icon: <Heart className="w-3.5 h-3.5" /> },
  { type: 'rest', label: 'Rest Day', icon: <Moon className="w-3.5 h-3.5" /> },
];

const HR_ZONES = [
  'Zone 1 (Warm Up)',
  'Zone 2 (Aerobic Base)',
  'Zone 3 (Tempo / Aerobic)',
  'Zone 4 (Threshold)',
  'Zone 5 (Max Effort)',
];

const QUICK_DISTANCES = [3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 10.0, 12.0, 15.0, 21.1];

const QUICK_PACES = [
  { label: '5:00', sec: 300 },
  { label: '5:30', sec: 330 },
  { label: '6:00', sec: 360 },
  { label: '6:30', sec: 390 },
  { label: '7:00', sec: 420 },
  { label: '7:30', sec: 450 },
  { label: '8:00', sec: 480 },
  { label: '8:30', sec: 510 },
  { label: '9:00', sec: 540 },
  { label: '9:30', sec: 570 },
  { label: '10:00', sec: 600 },
];

export const ManualPlanModal: React.FC<ManualPlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingPlan,
}) => {
  const generateDefault7DayWorkouts = (): PlanWorkout[] => {
    const defaultDayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    return defaultDayOrder.map((dayNum) => {
      const dayName = DAY_NAMES[dayNum];
      const isRunDay = dayNum === 2 || dayNum === 4 || dayNum === 6;
      return {
        id: `workout_custom_${Date.now()}_${dayNum}`,
        dayOfWeek: dayNum,
        dayName,
        title: isRunDay
          ? (dayNum === 6 ? 'Long Run 6K' : (dayNum === 4 ? 'Tempo Pace 4K' : 'Easy Aerobic 4K'))
          : 'Rest & Recovery',
        type: isRunDay ? (dayNum === 6 ? 'long_run' : (dayNum === 4 ? 'tempo' : 'easy')) : 'rest',
        distanceKm: isRunDay ? (dayNum === 6 ? 6.0 : 4.0) : 0,
        targetPaceSecPerKm: isRunDay ? (dayNum === 4 ? 360 : 400) : null,
        targetHrZone: isRunDay ? (dayNum === 4 ? 'Zone 4 (Threshold)' : 'Zone 2 (Aerobic Base)') : null,
        description: isRunDay ? 'Fokus ritme stabil dan nafas teratur.' : 'Istirahat total untuk pemulihan otot.',
        completed: false,
        completedRunId: null,
      };
    });
  };

  const [title, setTitle] = useState<string>('Custom Running Plan');
  const [goal, setGoal] = useState<string>('Build 5K Endurance');
  const [startDate, setStartDate] = useState<string>(() => formatLocalDateKey(new Date()));
  const [totalWeeks, setTotalWeeks] = useState<number>(8);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [workouts, setWorkouts] = useState<PlanWorkout[]>(generateDefault7DayWorkouts());
  const [activeDayTab, setActiveDayTab] = useState<number>(1); // Default to Monday (1)

  // Re-sync all state whenever modal opens or existingPlan changes
  useEffect(() => {
    if (isOpen) {
      setTitle(existingPlan?.title || 'Custom Running Plan');
      setGoal(existingPlan?.goal || 'Build 5K Endurance');
      setStartDate(
        existingPlan?.startDate
          ? formatLocalDateKey(new Date(existingPlan.startDate))
          : formatLocalDateKey(new Date())
      );
      setTotalWeeks(existingPlan?.totalWeeks || 8);
      setCurrentWeek(existingPlan?.currentWeek || 1);
      setFitnessLevel(existingPlan?.fitnessLevel || 'beginner');
      setWorkouts(
        existingPlan?.workouts && existingPlan.workouts.length >= 7
          ? existingPlan.workouts
          : generateDefault7DayWorkouts()
      );
      setActiveDayTab(1);
    }
  }, [isOpen, existingPlan]);

  const week1RangePreview = useMemo(() => {
    try {
      const start = parseDateSafe(startDate);
      const startMonday = getDateForDayOfWeek(1, start);
      return formatWeekRange(startMonday);
    } catch {
      return '';
    }
  }, [startDate]);

  if (!isOpen) return null;

  const currentWorkout = workouts.find((w) => w.dayOfWeek === activeDayTab) || workouts[0];

  const updateWorkout = (dayOfWeek: number, updates: Partial<PlanWorkout>) => {
    setWorkouts((prev) =>
      prev.map((w) => (w.dayOfWeek === dayOfWeek ? { ...w, ...updates } : w))
    );
  };

  const handleIncrementDistance = (dayOfWeek: number) => {
    updateWorkout(dayOfWeek, {
      distanceKm: Number((Math.max(0.5, (currentWorkout.distanceKm || 0) + 0.5)).toFixed(1)),
    });
  };

  const handleDecrementDistance = (dayOfWeek: number) => {
    updateWorkout(dayOfWeek, {
      distanceKm: Number((Math.max(0.5, (currentWorkout.distanceKm || 1.0) - 0.5)).toFixed(1)),
    });
  };

  const activeRunningDays = workouts.filter((w) => w.type !== 'rest' && w.distanceKm > 0);
  const totalWeeklyKm = workouts.reduce((sum, w) => sum + (w.type !== 'rest' ? (Number(w.distanceKm) || 0) : 0), 0);
  const scheduleSummaryText = activeRunningDays.map((w) => DAY_LABELS[w.dayName] || w.dayName).join(', ');

  const handleSave = () => {
    const planId = existingPlan?.id || `plan_manual_${Date.now()}`;
    const planCurrentWeek = Number(currentWeek) || existingPlan?.currentWeek || 1;
    const existingWeekly = existingPlan?.weeklySchedules ? { ...existingPlan.weeklySchedules } : {};
    existingWeekly[planCurrentWeek] = workouts;

    const newPlan: TrainingPlan = {
      id: planId,
      title: title.trim() || 'Custom Training Plan',
      goal: goal.trim() || 'Building Running Endurance',
      scheduleSummary: scheduleSummaryText || 'Flexible Schedule',
      selectedDays: activeRunningDays.map((w) => w.dayName),
      startDate: formatLocalDateKey(startDate || existingPlan?.startDate || new Date()),
      weeklyTargetKm: Number(totalWeeklyKm.toFixed(1)),
      totalWeeks: Number(totalWeeks) || 8,
      currentWeek: planCurrentWeek,
      fitnessLevel,
      status: 'active',
      workouts,
      weeklySchedules: existingWeekly,
      aiAdvice: existingPlan?.aiAdvice || 'Program latihan kustom Anda siap dijalankan!',
      createdAt: existingPlan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newPlan);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[#1E1E1E] text-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92dvh] h-[90dvh] sm:h-auto sm:max-h-[88vh] flex flex-col shadow-2xl border border-white/10 overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-white/5 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors shrink-0"
              title="Batal"
              aria-label="Batal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h3 className="text-base font-black text-white truncate">
                {existingPlan ? 'Edit Training Plan' : 'Buat Training Plan'}
              </h3>
              <p className="text-[11px] text-neutral-400">Atur jadwal, tanggal mulai & jarak tiap sesi</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-1 px-4 py-2 rounded-2xl bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-black transition-all active:scale-95 shadow-glow-orange shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>Simpan</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          {/* 1. Plan Details (Title, Goal, Total Weeks, Level) */}
          <div className="space-y-3 bg-[#252525] p-3.5 rounded-2xl border border-white/5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Nama Program Latihan
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Sub-35 Min 5K Plan"
                className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Target / Goal
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Contoh: Sub-35 Menit 5K"
                  className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Tanggal Mulai (Start)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500]"
                />
                {week1RangePreview && (
                  <p className="text-[10px] text-[#FF5500] font-mono font-bold mt-1">
                    Week 1: {week1RangePreview}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Durasi
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={totalWeeks}
                    onChange={(e) => setTotalWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Minggu Ke-
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalWeeks}
                    value={currentWeek}
                    onChange={(e) => setCurrentWeek(Math.max(1, Math.min(totalWeeks, parseInt(e.target.value) || 1)))}
                    className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. 7-Day Interactive Day Selector Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-400">
                Pilih Hari Latihan (7 Hari)
              </span>
              <span className="text-[11px] font-mono font-bold text-[#FF5500]">
                Total: {totalWeeklyKm.toFixed(1)} km ({activeRunningDays.length} hari lari)
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 bg-[#252525] p-1 rounded-2xl border border-white/5">
              {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
                const w = workouts.find((item) => item.dayOfWeek === dayNum);
                const isSelected = activeDayTab === dayNum;
                const isRest = w?.type === 'rest' || !w || w.distanceKm === 0;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setActiveDayTab(dayNum)}
                    className={clsx(
                      'py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center justify-center space-y-0.5',
                      isSelected
                        ? 'bg-white text-neutral-900 font-bold shadow-xs'
                        : isRest
                        ? 'bg-transparent text-neutral-500 hover:bg-white/5'
                        : 'bg-[#1E1E1E] text-white font-semibold hover:bg-[#2A2A2A] shadow-2xs border border-white/5'
                    )}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-tight">
                      {DAY_NAMES[dayNum].substring(0, 3)}
                    </span>
                    <span className={clsx(
                      'text-[9px] font-mono leading-none',
                      isSelected ? 'text-[#FF5500] font-bold' : isRest ? 'text-neutral-500' : 'text-emerald-400 font-bold'
                    )}>
                      {isRest ? 'Rest' : `${w?.distanceKm}k`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Day Session Editor Card */}
          {currentWorkout && (
            <Card className="p-4 bg-[#252525] border border-white/5 shadow-soft-sm space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                <span className="text-xs font-black uppercase text-white">
                  Sesi Hari {DAY_LABELS[currentWorkout.dayName] || currentWorkout.dayName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const isCurrentlyRest = currentWorkout.type === 'rest';
                    updateWorkout(currentWorkout.dayOfWeek, {
                      type: isCurrentlyRest ? 'easy' : 'rest',
                      distanceKm: isCurrentlyRest ? 4.0 : 0,
                      targetPaceSecPerKm: isCurrentlyRest ? 360 : null,
                      title: isCurrentlyRest ? 'Easy Aerobic Run' : 'Rest & Recovery',
                      description: isCurrentlyRest ? 'Lari santai ritme teratur.' : 'Hari istirahat pemulihan otot.',
                    });
                  }}
                  className={clsx(
                    'text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all active:scale-95',
                    currentWorkout.type === 'rest'
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
                      : 'bg-[#1E1E1E] text-neutral-300 border-white/10 hover:bg-[#2A2A2A]'
                  )}
                >
                  {currentWorkout.type === 'rest' ? '+ Jadikan Hari Lari' : 'Ubah Jadi Hari Rest'}
                </button>
              </div>

              {/* Workout Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Tipe Sesi Latihan
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {WORKOUT_TYPES.map((t) => {
                    const isChosen = currentWorkout.type === t.type;
                    return (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => {
                          updateWorkout(currentWorkout.dayOfWeek, {
                            type: t.type,
                            distanceKm: t.type === 'rest' ? 0 : (currentWorkout.distanceKm || 4.0),
                            title: t.type === 'rest' ? 'Rest & Recovery' : (currentWorkout.title === 'Rest & Recovery' ? `${t.label} Session` : currentWorkout.title),
                            targetPaceSecPerKm: t.type === 'rest' ? null : (currentWorkout.targetPaceSecPerKm || 360),
                          });
                        }}
                        className={clsx(
                          'flex items-center space-x-1.5 p-2 rounded-xl text-xs font-bold border transition-all text-left',
                          isChosen
                            ? 'bg-white text-neutral-900 border-white shadow-xs font-bold'
                            : 'bg-[#1E1E1E] text-neutral-300 border-white/5 hover:bg-[#2A2A2A]'
                        )}
                      >
                        <span className={clsx(isChosen ? 'text-[#FF5500]' : 'text-neutral-400')}>
                          {t.icon}
                        </span>
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Distance & Pace Inputs (Only when not Rest) */}
              {currentWorkout.type !== 'rest' && (
                <div className="space-y-3 pt-1">
                  {/* Distance Section with Stepper */}
                  <div className="space-y-2 bg-[#FF5500]/10 p-3 rounded-2xl border border-[#FF5500]/20">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        Target Jarak
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleDecrementDistance(currentWorkout.dayOfWeek)}
                          className="w-7 h-7 rounded-lg bg-[#252525] border border-white/10 text-white flex items-center justify-center active:scale-90 font-bold"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-black font-mono text-white px-1">
                          {(currentWorkout.distanceKm || 0).toFixed(1)} km
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrementDistance(currentWorkout.dayOfWeek)}
                          className="w-7 h-7 rounded-lg bg-[#FF5500] text-white flex items-center justify-center active:scale-90 font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-1 pt-1">
                      {QUICK_DISTANCES.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => updateWorkout(currentWorkout.dayOfWeek, { distanceKm: d })}
                          className={clsx(
                            'py-1 rounded-lg text-[11px] font-bold border transition-all text-center',
                            currentWorkout.distanceKm === d
                              ? 'bg-white text-neutral-900 border-white'
                              : 'bg-[#1E1E1E] text-neutral-300 border-white/5 hover:bg-[#2A2A2A]'
                          )}
                        >
                          {d}k
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Pace Section */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        Target Pace (5:00 - 10:00 /km)
                      </label>
                      <span className="text-xs font-black font-mono text-[#FF5500]">
                        {currentWorkout.targetPaceSecPerKm
                          ? `${Math.floor(currentWorkout.targetPaceSecPerKm / 60)}:${String(currentWorkout.targetPaceSecPerKm % 60).padStart(2, '0')} /km`
                          : 'None'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      {QUICK_PACES.map((p) => (
                        <button
                          key={p.sec}
                          type="button"
                          onClick={() => updateWorkout(currentWorkout.dayOfWeek, { targetPaceSecPerKm: p.sec })}
                          className={clsx(
                            'py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all text-center',
                            currentWorkout.targetPaceSecPerKm === p.sec
                              ? 'bg-white text-neutral-900 border-white'
                              : 'bg-[#1E1E1E] text-neutral-300 border-white/5 hover:bg-[#2A2A2A]'
                          )}
                        >
                          {p.label}/k
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target HR Zone */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">
                      Target Heart Rate Zone
                    </label>
                    <select
                      value={currentWorkout.targetHrZone || HR_ZONES[1]}
                      onChange={(e) =>
                        updateWorkout(currentWorkout.dayOfWeek, { targetHrZone: e.target.value })
                      }
                      className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30"
                    >
                      {HR_ZONES.map((zone) => (
                        <option key={zone} value={zone} className="bg-[#1E1E1E] text-white">
                          {zone}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Workout Title & Description */}
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">
                        Judul Sesi
                      </label>
                      <input
                        type="text"
                        value={currentWorkout.title}
                        onChange={(e) =>
                          updateWorkout(currentWorkout.dayOfWeek, { title: e.target.value })
                        }
                        placeholder="Contoh: Easy Aerobic Run"
                        className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">
                        Catatan Latihan
                      </label>
                      <textarea
                        rows={2}
                        value={currentWorkout.description || ''}
                        onChange={(e) =>
                          updateWorkout(currentWorkout.dayOfWeek, { description: e.target.value })
                        }
                        placeholder="Contoh: 1km pemanasan santai, 3km steady tempo"
                        className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30"
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="p-4 border-t border-white/5 bg-[#1E1E1E] flex items-center space-x-2.5 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.3)] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className="flex-1 font-bold text-xs py-3"
          >
            Batal
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            rightIcon={<Check className="w-4 h-4" />}
            className="flex-2 font-bold text-xs shadow-glow-orange py-3"
          >
            Simpan Program ({activeRunningDays.length} Hari Lari)
          </Button>
        </div>
      </div>
    </div>
  );
};
