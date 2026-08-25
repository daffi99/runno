import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import type { Run, RouteData, ExtractedRunData } from '../types/run';
import {
  parseDurationToSeconds,
  parsePaceToSeconds,
  formatDuration,
  formatPace,
  formatDate,
  formatLocalDateKey,
} from '../utils/formatters';
import {
  ChevronLeft,
  Check,
  Compass,
  Sparkles,
  Flame,
  Heart,
  Timer,
  RotateCcw,
  Footprints,
  Zap,
} from 'lucide-react';

interface ReviewRunViewProps {
  screenshotBase64: string | null;
  routeData: RouteData | null;
  extractedData: ExtractedRunData;
  onBack: () => void;
  onSaveRun: (run: Run) => void;
}

const SOURCES = [
  { label: 'Huawei Health', value: 'Huawei Health' },
  { label: 'Amazfit', value: 'Amazfit' },
  { label: 'Zepp', value: 'Zepp' },
  { label: 'Apple Fitness', value: 'Apple Fitness' },
  { label: 'Garmin', value: 'Garmin' },
  { label: 'Strava', value: 'Strava' },
  { label: 'Nike Run Club', value: 'Nike Run Club' },
  { label: 'Coros', value: 'Coros' },
  { label: 'Other', value: 'Other' },
];

