import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { parseDurationToSeconds, parsePaceToSeconds, formatDuration, formatPace, } from '../utils/formatters';
import { ChevronLeft, Check, Compass, Sparkles, Flame, Heart, Timer, RotateCcw, Footprints, Zap, } from 'lucide-react';
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
export const ReviewRunView = ({ screenshotBase64, routeData, extractedData, onBack, onSaveRun, }) => {
    const [date, setDate] = useState(extractedData.date ? extractedData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    const [source, setSource] = useState(extractedData.source || 'Huawei Health');
    const [distanceKm, setDistanceKm] = useState(extractedData.distance_km !== null && extractedData.distance_km !== undefined
        ? String(extractedData.distance_km)
        : '');
    const [durationStr, setDurationStr] = useState(extractedData.duration_seconds !== null && extractedData.duration_seconds !== undefined
        ? formatDuration(extractedData.duration_seconds)
        : '');
    const [paceStr, setPaceStr] = useState(extractedData.pace_seconds_per_km !== null && extractedData.pace_seconds_per_km !== undefined
        ? formatPace(extractedData.pace_seconds_per_km, 'metric', false)
        : '');
    const [bestPaceStr, setBestPaceStr] = useState(extractedData.best_pace_seconds_per_km !== null && extractedData.best_pace_seconds_per_km !== undefined
        ? formatPace(extractedData.best_pace_seconds_per_km, 'metric', false)
        : '');
    const [avgHr, setAvgHr] = useState(extractedData.avg_heart_rate !== null && extractedData.avg_heart_rate !== undefined
        ? String(extractedData.avg_heart_rate)
        : '');
    const [maxHr, setMaxHr] = useState(extractedData.max_heart_rate !== null && extractedData.max_heart_rate !== undefined
        ? String(extractedData.max_heart_rate)
        : '');
    const [cadence, setCadence] = useState(extractedData.cadence !== null && extractedData.cadence !== undefined
        ? String(extractedData.cadence)
        : '');
    const [maxCadence, setMaxCadence] = useState(extractedData.max_cadence !== null && extractedData.max_cadence !== undefined
        ? String(extractedData.max_cadence)
        : '');
    const [totalSteps, setTotalSteps] = useState(extractedData.total_steps !== null && extractedData.total_steps !== undefined
        ? String(extractedData.total_steps)
        : '');
    const [strideLength, setStrideLength] = useState(extractedData.stride_length_cm !== null && extractedData.stride_length_cm !== undefined
        ? String(extractedData.stride_length_cm)
        : '');
    const [gct, setGct] = useState(extractedData.ground_contact_time_ms !== null && extractedData.ground_contact_time_ms !== undefined
        ? String(extractedData.ground_contact_time_ms)
        : '');
    const [vertOsc, setVertOsc] = useState(extractedData.vertical_oscillation_cm !== null && extractedData.vertical_oscillation_cm !== undefined
        ? String(extractedData.vertical_oscillation_cm)
        : '');
    const [balance, setBalance] = useState(extractedData.ground_contact_balance || '');
    const [aerobicTe, setAerobicTe] = useState(extractedData.aerobic_te !== null && extractedData.aerobic_te !== undefined
        ? String(extractedData.aerobic_te)
        : '');
    const [vo2max, setVo2max] = useState(extractedData.vo2max !== null && extractedData.vo2max !== undefined
        ? String(extractedData.vo2max)
        : '');
    const [trainingLoad, setTrainingLoad] = useState(extractedData.training_load !== null && extractedData.training_load !== undefined
        ? String(extractedData.training_load)
        : '');
    const [recoveryHours, setRecoveryHours] = useState(extractedData.recovery_hours !== null && extractedData.recovery_hours !== undefined
        ? String(extractedData.recovery_hours)
        : '');
    const [elevGain, setElevGain] = useState(extractedData.elevation_gain_m !== null && extractedData.elevation_gain_m !== undefined
        ? String(extractedData.elevation_gain_m)
        : '');
    const [elevLoss, setElevLoss] = useState(extractedData.elevation_loss_m !== null && extractedData.elevation_loss_m !== undefined
        ? String(extractedData.elevation_loss_m)
        : '');
    const [calories, setCalories] = useState(extractedData.calories !== null && extractedData.calories !== undefined
        ? String(extractedData.calories)
        : '');
    const [activeCalories, setActiveCalories] = useState(extractedData.active_calories !== null && extractedData.active_calories !== undefined
        ? String(extractedData.active_calories)
        : '');
    const [formError, setFormError] = useState(null);
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
        const finalRun = {
            id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            date: `${date}T08:00:00`,
            source,
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
            elevationPoints: extractedData.elevationPoints || extractedData.elevation_points || null,
            heart_rate_zones: extractedData.heart_rate_zones || null,
            screenshot_url: screenshotBase64,
            route_data: routeData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        onSaveRun(finalRun);
    };
    return (_jsxs("div", { className: "max-w-md mx-auto px-4 pt-4 pb-32 space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between pt-2", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("button", { onClick: onBack, className: "p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-700 transition-colors", "aria-label": "Back", children: _jsx(ChevronLeft, { className: "w-6 h-6" }) }), _jsx("h1", { className: "text-xl font-bold text-neutral-900", children: "Review Run" })] }), _jsxs("div", { className: "flex items-center text-xs font-semibold text-[#FF5500] bg-orange-50 px-2.5 py-1 rounded-full", children: [_jsx(Sparkles, { className: "w-3.5 h-3.5 mr-1" }), "AI Extracted"] })] }), _jsxs(Card, { className: "p-4 bg-neutral-900 text-white rounded-3xl overflow-hidden shadow-soft-lg relative", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-baseline space-x-1.5", children: [_jsx("span", { className: "text-3xl font-black text-white tracking-tight font-mono", children: distanceKm || '6.50' }), _jsx("span", { className: "text-xs font-bold text-neutral-400", children: "km" })] }), _jsx("p", { className: "text-[11px] text-neutral-400 font-medium", children: "Outdoor running" })] }), _jsxs("div", { className: "text-right", children: [_jsx("span", { className: "text-xs font-bold text-neutral-300 block", children: source }), _jsx("span", { className: "text-[10px] text-neutral-400 block", children: date })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-neutral-800 text-xs", children: [_jsxs("div", { className: "flex items-center space-x-2 text-neutral-300", children: [_jsx(Timer, { className: "w-4 h-4 text-neutral-400" }), _jsxs("div", { children: [_jsx("span", { className: "font-mono font-bold text-white block", children: durationStr || '01:01:40' }), _jsx("span", { className: "text-[9px] text-neutral-400 block -mt-0.5", children: "Workout time" })] })] }), _jsxs("div", { className: "flex items-center space-x-2 text-neutral-300", children: [_jsx(Flame, { className: "w-4 h-4 text-orange-400" }), _jsxs("div", { children: [_jsx("span", { className: "font-mono font-bold text-white block", children: calories ? `${calories} kcal` : '658 kcal' }), _jsx("span", { className: "text-[9px] text-neutral-400 block -mt-0.5", children: "Total calories" })] })] }), _jsxs("div", { className: "flex items-center space-x-2 text-neutral-300 mt-1", children: [_jsx(RotateCcw, { className: "w-4 h-4 text-neutral-400" }), _jsxs("div", { children: [_jsx("span", { className: "font-mono font-bold text-white block", children: paceStr || '9:29"' }), _jsx("span", { className: "text-[9px] text-neutral-400 block -mt-0.5", children: "Avg pace" })] })] }), _jsxs("div", { className: "flex items-center space-x-2 text-neutral-300 mt-1", children: [_jsx(Heart, { className: "w-4 h-4 text-rose-500" }), _jsxs("div", { children: [_jsx("span", { className: "font-mono font-bold text-white block", children: avgHr ? `${avgHr} bpm` : '153 bpm' }), _jsx("span", { className: "text-[9px] text-neutral-400 block -mt-0.5", children: "Avg heart rate" })] })] })] }), (aerobicTe || totalSteps || vo2max) && (_jsxs("div", { className: "grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-neutral-800 text-[11px] text-neutral-300", children: [totalSteps && (_jsxs("div", { children: [_jsx("span", { className: "text-[9px] text-neutral-400 block", children: "Steps" }), _jsx("span", { className: "font-bold text-white font-mono", children: Number(totalSteps).toLocaleString() })] })), aerobicTe && (_jsxs("div", { children: [_jsx("span", { className: "text-[9px] text-neutral-400 block", children: "Training Effect" }), _jsx("span", { className: "font-bold text-emerald-400 font-mono", children: aerobicTe })] })), vo2max && (_jsxs("div", { children: [_jsx("span", { className: "text-[9px] text-neutral-400 block", children: "VO2Max" }), _jsx("span", { className: "font-bold text-cyan-400 font-mono", children: vo2max })] }))] })), routeData && (_jsxs("div", { className: "mt-3 pt-2.5 border-t border-neutral-800 flex items-center justify-between text-xs text-emerald-400 font-medium", children: [_jsxs("span", { className: "flex items-center space-x-1.5", children: [_jsx(Compass, { className: "w-3.5 h-3.5" }), _jsxs("span", { children: ["Route attached (", routeData.coordinates.length, " GPS points)"] })] }), _jsx(Check, { className: "w-4 h-4 text-emerald-400" })] }))] }), _jsxs("div", { className: "flex items-center justify-between pt-1", children: [_jsx("h2", { className: "text-base font-bold text-neutral-900", children: "Extracted Data" }), _jsx("span", { className: "text-xs font-semibold text-[#FF5500]", children: "Edit all" })] }), formError && (_jsx("div", { className: "p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs", children: formError })), _jsxs(Card, { className: "p-4 sm:p-5 space-y-4 bg-white border border-neutral-200/80", children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-400 block pb-1 border-b border-neutral-100", children: "Core Workout" }), _jsx(Input, { label: "Date", type: "date", value: date, onChange: (e) => setDate(e.target.value) }), _jsx(Select, { label: "Source", value: source, options: SOURCES, onChange: (e) => setSource(e.target.value) }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "Distance", type: "number", step: "0.01", placeholder: "e.g. 6.50", value: distanceKm, suffix: "km", onChange: (e) => setDistanceKm(e.target.value) }), _jsx(Input, { label: "Duration", type: "text", placeholder: "01:01:40", value: durationStr, suffix: "hh:mm:ss", onChange: (e) => setDurationStr(e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "Avg Pace", type: "text", placeholder: "e.g. 9:29", value: paceStr, suffix: "min/km", onChange: (e) => setPaceStr(e.target.value) }), _jsx(Input, { label: "Best Pace", type: "text", placeholder: "e.g. 7:29", value: bestPaceStr, suffix: "min/km", onChange: (e) => setBestPaceStr(e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "Avg Heart Rate", type: "number", placeholder: "Not available", value: avgHr, suffix: "bpm", onChange: (e) => setAvgHr(e.target.value) }), _jsx(Input, { label: "Max Heart Rate", type: "number", placeholder: "Not available", value: maxHr, suffix: "bpm", onChange: (e) => setMaxHr(e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "Avg Cadence", type: "number", placeholder: "Not available", value: cadence, suffix: "spm", onChange: (e) => setCadence(e.target.value) }), _jsx(Input, { label: "Max Cadence", type: "number", placeholder: "Not available", value: maxCadence, suffix: "spm", onChange: (e) => setMaxCadence(e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "Total Calories", type: "number", placeholder: "Not available", value: calories, suffix: "kcal", onChange: (e) => setCalories(e.target.value) }), _jsx(Input, { label: "Active Calories", type: "number", placeholder: "Not available", value: activeCalories, suffix: "kcal", onChange: (e) => setActiveCalories(e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "Elevation Gain", type: "number", placeholder: "Not available", value: elevGain, suffix: "m", onChange: (e) => setElevGain(e.target.value) }), _jsx(Input, { label: "Elevation Loss", type: "number", placeholder: "Not available", value: elevLoss, suffix: "m", onChange: (e) => setElevLoss(e.target.value) })] })] }), _jsxs(Card, { className: "p-4 sm:p-5 space-y-4 bg-white border border-neutral-200/80", children: [_jsxs("div", { className: "flex items-center space-x-2 pb-1 border-b border-neutral-100", children: [_jsx(Footprints, { className: "w-4 h-4 text-[#FF5500]" }), _jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-700", children: "Running Dynamics & Form" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "Total Steps", type: "number", placeholder: "e.g. 9074", value: totalSteps, suffix: "steps", onChange: (e) => setTotalSteps(e.target.value) }), _jsx(Input, { label: "Stride Length", type: "number", step: "0.1", placeholder: "e.g. 121", value: strideLength, suffix: "cm", onChange: (e) => setStrideLength(e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "Ground Contact Time", type: "number", placeholder: "e.g. 333", value: gct, suffix: "ms", onChange: (e) => setGct(e.target.value) }), _jsx(Input, { label: "Vertical Oscillation", type: "number", step: "0.1", placeholder: "e.g. 9.7", value: vertOsc, suffix: "cm", onChange: (e) => setVertOsc(e.target.value) })] }), _jsx(Input, { label: "Ground Contact Balance", type: "text", placeholder: "e.g. 49.9% L / 50.1% R", value: balance, onChange: (e) => setBalance(e.target.value) })] }), _jsxs(Card, { className: "p-4 sm:p-5 space-y-4 bg-white border border-neutral-200/80", children: [_jsxs("div", { className: "flex items-center space-x-2 pb-1 border-b border-neutral-100", children: [_jsx(Zap, { className: "w-4 h-4 text-amber-500" }), _jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-700", children: "Performance & Recovery" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "Aerobic Training Effect", type: "number", step: "0.1", placeholder: "e.g. 3.2", value: aerobicTe, suffix: "TE", onChange: (e) => setAerobicTe(e.target.value) }), _jsx(Input, { label: "VO2Max", type: "number", step: "0.1", placeholder: "e.g. 57.4", value: vo2max, suffix: "ml/kg/min", onChange: (e) => setVo2max(e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Input, { label: "Training Load", type: "number", step: "0.1", placeholder: "e.g. 68.5", value: trainingLoad, onChange: (e) => setTrainingLoad(e.target.value) }), _jsx(Input, { label: "Recovery Time", type: "number", placeholder: "e.g. 40", value: recoveryHours, suffix: "hrs", onChange: (e) => setRecoveryHours(e.target.value) })] })] }), _jsx("div", { className: "fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 safe-pb z-40", children: _jsx("div", { className: "max-w-md mx-auto", children: _jsx(Button, { variant: "primary", size: "lg", fullWidth: true, onClick: handleSave, className: "text-base font-bold shadow-glow-orange", children: "Save Run" }) }) })] }));
};
