import React, { useState } from 'react';
import type { PlanWorkout, WorkoutType } from '../../types/run';
import { Button } from '../ui/Button';
import {
  X,
  Zap,
  Flame,
  Heart,
  Moon,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
} from 'lucide-react';
import { clsx } from 'clsx';

interface EditWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: PlanWorkout | null;
  onSaveWorkout: (updatedWorkout: PlanWorkout) => void;
}

const WORKOUT_TYPES: {
  type: WorkoutType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  activeColor: string;
  badgeBg: string;
}[] = [
  {
    type: 'easy',
    label: 'Easy Run',
    desc: 'Lari santai ritme nyaman untuk membangun aerobik dasar.',
    icon: <Heart className="w-5 h-5 text-emerald-400" />,
    activeColor: 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/30',
    badgeBg: 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30',
  },
  {
    type: 'tempo',
    label: 'Tempo Run',
    desc: 'Lari ritme stabil & cepat terkontrol di batas threshold.',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    activeColor: 'border-amber-500 bg-amber-950/40 ring-2 ring-amber-500/30',
    badgeBg: 'bg-amber-950/60 text-amber-300 border border-amber-500/30',
  },
  {
    type: 'intervals',
    label: 'Intervals',
    desc: 'Sesi lari cepat bergantian dengan istirahat untuk VO2Max.',
    icon: <Zap className="w-5 h-5 text-purple-400" />,
    activeColor: 'border-purple-500 bg-purple-950/40 ring-2 ring-purple-500/30',
    badgeBg: 'bg-purple-950/60 text-purple-300 border border-purple-500/30',
  },
  {
    type: 'long_run',
    label: 'Long Run',
    desc: 'Lari jarak jauh dengan pace stabil untuk melatih daya tahan.',
    icon: <Flame className="w-5 h-5 text-[#FF5500]" />,
    activeColor: 'border-[#FF5500] bg-[#FF5500]/15 ring-2 ring-[#FF5500]/30',
    badgeBg: 'bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30',
  },
  {
    type: 'recovery',
    label: 'Recovery Run',
    desc: 'Lari sangat santai untuk regenerasi otot & kelancaran darah.',
    icon: <Heart className="w-5 h-5 text-teal-400" />,
    activeColor: 'border-teal-500 bg-teal-950/40 ring-2 ring-teal-500/30',
    badgeBg: 'bg-teal-950/60 text-teal-300 border border-teal-500/30',
  },
  {
    type: 'rest',
    label: 'Rest Day',
    desc: 'Istirahat total dari lari agar tubuh dan otot pulih sempurna.',
    icon: <Moon className="w-5 h-5 text-neutral-400" />,
    activeColor: 'border-neutral-500 bg-neutral-800 ring-2 ring-neutral-600',
    badgeBg: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
  },
];

