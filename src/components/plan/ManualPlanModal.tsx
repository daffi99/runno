import React, { useState } from 'react';
import type { TrainingPlan, PlanWorkout, WorkoutType, UnitSystem } from '../../types/run';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { formatPace, formatDistance } from '../../utils/formatters';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Zap,
  Flame,
  Heart,
  Moon,
  Clock,
  Activity,
  Check,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { clsx } from 'clsx';

interface ManualPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: TrainingPlan) => void;
  existingPlan?: TrainingPlan | null;
  unitSystem?: UnitSystem;
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// Indonesian display for days
const DAY_LABELS: Record<string, string> = {
  Monday: 'Senin',
  Tuesday: 'Selasa',
  Wednesday: 'Rabu',
  Thursday: 'Kamis',
  Friday: 'Jumat',
  Saturday: 'Sabtu',
  Sunday: 'Minggu',
};

const WORKOUT_TYPES: { type: WorkoutType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'easy', label: 'Easy Run', icon: <Heart className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { type: 'tempo', label: 'Tempo Run', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { type: 'intervals', label: 'Intervals', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { type: 'long_run', label: 'Long Run', icon: <Flame className="w-3.5 h-3.5" />, color: 'text-[#FF5500] bg-orange-50 border-orange-200' },
  { type: 'recovery', label: 'Recovery', icon: <Heart className="w-3.5 h-3.5" />, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { type: 'rest', label: 'Rest Day', icon: <Moon className="w-3.5 h-3.5" />, color: 'text-neutral-500 bg-neutral-100 border-neutral-200' },
];

const HR_ZONES = [
  'Zone 1 (Warm Up)',
  'Zone 2 (Aerobic Base)',
  'Zone 3 (Tempo / Aerobic)',
  'Zone 4 (Threshold)',
  'Zone 5 (Max Effort)',
];

export const ManualPlanModal: React.FC<ManualPlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingPlan,
  unitSystem = 'metric',
}) => {
  // Plan meta details
  const [title, setTitle] = useState<string>(existingPlan?.title || 'Sub-35 Min 5K Plan');
  const [goal, setGoal] = useState<string>(existingPlan?.goal || 'Mencapai Target 5K Sub-35 Menit');
  const [totalWeeks, setTotalWeeks] = useState<number>(existingPlan?.totalWeeks || 8);
  const [currentWeek, setCurrentWeek] = useState<number>(existingPlan?.currentWeek || 1);
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    existingPlan?.fitnessLevel || 'beginner'
  );

  // Initialize 7 days of workouts (order: Monday=1 to Sunday=0)
  const initialWorkouts = (): PlanWorkout[] => {
    if (existingPlan?.workouts && existingPlan.workouts.length >= 7) {
      return existingPlan.workouts;
    }

    const defaultDayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    return defaultDayOrder.map((dayNum) => {
      const dayName = DAY_NAMES[dayNum];
      // Default: Tue, Thu, Sat active runs
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

  const [workouts, setWorkouts] = useState<PlanWorkout[]>(initialWorkouts);
  const [activeDayTab, setActiveDayTab] = useState<number>(1); // Default to Monday (1)

  if (!isOpen) return null;

  const currentWorkout = workouts.find((w) => w.dayOfWeek === activeDayTab) || workouts[0];

  const updateWorkout = (dayOfWeek: number, updates: Partial<PlanWorkout>) => {
    setWorkouts((prev) =>
      prev.map((w) => (w.dayOfWeek === dayOfWeek ? { ...w, ...updates } : w))
    );
  };

  const activeRunningDays = workouts.filter((w) => w.type !== 'rest' && w.distanceKm > 0);
  const totalWeeklyKm = workouts.reduce((sum, w) => sum + (w.type !== 'rest' ? (Number(w.distanceKm) || 0) : 0), 0);
  const scheduleSummaryText = activeRunningDays.map((w) => DAY_LABELS[w.dayName] || w.dayName).join(', ');

  const handleSave = () => {
    const planId = existingPlan?.id || `plan_manual_${Date.now()}`;
    const newPlan: TrainingPlan = {
      id: planId,
      title: title.trim() || 'Custom Training Plan',
      goal: goal.trim() || 'Building Running Endurance',
      scheduleSummary: scheduleSummaryText || 'Flexible Schedule',
      selectedDays: activeRunningDays.map((w) => w.dayName),
      startDate: existingPlan?.startDate || new Date().toISOString().split('T')[0],
      weeklyTargetKm: Number(totalWeeklyKm.toFixed(1)),
      totalWeeks: Number(totalWeeks) || 8,
      currentWeek: Number(currentWeek) || 1,
      fitnessLevel,
      status: 'active',
      workouts,
      aiAdvice: existingPlan?.aiAdvice || 'Program latihan kustom Anda siap dijalankan!',
      createdAt: existingPlan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newPlan);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92dvh] h-[90dvh] sm:h-auto sm:max-h-[88vh] flex flex-col shadow-2xl border border-neutral-100 overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-neutral-100 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors shrink-0"
              title="Batal"
              aria-label="Batal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h3 className="text-base font-black text-neutral-900 tracking-tight truncate">
                {existingPlan ? 'Edit Training Plan' : 'Create Manual Plan'}
              </h3>
              <p className="text-[11px] text-neutral-400 font-medium truncate">
                Atur jadwal mingguan, pace & jarak
              </p>
            </div>
          </div>

          {/* Top Right Primary Submit Button */}
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-black shadow-glow-orange active:scale-95 transition-all shrink-0 ml-2"
          >
            <Check className="w-4 h-4 text-white stroke-[3]" />
            <span>Simpan</span>
          </button>
        </div>


        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          {/* 1. Plan Details (Title, Goal, Total Weeks, Level) */}

        <div className="space-y-3 bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/70">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Nama Program Latihan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Sub-35 Min 5K Plan"
              className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Target / Goal
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Contoh: Sub-35 Menit 5K"
                className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Durasi Minggu
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={totalWeeks}
                  onChange={(e) => setTotalWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Minggu Ke-
                </label>
                <input
                  type="number"
                  min="1"
                  max={totalWeeks}
                  value={currentWeek}
                  onChange={(e) => setCurrentWeek(Math.max(1, Math.min(totalWeeks, parseInt(e.target.value) || 1)))}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. 7-Day Interactive Day Selector Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-500">
              Konfigurasi 7 Hari Latihan
            </span>
            <span className="text-[11px] font-mono font-bold text-[#FF5500]">
              Total: {totalWeeklyKm.toFixed(1)} km / minggu ({activeRunningDays.length} hari lari)
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 bg-neutral-100 p-1 rounded-2xl">
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
                      ? 'bg-neutral-900 text-white font-bold shadow-xs'
                      : isRest
                      ? 'bg-white/60 text-neutral-400 hover:bg-white'
                      : 'bg-white text-neutral-800 font-semibold hover:bg-neutral-50 shadow-2xs'
                  )}
                >
                  <span className="text-[10px] uppercase font-bold tracking-tight">
                    {DAY_NAMES[dayNum].substring(0, 3)}
                  </span>
                  <span className={clsx(
                    'text-[9px] font-mono leading-none',
                    isSelected ? 'text-[#FF5500] font-bold' : isRest ? 'text-neutral-400' : 'text-emerald-600 font-bold'
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
          <Card className="p-4 bg-white border border-neutral-200/90 shadow-soft-sm space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
              <span className="text-xs font-black uppercase text-neutral-800">
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
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                )}
              >
                {currentWorkout.type === 'rest' ? '+ Aktifkan Jadi Hari Lari' : 'Ubah Jadi Hari Rest'}
              </button>
            </div>

            {/* Workout Type Selector */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">
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
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200/70 hover:bg-neutral-100'
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
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-1 uppercase tracking-wider">
                      Target Jarak (km)
                    </label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="50"
                        value={currentWorkout.distanceKm}
                        onChange={(e) =>
                          updateWorkout(currentWorkout.dayOfWeek, {
                            distanceKm: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20"
                      />
                      <span className="text-xs font-bold text-neutral-400 pr-1">km</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-1 uppercase tracking-wider">
                      Target Pace (/km)
                    </label>
                    <div className="flex items-center space-x-1.5">
                      {/* Min / Sec helper */}
                      <input
                        type="text"
                        placeholder="e.g. 5:30"
                        value={
                          currentWorkout.targetPaceSecPerKm
                            ? `${Math.floor(currentWorkout.targetPaceSecPerKm / 60)}:${String(currentWorkout.targetPaceSecPerKm % 60).padStart(2, '0')}`
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          if (val.includes(':')) {
                            const [m, s] = val.split(':').map(Number);
                            if (!isNaN(m) && !isNaN(s)) {
                              updateWorkout(currentWorkout.dayOfWeek, { targetPaceSecPerKm: m * 60 + s });
                            }
                          } else {
                            const num = parseFloat(val);
                            if (!isNaN(num)) {
                              updateWorkout(currentWorkout.dayOfWeek, { targetPaceSecPerKm: Math.round(num * 60) });
                            }
                          }
                        }}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20"
                      />
                      <span className="text-xs font-bold text-neutral-400">/km</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-1 uppercase tracking-wider">
                      Judul Sesi
                    </label>
                    <input
                      type="text"
                      value={currentWorkout.title}
                      onChange={(e) => updateWorkout(currentWorkout.dayOfWeek, { title: e.target.value })}
                      placeholder="Contoh: Easy Run 5K"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-1 uppercase tracking-wider">
                      Zona Heart Rate
                    </label>
                    <select
                      value={currentWorkout.targetHrZone || HR_ZONES[1]}
                      onChange={(e) => updateWorkout(currentWorkout.dayOfWeek, { targetHrZone: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20"
                    >
                      {HR_ZONES.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1 uppercase tracking-wider">
                    Catatan / Instruksi Latihan
                  </label>
                  <input
                    type="text"
                    value={currentWorkout.description}
                    onChange={(e) => updateWorkout(currentWorkout.dayOfWeek, { description: e.target.value })}
                    placeholder="Contoh: 1km warmup santai, 3km tempo @ 5:30/km, 1km cooldown"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20"
                  />
                </div>
              </div>
            )}
          </Card>
        )}
        </div>

        {/* Action Buttons - Pinned Sticky Footer */}
        <div className="p-4 border-t border-neutral-100 bg-white flex items-center space-x-2.5 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-[max(1rem,env(safe-area-inset-bottom))]">
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
            leftIcon={<Check className="w-4 h-4 text-white" />}
            className="flex-2 font-bold text-xs shadow-glow-orange py-3"
          >
            Simpan Program Latihan
          </Button>
        </div>
      </div>
    </div>
  );
};

