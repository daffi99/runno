import React, { useState } from 'react';
import type { PlanWorkout, WorkoutType } from '../../types/run';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  X,
  Zap,
  Flame,
  Heart,
  Moon,
  Check,
  Pencil,
} from 'lucide-react';
import { clsx } from 'clsx';

interface EditWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: PlanWorkout | null;
  onSaveWorkout: (updatedWorkout: PlanWorkout) => void;
}

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

const DAY_LABELS: Record<string, string> = {
  Monday: 'Senin',
  Tuesday: 'Selasa',
  Wednesday: 'Rabu',
  Thursday: 'Kamis',
  Friday: 'Jumat',
  Saturday: 'Sabtu',
  Sunday: 'Minggu',
};

export const EditWorkoutModal: React.FC<EditWorkoutModalProps> = ({
  isOpen,
  onClose,
  workout,
  onSaveWorkout,
}) => {
  if (!isOpen || !workout) return null;

  const [type, setType] = useState<WorkoutType>(workout.type || 'easy');
  const [distanceKm, setDistanceKm] = useState<number>(workout.distanceKm || 4.0);
  const [targetPaceSec, setTargetPaceSec] = useState<number | null>(workout.targetPaceSecPerKm || null);
  const [title, setTitle] = useState<string>(workout.title || 'Run Session');
  const [targetHrZone, setTargetHrZone] = useState<string>(workout.targetHrZone || HR_ZONES[1]);
  const [description, setDescription] = useState<string>(workout.description || '');

  const paceDisplay = targetPaceSec
    ? `${Math.floor(targetPaceSec / 60)}:${String(targetPaceSec % 60).padStart(2, '0')}`
    : '';

  const handleSave = () => {
    const isRest = type === 'rest';
    const updated: PlanWorkout = {
      ...workout,
      type,
      distanceKm: isRest ? 0 : Number(distanceKm) || 0,
      targetPaceSecPerKm: isRest ? null : targetPaceSec,
      targetHrZone: isRest ? null : targetHrZone,
      title: title.trim() || (isRest ? 'Rest & Recovery' : 'Run Session'),
      description: description.trim(),
    };
    onSaveWorkout(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF5500] flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900">
                Edit Sesi {DAY_LABELS[workout.dayName] || workout.dayName}
              </h3>
              <p className="text-[11px] text-neutral-400 font-medium">
                Sesuaikan target jarak, pace, dan tipe latihan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workout Type Selector */}
        <div>
          <label className="block text-[11px] font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">
            Tipe Latihan
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {WORKOUT_TYPES.map((t) => {
              const isChosen = type === t.type;
              return (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => {
                    setType(t.type);
                    if (t.type === 'rest') {
                      setDistanceKm(0);
                      setTargetPaceSec(null);
                      setTitle('Rest & Recovery');
                      setDescription('Hari istirahat pemulihan otot.');
                    } else if (workout.type === 'rest') {
                      setDistanceKm(4.0);
                      setTargetPaceSec(360);
                      setTitle(`${t.label} Session`);
                      setDescription('Fokus ritme stabil dan nafas teratur.');
                    }
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

        {/* Distance & Pace Inputs */}
        {type !== 'rest' ? (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1 uppercase tracking-wider">
                  Target Jarak
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20"
                  />
                  <span className="text-xs font-bold text-neutral-400">km</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1 uppercase tracking-wider">
                  Target Pace (/km)
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    placeholder="e.g. 5:30"
                    value={paceDisplay}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      if (val.includes(':')) {
                        const [m, s] = val.split(':').map(Number);
                        if (!isNaN(m) && !isNaN(s)) {
                          setTargetPaceSec(m * 60 + s);
                        }
                      } else {
                        const num = parseFloat(val);
                        if (!isNaN(num)) {
                          setTargetPaceSec(Math.round(num * 60));
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Easy Aerobic 5K"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1 uppercase tracking-wider">
                  Zona Heart Rate
                </label>
                <select
                  value={targetHrZone}
                  onChange={(e) => setTargetHrZone(e.target.value)}
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
                Catatan / Instruksi
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: 1km warmup santai, 3km tempo @ 5:30/km, 1km cooldown"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20"
              />
            </div>
          </div>
        ) : (
          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-center space-y-1">
            <Moon className="w-5 h-5 text-neutral-400 mx-auto" />
            <p className="text-xs font-bold text-neutral-700">Hari Istirahat (Rest Day)</p>
            <p className="text-[11px] text-neutral-400">Jarak dan target pace dinonaktifkan untuk pemulihan optimal.</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="pt-2 flex items-center space-x-2.5">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className="flex-1 font-bold text-xs"
          >
            Batal
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            leftIcon={<Check className="w-4 h-4 text-white" />}
            className="flex-2 font-bold text-xs shadow-glow-orange"
          >
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </div>
  );
};