const HR_ZONES_DATA = [
  { zone: 'Zone 1 (Warm Up)', label: 'Zone 1 (Warm Up)', desc: 'Pemanasan sangat ringan (< 60% HR Max)' },
  { zone: 'Zone 2 (Aerobic Base)', label: 'Zone 2 (Aerobic Base)', desc: 'Fondasi aerobik nyaman (60-70% HR Max)' },
  { zone: 'Zone 3 (Tempo / Aerobic)', label: 'Zone 3 (Tempo / Aerobic)', desc: 'Pace tempo sedang (70-80% HR Max)' },
  { zone: 'Zone 4 (Threshold)', label: 'Zone 4 (Threshold)', desc: 'Pace keras / threshold (80-90% HR Max)' },
  { zone: 'Zone 5 (Max Effort)', label: 'Zone 5 (Max Effort)', desc: 'Sprint / batas maksimal (90-100% HR Max)' },
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

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [type, setType] = useState<WorkoutType>(workout.type || 'easy');
  const [distanceKm, setDistanceKm] = useState<number>(workout.distanceKm || 4.0);
  const [targetPaceSec, setTargetPaceSec] = useState<number | null>(workout.targetPaceSecPerKm || 360);
  const [title, setTitle] = useState<string>(workout.title || 'Run Session');
  const [targetHrZone, setTargetHrZone] = useState<string>(workout.targetHrZone || 'Zone 2 (Aerobic Base)');
  const [description, setDescription] = useState<string>(workout.description || '');

  const isRest = type === 'rest';

  const formatPaceText = (sec: number | null) => {
    if (!sec || sec <= 0) return 'Santai';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleIncrementDistance = () => {
    setDistanceKm((prev) => Math.round((prev + 0.5) * 10) / 10);
  };

  const handleDecrementDistance = () => {
    setDistanceKm((prev) => Math.max(0.5, Math.round((prev - 0.5) * 10) / 10));
  };

  const handleAdjustPace = (deltaSeconds: number) => {
    const current = targetPaceSec || 360;
    const next = Math.max(240, Math.min(720, current + deltaSeconds));
    setTargetPaceSec(next);
  };

  const handleSave = (overrides?: Partial<PlanWorkout>) => {
    const finalType = overrides?.type !== undefined ? overrides.type : type;
    const finalIsRest = finalType === 'rest';
    const finalDistance = finalIsRest ? 0 : (overrides?.distanceKm !== undefined ? overrides.distanceKm : Number(distanceKm) || 0);
    const finalPace = finalIsRest ? null : (overrides?.targetPaceSecPerKm !== undefined ? overrides.targetPaceSecPerKm : targetPaceSec);
    const finalHr = finalIsRest ? null : (overrides?.targetHrZone !== undefined ? overrides.targetHrZone : targetHrZone);
    const finalTitle = overrides?.title !== undefined
      ? overrides.title
      : (title.trim() || (finalIsRest ? 'Rest & Recovery' : `${finalType.toUpperCase()} Session`));
    const finalDesc = overrides?.description !== undefined
      ? overrides.description
      : (finalIsRest ? 'Hari istirahat pemulihan otot.' : description.trim());

    const updated: PlanWorkout = {
      ...workout,
      ...overrides,
      type: finalType,
      distanceKm: finalDistance,
      targetPaceSecPerKm: finalPace,
      targetHrZone: finalHr,
      title: finalTitle,
      description: finalDesc,
    };
    onSaveWorkout(updated);
    onClose();
  };

  const nextStep = () => {
    if (step === 1 && isRest) {
      handleSave({
        type: 'rest',
        distanceKm: 0,
        targetPaceSecPerKm: null,
        targetHrZone: null,
        title: 'Rest & Recovery',
        description: 'Hari istirahat pemulihan otot.',
      });
      return;
    }
    if (step < 5) {
      setStep((prev) => (prev + 1) as any);
    } else {
      handleSave();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as any);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[#1E1E1E] text-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92dvh] h-[90dvh] sm:h-auto sm:max-h-[88vh] flex flex-col shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-white/5 shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors shrink-0"
              title="Tutup / Batal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h3 className="text-base font-black text-white truncate">
                Edit Sesi {DAY_LABELS[workout.dayName] || workout.dayName}
              </h3>
              <p className="text-[11px] text-neutral-400 font-medium truncate">
                Langkah {step} dari 5: {step === 1 ? 'Tipe Latihan' : step === 2 ? 'Target Jarak' : step === 3 ? 'Target Pace' : step === 4 ? 'Heart Rate' : 'Nama & Catatan'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center space-x-0.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-[#252525] hover:bg-[#2F2F2F] text-neutral-300 text-xs font-bold active:scale-95 transition-all shadow-2xs"
                title="Kembali ke langkah sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSave()}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-black shadow-glow-orange active:scale-95 transition-all"
            >
              <Check className="w-4 h-4 text-white stroke-[3]" />
              <span>Simpan</span>
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center space-x-1.5 px-4 pt-3 shrink-0">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              onClick={() => setStep(s as any)}
              className={clsx(
                'h-1.5 flex-1 rounded-full cursor-pointer transition-all',
                step >= s ? 'bg-[#FF5500]' : 'bg-[#252525]'
              )}
            />
          ))}
        </div>

        {/* Scrollable Content Wizard */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          {step === 1 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-black text-white">1. Pilih Tipe Latihan</h4>
                <p className="text-xs text-neutral-400">Tap salah satu kartu untuk langsung lanjut</p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {WORKOUT_TYPES.map((t) => {
                  const isSelected = type === t.type;
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
                          handleSave({
                            type: 'rest',
                            distanceKm: 0,
                            targetPaceSecPerKm: null,
                            targetHrZone: null,
                            title: 'Rest & Recovery',
                            description: 'Hari istirahat pemulihan otot.',
                          });
                        } else {
                          if (workout.type === 'rest' || distanceKm === 0) {
                            setDistanceKm(5.0);
                            setTargetPaceSec(360);
                            setTitle(`${t.label} Session`);
                            setDescription('Fokus ritme stabil dan nafas teratur.');
                          }
                          setStep(2);
                        }
                      }}
                      className={clsx(
                        'w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between active:scale-[0.98] shadow-soft-xs',
                        isSelected ? t.activeColor : 'border-white/5 bg-[#252525] hover:bg-[#2A2A2A]'
                      )}
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 shadow-2xs">
                          {t.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-black text-white">{t.label}</span>
                            <span className={clsx('text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md', t.badgeBg)}>
                              {t.type === 'rest' ? 'Rest' : 'Run'}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5 leading-snug">{t.desc}</p>
                        </div>
                      </div>

                      <div className={clsx(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-2',
                        isSelected ? 'border-[#FF5500] bg-[#FF5500] text-white' : 'border-white/20'
                      )}>
                        {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-black text-white">2. Target Jarak Lari</h4>
                <p className="text-xs text-neutral-400">Atur jarak dengan tombol + / - (kelipatan 0.5 km) atau pilih jarak cepat</p>
              </div>

              <div className="p-6 rounded-3xl bg-[#FF5500]/10 border border-[#FF5500]/20 text-center space-y-4 shadow-soft-sm">
                <div className="space-y-1">
                  <div className="text-5xl font-black font-mono text-white tracking-tight">
                    {distanceKm.toFixed(1)}
                    <span className="text-xl font-bold text-[#FF5500] ml-1">km</span>
                  </div>
                  <p className="text-xs text-neutral-400 font-medium">Jarak Sesi Latihan</p>
                </div>

                <div className="flex items-center justify-center space-x-6 pt-1">
                  <button
                    type="button"
                    onClick={handleDecrementDistance}
                    className="w-14 h-14 rounded-2xl bg-[#252525] border-2 border-white/10 hover:border-white/20 text-white flex items-center justify-center active:scale-90 transition-all shadow-soft-xs text-xl font-black"
                  >
                    <Minus className="w-6 h-6 stroke-[3]" />
                  </button>

                  <div className="text-xs font-black uppercase text-neutral-400 tracking-wider">
                    ± 0.5 km
                  </div>

                  <button
                    type="button"
                    onClick={handleIncrementDistance}
                    className="w-14 h-14 rounded-2xl bg-[#FF5500] hover:bg-[#E64D00] text-white flex items-center justify-center active:scale-90 transition-all shadow-glow-orange text-xl font-black"
                  >
                    <Plus className="w-6 h-6 stroke-[3]" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Pilihan Jarak Cepat
                  </span>
                  <span className="text-[10px] text-neutral-400">Tap untuk langsung lanjut</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {QUICK_DISTANCES.map((d) => {
                    const isSelected = distanceKm === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setDistanceKm(d);
                          setStep(3);
                        }}
                        className={clsx(
                          'py-2 px-1 rounded-xl text-xs font-black transition-all border text-center active:scale-95',
                          isSelected
                            ? 'bg-white text-neutral-900 border-white shadow-2xs font-bold'
                            : 'bg-[#252525] text-neutral-300 border-white/5 hover:bg-[#2F2F2F]'
                        )}
                      >
                        {d}k
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-black text-white">3. Target Pace Lari</h4>
                <p className="text-xs text-neutral-400">Pilih kecepatan target dari pace 5:00 s/d 10:00 /km</p>
              </div>

              <div className="p-5 rounded-3xl bg-[#FF5500]/10 border border-[#FF5500]/20 text-center space-y-3 shadow-soft-sm">
                <div className="space-y-1">
                  <div className="text-5xl font-black font-mono text-white tracking-tight">
                    {formatPaceText(targetPaceSec)}
                    <span className="text-xl font-bold text-[#FF5500] ml-1">/km</span>
                  </div>
                  <p className="text-xs text-neutral-400 font-medium">Target Pace</p>
                </div>

                <div className="flex items-center justify-center space-x-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustPace(-5)}
                    className="px-4 py-2.5 rounded-xl bg-[#252525] border border-white/10 hover:border-white/20 text-xs font-black text-white active:scale-95 shadow-2xs"
                  >
                    - 5s (Cepat)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustPace(5)}
                    className="px-4 py-2.5 rounded-xl bg-[#252525] border border-white/10 hover:border-white/20 text-xs font-black text-white active:scale-95 shadow-2xs"
                  >
                    + 5s (Santai)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Pilihan Pace Cepat (Pace 5 s/d 10)
                  </span>
                  <span className="text-[10px] text-neutral-400">Tap untuk lanjut</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {QUICK_PACES.map((p) => {
                    const isSelected = targetPaceSec === p.sec;
                    return (
                      <button
                        key={p.sec}
                        type="button"
                        onClick={() => {
                          setTargetPaceSec(p.sec);
                          setStep(4);
                        }}
                        className={clsx(
                          'py-2 px-1 rounded-xl text-xs font-black transition-all border text-center font-mono active:scale-95',
                          isSelected
                            ? 'bg-white text-neutral-900 border-white shadow-2xs font-bold'
                            : 'bg-[#252525] text-neutral-300 border-white/5 hover:bg-[#2F2F2F]'
                        )}
                      >
                        {p.label}/k
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-black text-white">4. Target Heart Rate Zone</h4>
                <p className="text-xs text-neutral-400">Pilih intensitas detak jantung (tap untuk lanjut)</p>
              </div>

              <div className="space-y-2">
                {HR_ZONES_DATA.map((z) => {
                  const isSelected = targetHrZone === z.zone;
                  return (
                    <button
                      key={z.zone}
                      type="button"
                      onClick={() => {
                        setTargetHrZone(z.zone);
                        setStep(5);
                      }}
                      className={clsx(
                        'w-full p-3 rounded-2xl border-2 text-left flex items-center justify-between transition-all active:scale-[0.98]',
                        isSelected
                          ? 'bg-[#FF5500]/15 border-[#FF5500] text-white font-bold shadow-2xs ring-2 ring-[#FF5500]/30'
                          : 'bg-[#252525] border-white/5 text-neutral-300 hover:bg-[#2A2A2A]'
                      )}
                    >
                      <div>
                        <div className="text-xs font-black text-white">{z.label}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">{z.desc}</div>
                      </div>
                      <div className={clsx(
                        'w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2',
                        isSelected ? 'border-[#FF5500] bg-[#FF5500] text-white' : 'border-white/20'
                      )}>
                        {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-black text-white">5. Nama Sesi & Catatan Latihan</h4>
                <p className="text-xs text-neutral-400">Lengkapi judul latihan dan instruksi khusus</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#252525] border border-white/5 space-y-2">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Ringkasan Sesi:</div>
                <div className="flex items-center space-x-2 text-xs font-black text-white">
                  <span className="px-2 py-0.5 rounded-md bg-[#FF5500]/15 text-[#FF5500] uppercase text-[10px]">{type}</span>
                  <span>{distanceKm.toFixed(1)} km</span>
                  <span>·</span>
                  <span>Pace {formatPaceText(targetPaceSec)}/km</span>
                  <span>·</span>
                  <span className="text-neutral-400 text-[11px]">{targetHrZone.split(' ')[0]}</span>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">
                    Nama Sesi
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Easy Aerobic Run"
                    className="w-full bg-[#252525] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">
                    Instruksi / Catatan Latihan
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: 1km warmup santai, 3km steady tempo @ 5:30/km, 1km cooldown"
                    className="w-full bg-[#252525] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-white/5 bg-[#1E1E1E] flex items-center space-x-2.5 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.3)] pb-[max(1rem,env(safe-area-inset-bottom))]">
          {step > 1 ? (
            <Button
              variant="secondary"
              size="md"
              onClick={prevStep}
              className="flex-1 font-bold text-xs py-3"
            >
              Kembali
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="flex-1 font-bold text-xs py-3"
            >
              Batal
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={nextStep}
            rightIcon={step < 5 && !isRest ? <ChevronRight className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            className="flex-2 font-bold text-xs shadow-glow-orange py-3"
          >
            {step === 1 && isRest
              ? 'Simpan Rest Day'
              : step === 5
              ? 'Simpan Perubahan Sesi'
              : 'Lanjut'}
          </Button>
        </div>
      </div>
    </div>
  );
};