export const ReviewRunView: React.FC<ReviewRunViewProps> = ({
  screenshotBase64,
  routeData,
  extractedData,
  onBack,
  onSaveRun,
}) => {
  const [date, setDate] = useState<string>(() => {
    if (extractedData.date) {
      return formatLocalDateKey(extractedData.date);
    }
    return formatLocalDateKey(new Date());
  });
  const [source, setSource] = useState<string>(extractedData.source || 'Huawei Health');
  const [distanceKm, setDistanceKm] = useState<string>(
    extractedData.distance_km !== null && extractedData.distance_km !== undefined
      ? String(extractedData.distance_km)
      : ''
  );
  const [durationStr, setDurationStr] = useState<string>(
    extractedData.duration_seconds !== null && extractedData.duration_seconds !== undefined
      ? formatDuration(extractedData.duration_seconds)
      : ''
  );
  const [paceStr, setPaceStr] = useState<string>(
    extractedData.pace_seconds_per_km !== null && extractedData.pace_seconds_per_km !== undefined
      ? formatPace(extractedData.pace_seconds_per_km, 'metric', false)
      : ''
  );
  const [bestPaceStr, setBestPaceStr] = useState<string>(
    extractedData.best_pace_seconds_per_km !== null && extractedData.best_pace_seconds_per_km !== undefined
      ? formatPace(extractedData.best_pace_seconds_per_km, 'metric', false)
      : ''
  );
  const [avgHr, setAvgHr] = useState<string>(
    extractedData.avg_heart_rate !== null && extractedData.avg_heart_rate !== undefined
      ? String(extractedData.avg_heart_rate)
      : ''
  );
  const [maxHr, setMaxHr] = useState<string>(
    extractedData.max_heart_rate !== null && extractedData.max_heart_rate !== undefined
      ? String(extractedData.max_heart_rate)
      : ''
  );
  const [cadence, setCadence] = useState<string>(
    extractedData.cadence !== null && extractedData.cadence !== undefined
      ? String(extractedData.cadence)
      : ''
  );
  const [maxCadence, setMaxCadence] = useState<string>(
    extractedData.max_cadence !== null && extractedData.max_cadence !== undefined
      ? String(extractedData.max_cadence)
      : ''
  );
  const [totalSteps, setTotalSteps] = useState<string>(
    extractedData.total_steps !== null && extractedData.total_steps !== undefined
      ? String(extractedData.total_steps)
      : ''
  );
  const [strideLength, setStrideLength] = useState<string>(
    extractedData.stride_length_cm !== null && extractedData.stride_length_cm !== undefined
      ? String(extractedData.stride_length_cm)
      : ''
  );
  const [gct, setGct] = useState<string>(
    extractedData.ground_contact_time_ms !== null && extractedData.ground_contact_time_ms !== undefined
      ? String(extractedData.ground_contact_time_ms)
      : ''
  );
  const [vertOsc, setVertOsc] = useState<string>(
    extractedData.vertical_oscillation_cm !== null && extractedData.vertical_oscillation_cm !== undefined
      ? String(extractedData.vertical_oscillation_cm)
      : ''
  );
  const [balance, setBalance] = useState<string>(
    extractedData.ground_contact_balance || ''
  );
  const [aerobicTe, setAerobicTe] = useState<string>(
    extractedData.aerobic_te !== null && extractedData.aerobic_te !== undefined
      ? String(extractedData.aerobic_te)
      : ''
  );
  const [vo2max, setVo2max] = useState<string>(
    extractedData.vo2max !== null && extractedData.vo2max !== undefined
      ? String(extractedData.vo2max)
      : ''
  );
  const [trainingLoad, setTrainingLoad] = useState<string>(
    extractedData.training_load !== null && extractedData.training_load !== undefined
      ? String(extractedData.training_load)
      : ''
  );
  const [recoveryHours, setRecoveryHours] = useState<string>(
    extractedData.recovery_hours !== null && extractedData.recovery_hours !== undefined
      ? String(extractedData.recovery_hours)
      : ''
  );
  const [elevGain, setElevGain] = useState<string>(
    extractedData.elevation_gain_m !== null && extractedData.elevation_gain_m !== undefined
      ? String(extractedData.elevation_gain_m)
      : ''
  );
  const [elevLoss, setElevLoss] = useState<string>(
    extractedData.elevation_loss_m !== null && extractedData.elevation_loss_m !== undefined
      ? String(extractedData.elevation_loss_m)
      : ''
  );
  const [calories, setCalories] = useState<string>(
    extractedData.calories !== null && extractedData.calories !== undefined
      ? String(extractedData.calories)
      : ''
  );
  const [activeCalories, setActiveCalories] = useState<string>(
    extractedData.active_calories !== null && extractedData.active_calories !== undefined
      ? String(extractedData.active_calories)
      : ''
  );

  const [formError, setFormError] = useState<string | null>(null);

  const handleSave = () => {
    const distNum = parseFloat(distanceKm);
    if (isNaN(distNum) || distNum <= 0) {
      setFormError('Please enter a valid distance in kilometers.');
      return;
    }

    const durationSec = parseDurationToSeconds(durationStr);
    if (!durationSec || durationSec <= 0) {
      setFormError('Please enter a valid duration (e.g. 01:01:40 or 45:20).');
      return;
    }

    let paceSec = parsePaceToSeconds(paceStr);
    if (!paceSec && distNum > 0) {
      paceSec = Math.round(durationSec / distNum);
    }

    const bestPaceSec = parsePaceToSeconds(bestPaceStr);
    const avgSpeed = Number(((distNum / durationSec) * 3600).toFixed(2));

    const finalRun: Run = {
      id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: `${formatLocalDateKey(date)}T08:00:00`,
      source,
      workout_type: (extractedData.workout_type as any) || 'outdoor',
      distance_km: distNum,
      duration_seconds: durationSec,
      pace_seconds_per_km: paceSec,
      best_pace_seconds_per_km: bestPaceSec,
      avg_speed_kmh: avgSpeed,
      avg_heart_rate: avgHr ? parseInt(avgHr, 10) : null,
      max_heart_rate: maxHr ? parseInt(maxHr, 10) : null,
      cadence: cadence ? parseInt(cadence, 10) : null,
      max_cadence: maxCadence ? parseInt(maxCadence, 10) : null,
      total_steps: totalSteps ? parseInt(totalSteps, 10) : null,
      stride_length_cm: strideLength ? parseFloat(strideLength) : null,
      ground_contact_time_ms: gct ? parseInt(gct, 10) : null,
      vertical_oscillation_cm: vertOsc ? parseFloat(vertOsc) : null,
      ground_contact_balance: balance || null,
      aerobic_te: aerobicTe ? parseFloat(aerobicTe) : null,
      vo2max: vo2max ? parseFloat(vo2max) : null,
      training_load: trainingLoad ? parseFloat(trainingLoad) : null,
      recovery_hours: recoveryHours ? parseInt(recoveryHours, 10) : null,
      elevation_gain_m: elevGain ? parseInt(elevGain, 10) : null,
      elevation_loss_m: elevLoss ? parseInt(elevLoss, 10) : null,
      calories: calories ? parseInt(calories, 10) : null,
      active_calories: activeCalories ? parseInt(activeCalories, 10) : null,
      splits: extractedData.splits || null,
      elevationPoints: extractedData.elevationPoints || (extractedData as any).elevation_points || null,
      heart_rate_zones: extractedData.heart_rate_zones || null,
      screenshot_url: screenshotBase64,
      route_data: routeData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSaveRun(finalRun);
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-32 space-y-5">
      <div className="flex items-center space-x-3 pt-2">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Review & Save Run</h1>
      </div>

      {/* Top Preview Card */}
      <Card className="p-4 bg-[#1E1E1E] text-white rounded-3xl overflow-hidden shadow-soft-lg relative border border-white/5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-white tracking-tight font-mono">
                {distanceKm || '--'}
              </span>
              <span className="text-xs font-bold text-neutral-400">km</span>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium">Outdoor running</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-neutral-300 block">{source || 'Running Workout'}</span>
            <span className="text-[10px] text-neutral-400 block">{formatDate(date)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5 text-xs">
          <div className="flex items-center space-x-2 text-neutral-300">
            <Timer className="w-4 h-4 text-neutral-400" />
            <div>
              <span className="font-mono font-bold text-white block">
                {durationStr || '--:--'}
              </span>
              <span className="text-[9px] text-neutral-400 block -mt-0.5">Workout time</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-neutral-300">
            <Flame className="w-4 h-4 text-orange-400" />
            <div>
              <span className="font-mono font-bold text-white block">
                {calories ? `${calories} kcal` : '-- kcal'}
              </span>
              <span className="text-[9px] text-neutral-400 block -mt-0.5">Total calories</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-neutral-300 mt-1">
            <RotateCcw className="w-4 h-4 text-neutral-400" />
            <div>
              <span className="font-mono font-bold text-white block">{paceStr || '--:--'}</span>
              <span className="text-[9px] text-neutral-400 block -mt-0.5">Avg pace</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-neutral-300 mt-1">
            <Heart className="w-4 h-4 text-rose-500" />
            <div>
              <span className="font-mono font-bold text-white block">
                {avgHr ? `${avgHr} bpm` : '-- bpm'}
              </span>
              <span className="text-[9px] text-neutral-400 block -mt-0.5">Avg heart rate</span>
            </div>
          </div>
        </div>

        {/* Extra Huawei Health badges if available */}
        {(aerobicTe || totalSteps || vo2max) && (
          <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-white/5 text-[11px] text-neutral-300">
            {totalSteps && (
              <div>
                <span className="text-[9px] text-neutral-400 block">Steps</span>
                <span className="font-bold text-white font-mono">{Number(totalSteps).toLocaleString()}</span>
              </div>
            )}
            {aerobicTe && (
              <div>
                <span className="text-[9px] text-neutral-400 block">Training Effect</span>
                <span className="font-bold text-emerald-400 font-mono">{aerobicTe}</span>
              </div>
            )}
            {vo2max && (
              <div>
                <span className="text-[9px] text-neutral-400 block">VO2Max</span>
                <span className="font-bold text-cyan-400 font-mono">{vo2max}</span>
              </div>
            )}
          </div>
        )}

        {routeData && (
          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span className="flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Route attached ({routeData.coordinates.length} GPS points)</span>
            </span>
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
        )}
      </Card>

      {/* Extracted Data Form */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-base font-bold text-white">Extracted Data</h2>
        <span className="text-xs font-semibold text-[#FF5500]">Edit all</span>
      </div>

      {formError && (
        <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
          {formError}
        </div>
      )}

      {/* Primary Section */}
      <Card className="p-4 sm:p-5 space-y-4 bg-[#1E1E1E] border border-white/5">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block pb-1 border-b border-white/5">
          Core Workout
        </span>

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <Select
          label="Source"
          value={source}
          options={SOURCES}
          onChange={(e) => setSource(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Distance"
            type="number"
            step="0.01"
            placeholder="e.g. 6.50"
            value={distanceKm}
            suffix="km"
            onChange={(e) => setDistanceKm(e.target.value)}
          />

          <Input
            label="Duration"
            type="text"
            placeholder="01:01:40"
            value={durationStr}
            suffix="hh:mm:ss"
            onChange={(e) => setDurationStr(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Avg Pace"
            type="text"
            placeholder="e.g. 9:29"
            value={paceStr}
            suffix="min/km"
            onChange={(e) => setPaceStr(e.target.value)}
          />

          <Input
            label="Best Pace"
            type="text"
            placeholder="e.g. 7:29"
            value={bestPaceStr}
            suffix="min/km"
            onChange={(e) => setBestPaceStr(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Avg Heart Rate"
            type="number"
            placeholder="Not available"
            value={avgHr}
            suffix="bpm"
            onChange={(e) => setAvgHr(e.target.value)}
          />

          <Input
            label="Max Heart Rate"
            type="number"
            placeholder="Not available"
            value={maxHr}
            suffix="bpm"
            onChange={(e) => setMaxHr(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Avg Cadence"
            type="number"
            placeholder="Not available"
            value={cadence}
            suffix="spm"
            onChange={(e) => setCadence(e.target.value)}
          />

          <Input
            label="Max Cadence"
            type="number"
            placeholder="Not available"
            value={maxCadence}
            suffix="spm"
            onChange={(e) => setMaxCadence(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Total Calories"
            type="number"
            placeholder="Not available"
            value={calories}
            suffix="kcal"
            onChange={(e) => setCalories(e.target.value)}
          />

          <Input
            label="Active Calories"
            type="number"
            placeholder="Not available"
            value={activeCalories}
            suffix="kcal"
            onChange={(e) => setActiveCalories(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Elevation Gain"
            type="number"
            placeholder="Not available"
            value={elevGain}
            suffix="m"
            onChange={(e) => setElevGain(e.target.value)}
          />

          <Input
            label="Elevation Loss"
            type="number"
            placeholder="Not available"
            value={elevLoss}
            suffix="m"
            onChange={(e) => setElevLoss(e.target.value)}
          />
        </div>
      </Card>

      {/* Advanced Huawei Health & Running Dynamics Section */}
      <Card className="p-4 sm:p-5 space-y-4 bg-[#1E1E1E] border border-white/5">
        <div className="flex items-center space-x-2 pb-1 border-b border-white/5">
          <Footprints className="w-4 h-4 text-[#FF5500]" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            Running Dynamics & Form
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Total Steps"
            type="number"
            placeholder="e.g. 9074"
            value={totalSteps}
            suffix="steps"
            onChange={(e) => setTotalSteps(e.target.value)}
          />

          <Input
            label="Stride Length"
            type="number"
            step="0.1"
            placeholder="e.g. 121"
            value={strideLength}
            suffix="cm"
            onChange={(e) => setStrideLength(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ground Contact Time"
            type="number"
            placeholder="e.g. 333"
            value={gct}
            suffix="ms"
            onChange={(e) => setGct(e.target.value)}
          />

          <Input
            label="Vertical Oscillation"
            type="number"
            step="0.1"
            placeholder="e.g. 9.7"
            value={vertOsc}
            suffix="cm"
            onChange={(e) => setVertOsc(e.target.value)}
          />
        </div>

        <Input
          label="Ground Contact Balance"
          type="text"
          placeholder="e.g. 49.9% L / 50.1% R"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />
      </Card>

      {/* Performance & Recovery Section */}
      <Card className="p-4 sm:p-5 space-y-4 bg-[#1E1E1E] border border-white/5">
        <div className="flex items-center space-x-2 pb-1 border-b border-white/5">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            Performance & Recovery
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Aerobic Training Effect"
            type="number"
            step="0.1"
            placeholder="e.g. 3.2"
            value={aerobicTe}
            suffix="TE"
            onChange={(e) => setAerobicTe(e.target.value)}
          />

          <Input
            label="VO2Max"
            type="number"
            step="0.1"
            placeholder="e.g. 57.4"
            value={vo2max}
            suffix="ml/kg/min"
            onChange={(e) => setVo2max(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Training Load"
            type="number"
            step="0.1"
            placeholder="e.g. 68.5"
            value={trainingLoad}
            onChange={(e) => setTrainingLoad(e.target.value)}
          />

          <Input
            label="Recovery Time"
            type="number"
            placeholder="e.g. 40"
            value={recoveryHours}
            suffix="hrs"
            onChange={(e) => setRecoveryHours(e.target.value)}
          />
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#111111]/95 backdrop-blur-md border-t border-white/5 safe-pb z-40">
        <div className="max-w-md mx-auto">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSave}
            className="text-base font-bold shadow-glow-orange"
          >
            Save Run
          </Button>
        </div>
      </div>
    </div>
  );
};
