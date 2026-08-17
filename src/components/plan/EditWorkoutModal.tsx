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
    icon: <Heart className="w-5 h-5 text-emerald-500" />,
    activeColor: 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-400/30',
    badgeBg: 'bg-emerald-100 text-emerald-800',
  },
  {
    type: 'tempo',
    label: 'Tempo Run',
    desc: 'Lari ritme stabil & cepat terkontrol di batas threshold.',
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    activeColor: 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30',
    badgeBg: 'bg-amber-100 text-amber-800',
  },
  {
    type: 'intervals',
    label: 'Intervals',
    desc: 'Sesi lari cepat bergantian dengan istirahat untuk VO2Max.',
    icon: <Zap className="w-5 h-5 text-purple-500" />,
    activeColor: 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-400/30',
    badgeBg: 'bg-purple-100 text-purple-800',
  },
  {
    type: 'long_run',
    label: 'Long Run',
    desc: 'Lari jarak jauh dengan pace stabil untuk melatih daya tahan.',
    icon: <Flame className="w-5 h-5 text-[#FF5500]" />,
    activeColor: 'border-[#FF5500] bg-orange-50/60 ring-2 ring-[#FF5500]/30',
    badgeBg: 'bg-orange-100 text-orange-800',
  },
  {
    type: 'recovery',
    label: 'Recovery Run',
    desc: 'Lari sangat santai untuk regenerasi otot & kelancaran darah.',
    icon: <Heart className="w-5 h-5 text-teal-500" />,
    activeColor: 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-400/30',
    badgeBg: 'bg-teal-100 text-teal-800',
  },
  {
    type: 'rest',
    label: 'Rest Day',
    desc: 'Istirahat total dari lari agar tubuh dan otot pulih sempurna.',
    icon: <Moon className="w-5 h-5 text-neutral-400" />,
    activeColor: 'border-neutral-700 bg-neutral-100 ring-2 ring-neutral-300',
    badgeBg: 'bg-neutral-200 text-neutral-700',
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

  const handleSave = () => {
    const updated: PlanWorkout = {
      ...workout,
      type,
      distanceKm: isRest ? 0 : Number(distanceKm) || 0,
      targetPaceSecPerKm: isRest ? null : targetPaceSec,
      targetHrZone: isRest ? null : targetHrZone,
      title: title.trim() || (isRest ? 'Rest & Recovery' : `${type.toUpperCase()} Session`),
      description: description.trim(),
    };
    onSaveWorkout(updated);
    onClose();
  };

  const handleIncrementDistance = () => {
    setDistanceKm((prev) => Number((Math.max(0.5, prev + 0.5)).toFixed(1)));
  };

  const handleDecrementDistance = () => {
    setDistanceKm((prev) => Number((Math.max(0.5, prev - 0.5)).toFixed(1)));
  };

  const handleAdjustPace = (deltaSec: number) => {
    setTargetPaceSec((prev) => Math.max(180, (prev || 360) + deltaSec));
  };

  const formatPaceText = (sec: number | null) => {
    if (!sec) return 'None';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const nextStep = () => {
    if (step === 1 && isRest) {
      handleSave();
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92dvh] h-[90dvh] sm:h-auto sm:max-h-[88vh] flex flex-col shadow-2xl border border-neutral-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-neutral-100 shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors shrink-0"
              title="Tutup / Batal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h3 className="text-base font-black text-neutral-900 truncate">
                Edit Sesi {DAY_LABELS[workout.dayName] || workout.dayName}
              </h3>
              <p className="text-[11px] text-neutral-400 font-medium truncate">
                Langkah {step} dari 5: {step === 1 ? 'Tipe Latihan' : step === 2 ? 'Target Jarak' : step === 3 ? 'Target Pace' : step === 4 ? 'Heart Rate' : 'Nama & Catatan'}
              </p>
            </div>
          </div>

          {/* Top Right Action Buttons: Back & Simpan side by side */}
          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center space-x-0.5 px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold active:scale-95 transition-all shadow-2xs"
                title="Kembali ke langkah sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
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
                step >= s ? 'bg-[#FF5500]' : 'bg-neutral-200'
              )}
            />
          ))}
        </div>

        {/* Scrollable Content Wizard */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          {/* STEP 1: TIPE LATIHAN (Big Cards -> 1-click auto advance) */}
          {step === 1 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-black text-neutral-900">1. Pilih Tipe Latihan</h4>
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
                          setTimeout(() => handleSave(), 100);
                        } else {
                          if (workout.type === 'rest' || distanceKm === 0) {
                            setDistanceKm(5.0);
                            setTargetPaceSec(360);
                            setTitle(`${t.label} Session`);
                            setDescription('Fokus ritme stabil dan nafas teratur.');
                          }
                          // Single click auto-advance to step 2!
                          setStep(2);
                        }
                      }}
                      className={clsx(
                        'w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between active:scale-[0.98] shadow-soft-xs',
                        isSelected ? t.activeColor : 'border-neutral-200/90 bg-white hover:bg-neutral-50'
                      )}
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center shrink-0 shadow-2xs">
                          {t.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-black text-neutral-900">{t.label}</span>
                            <span className={clsx('text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md', t.badgeBg)}>
                              {t.type === 'rest' ? 'Rest' : 'Run'}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5 leading-snug">{t.desc}</p>
                        </div>
                      </div>

                      <div className={clsx(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-2',
                        isSelected ? 'border-[#FF5500] bg-[#FF5500] text-white' : 'border-neutral-300'
                      )}>
                        {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <ChevronRight className="w-4 h-4 text-neutral-300" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: TARGET JARAK (+ - 0.5 km) */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-black text-neutral-900">2. Target Jarak Lari</h4>
                <p className="text-xs text-neutral-400">Atur jarak dengan tombol + / - (kelipatan 0.5 km) atau pilih jarak cepat</p>
              </div>

              {/* Big Stepper Display */}
              <div className="p-6 rounded-3xl bg-orange-50/50 border border-orange-200/80 text-center space-y-4 shadow-soft-sm">
                <div className="space-y-1">
                  <div className="text-5xl font-black font-mono text-neutral-900 tracking-tight">
                    {distanceKm.toFixed(1)}
                    <span className="text-xl font-bold text-[#FF5500] ml-1">km</span>
                  </div>
                  <p className="text-xs text-neutral-400 font-medium">Jarak Sesi Latihan</p>
                </div>

                {/* Big + and - Buttons */}
                <div className="flex items-center justify-center space-x-6 pt-1">
                  <button
                    type="button"
                    onClick={handleDecrementDistance}
                    className="w-14 h-14 rounded-2xl bg-white border-2 border-neutral-200 hover:border-neutral-400 text-neutral-800 flex items-center justify-center active:scale-90 transition-all shadow-soft-xs text-xl font-black"
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

              {/* Quick Distance Presets (1-click auto-advance to step 3!) */}
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
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
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

          {/* STEP 3: TARGET PACE (5:00 to 10:00 /km) */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-black text-neutral-900">3. Target Pace Lari</h4>
                <p className="text-xs text-neutral-400">Pilih kecepatan target dari pace 5:00 s/d 10:00 /km</p>
              </div>

              {/* Big Pace Display */}
              <div className="p-5 rounded-3xl bg-orange-50/50 border border-orange-200/80 text-center space-y-3 shadow-soft-sm">
                <div className="space-y-1">
                  <div className="text-5xl font-black font-mono text-neutral-900 tracking-tight">
                    {formatPaceText(targetPaceSec)}
                    <span className="text-xl font-bold text-[#FF5500] ml-1">/km</span>
                  </div>
                  <p className="text-xs text-neutral-400 font-medium">Target Pace</p>
                </div>

                {/* Pace Steppers */}
                <div className="flex items-center justify-center space-x-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustPace(-5)}
                    className="px-4 py-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 text-xs font-black text-neutral-800 active:scale-95 shadow-2xs"
                  >
                    - 5s (Cepat)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustPace(5)}
                    className="px-4 py-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 text-xs font-black text-neutral-800 active:scale-95 shadow-2xs"
                  >
                    + 5s (Santai)
                  </button>
                </div>
              </div>

              {/* Quick Pace Presets 5:00 to 10:00 (1-click auto-advance to step 4!) */}
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
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
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

          {/* STEP 4: HEART RATE ZONE (Big Cards -> 1-click auto-advance to step 5!) */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-black text-neutral-900">4. Target Heart Rate Zone</h4>
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
                          ? 'bg-orange-50/70 border-[#FF5500] text-neutral-900 font-bold shadow-2xs ring-2 ring-[#FF5500]/20'
                          : 'bg-white border-neutral-200/90 text-neutral-700 hover:bg-neutral-50'
                      )}
                    >
                      <div>
                        <div className="text-xs font-black text-neutral-900">{z.label}</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">{z.desc}</div>
                      </div>
                      <div className={clsx(
                        'w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2',
                        isSelected ? 'border-[#FF5500] bg-[#FF5500] text-white' : 'border-neutral-300'
                      )}>
                        {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: NAMA SESI & CATATAN (Dedicated Step!) */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-black text-neutral-900">5. Nama Sesi & Catatan Latihan</h4>
                <p className="text-xs text-neutral-400">Lengkapi judul latihan dan instruksi khusus</p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Ringkasan Sesi:</div>
                <div className="flex items-center space-x-2 text-xs font-black text-neutral-800">
                  <span className="px-2 py-0.5 rounded-md bg-orange-100 text-[#FF5500] uppercase text-[10px]">{type}</span>
                  <span>{distanceKm.toFixed(1)} km</span>
                  <span>·</span>
                  <span>Pace {formatPaceText(targetPaceSec)}/km</span>
                  <span>·</span>
                  <span className="text-neutral-500 text-[11px]">{targetHrZone.split(' ')[0]}</span>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1 uppercase tracking-wider">
                    Nama Sesi
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Easy Aerobic Run"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1 uppercase tracking-wider">
                    Instruksi / Catatan Latihan
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: 1km warmup santai, 3km steady tempo @ 5:30/km, 1km cooldown"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-neutral-100 bg-white flex items-center space-x-2.5 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-[max(1rem,env(safe-area-inset-bottom))]">
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
