import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { parseGpx } from '../utils/gpx';
import { compressImage } from '../utils/image';
import type { RouteData, ExtractedRunData, Run } from '../types/run';
import { storageService } from '../services/storage';
import { normalizeSourceName } from '../utils/formatters';
import {
  ChevronLeft,
  Image as ImageIcon,
  Compass,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  Layers,
  Clipboard,
  ChevronDown,
  Check,
  Timer,
  Activity,
  Zap,
  FileCode,
} from 'lucide-react';
import { clsx } from 'clsx';

export type OCRModelKey = 'nvidia' | 'dots' | 'gemini';

export interface OCRModelOption {
  id: OCRModelKey;
  iconSrc: string;
  name: string;
  desc: string;
  badge: string;
}

export const OCR_MODELS: OCRModelOption[] = [
  {
    id: 'nvidia',
    iconSrc: '/models/nvidia.png',
    name: 'NVIDIA Nemotron',
    desc: 'Default · Free & Reasoning',
    badge: 'Free',
  },
  {
    id: 'dots',
    iconSrc: '/models/dots.png',
    name: 'Dots 3 Note',
    desc: 'Fast · Free Tier',
    badge: 'Free',
  },
  {
    id: 'gemini',
    iconSrc: '/models/gemini.png',
    name: 'Gemini 2.5 Flash',
    desc: 'Google · Ultra Fast',
    badge: 'Flash',
  },
];

interface AddRunViewProps {
  onBack: () => void;
  onAnalysisComplete: (payload: {
    screenshotBase64: string | null;
    routeData: RouteData | null;
    extractedData: ExtractedRunData;
  }) => void;
  customApiKey?: string;
}

export const AddRunView: React.FC<AddRunViewProps> = ({
  onBack,
  onAnalysisComplete,
  customApiKey,
}) => {
  const [selectedModelId, setSelectedModelId] = useState<OCRModelKey>(() => {
    try {
      const saved = localStorage.getItem('runno_ocr_model') as OCRModelKey;
      if (saved === 'nvidia' || saved === 'dots' || saved === 'gemini') {
        return saved;
      }
    } catch (_) {}
    return 'nvidia'; // Default: NVIDIA Nemotron
  });
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);

  const activeModelOption = useMemo(() => {
    return OCR_MODELS.find((m) => m.id === selectedModelId) || OCR_MODELS[0];
  }, [selectedModelId]);

  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const stopwatchIntervalRef = useRef<any>(null);

  // Vision Pre-flight Diagnostics State
  const [isTestingVision, setIsTestingVision] = useState<boolean>(false);
  const [visionTestResult, setVisionTestResult] = useState<{
    success: boolean;
    durationMs?: number;
    message?: string;
    error?: string;
  } | null>(null);

  const handleTestVision = async () => {
    setIsTestingVision(true);
    setVisionTestResult(null);
    try {
      const res = await fetch('/api/test-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModelId,
          customApiKey: customApiKey || undefined,
        }),
      });
      const data = await res.json();
      setVisionTestResult({
        success: data.success === true,
        durationMs: data.durationMs,
        message: data.message,
        error: data.error,
      });
    } catch (err: any) {
      setVisionTestResult({
        success: false,
        error: err.message || 'Connection timeout or network error',
      });
    } finally {
      setIsTestingVision(false);
    }
  };


  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [intervalScreenshotFile, setIntervalScreenshotFile] = useState<File | null>(null);
  const [intervalScreenshotPreview, setIntervalScreenshotPreview] = useState<string | null>(null);

  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [parsedRoute, setParsedRoute] = useState<RouteData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('Preparing upload...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clipboardToast, setClipboardToast] = useState<string | null>(null);


  const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false);
  const [isDraggingInterval, setIsDraggingInterval] = useState<boolean>(false);
  const [isDraggingGpx, setIsDraggingGpx] = useState<boolean>(false);
  const [isDraggingJson, setIsDraggingJson] = useState<boolean>(false);

  const [isJsonPasteModalOpen, setIsJsonPasteModalOpen] = useState<boolean>(false);
  const [jsonRawInput, setJsonRawInput] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccessMessage, setJsonSuccessMessage] = useState<string | null>(null);

  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const intervalInputRef = useRef<HTMLInputElement>(null);
  const gpxInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleSingleRunImport = (single: any) => {
    const extracted: ExtractedRunData = {
      date: single.date || new Date().toISOString(),
      source: normalizeSourceName(single.source || 'Huawei Health'),
      distance_km: single.distance_km != null ? Number(single.distance_km) : null,
      duration_seconds: single.duration_seconds != null ? Number(single.duration_seconds) : null,
      pace_seconds_per_km: single.pace_seconds_per_km != null ? Number(single.pace_seconds_per_km) : null,
      best_pace_seconds_per_km: single.best_pace_seconds_per_km != null ? Number(single.best_pace_seconds_per_km) : null,
      avg_speed_kmh: single.avg_speed_kmh != null ? Number(single.avg_speed_kmh) : null,
      avg_heart_rate: single.avg_heart_rate != null ? Number(single.avg_heart_rate) : null,
      max_heart_rate: single.max_heart_rate != null ? Number(single.max_heart_rate) : null,
      cadence: single.cadence != null ? Number(single.cadence) : null,
      max_cadence: single.max_cadence != null ? Number(single.max_cadence) : null,
      elevation_gain_m: single.elevation_gain_m != null ? Number(single.elevation_gain_m) : null,
      elevation_loss_m: single.elevation_loss_m != null ? Number(single.elevation_loss_m) : null,
      calories: single.calories != null ? Number(single.calories) : null,
      active_calories: single.active_calories != null ? Number(single.active_calories) : null,
      total_steps: single.total_steps != null ? Number(single.total_steps) : null,
      stride_length_cm: single.stride_length_cm != null ? Number(single.stride_length_cm) : null,
      ground_contact_time_ms: single.ground_contact_time_ms != null ? Number(single.ground_contact_time_ms) : null,
      vertical_oscillation_cm: single.vertical_oscillation_cm != null ? Number(single.vertical_oscillation_cm) : null,
      ground_contact_balance: single.ground_contact_balance || null,
      aerobic_te: single.aerobic_te != null ? Number(single.aerobic_te) : null,
      anaerobic_te: single.anaerobic_te != null ? Number(single.anaerobic_te) : null,
      vo2max: single.vo2max != null ? Number(single.vo2max) : null,
      training_load: single.training_load != null ? Number(single.training_load) : null,
      recovery_hours: single.recovery_hours != null ? Number(single.recovery_hours) : null,
      splits: single.splits || single.route?.splits || null,
      elevationPoints: single.elevationPoints || null,
      heart_rate_zones: single.heart_rate_zones || null,
      raw_notes: single.raw_notes || null,
    };

    const routeData: RouteData | null = single.route_data || single.route || null;

    onAnalysisComplete({
      screenshotBase64: single.screenshot || null,
      routeData,
      extractedData: extracted,
    });
  };

  const processJsonText = async (jsonString: string) => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonString.trim());

      // Case 1: Runno export format or object with { runs: [...] }
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.runs)) {
        const rawRuns: any[] = parsed.runs;
        if (rawRuns.length === 0) {
          setJsonError('File JSON tidak memiliki data lari di dalam array "runs".');
          return;
        }
        if (rawRuns.length === 1) {
          handleSingleRunImport(rawRuns[0]);
          return;
        }
        for (const r of rawRuns) {
          if (r && (r.distance_km || r.duration_seconds)) {
            const formatted: Run = {
              id: r.id || `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              date: r.date || new Date().toISOString(),
              source: normalizeSourceName(r.source || 'Huawei Health'),
              distance_km: Number(r.distance_km) || 0,
              duration_seconds: Number(r.duration_seconds) || 0,
              pace_seconds_per_km: r.pace_seconds_per_km || (r.distance_km && r.duration_seconds ? Math.round(r.duration_seconds / r.distance_km) : null),
              best_pace_seconds_per_km: r.best_pace_seconds_per_km || null,
              avg_speed_kmh: r.avg_speed_kmh || (r.distance_km && r.duration_seconds ? Number(((r.distance_km / (r.duration_seconds / 3600))).toFixed(2)) : null),
              avg_heart_rate: r.avg_heart_rate || null,
              max_heart_rate: r.max_heart_rate || null,
              cadence: r.cadence || null,
              max_cadence: r.max_cadence || null,
              elevation_gain_m: r.elevation_gain_m || null,
              elevation_loss_m: r.elevation_loss_m || null,
              calories: r.calories || null,
              active_calories: r.active_calories || null,
              total_steps: r.total_steps || null,
              stride_length_cm: r.stride_length_cm || null,
              ground_contact_time_ms: r.ground_contact_time_ms || null,
              vertical_oscillation_cm: r.vertical_oscillation_cm || null,
              ground_contact_balance: r.ground_contact_balance || null,
              aerobic_te: r.aerobic_te || null,
              anaerobic_te: r.anaerobic_te || null,
              vo2max: r.vo2max || null,
              training_load: r.training_load || null,
              recovery_hours: r.recovery_hours || null,
              route_data: r.route || r.route_data || null,
              splits: r.splits || r.route?.splits || null,
              elevationPoints: r.elevationPoints || null,
              heart_rate_zones: r.heart_rate_zones || null,
              extra_metrics: r.extra_metrics || (r.raw_notes ? { raw_notes: r.raw_notes } : null),
              created_at: r.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            await storageService.saveRun(formatted);
          }
        }
        if (parsed.active_plan) {
          storageService.saveActivePlan(parsed.active_plan);
        }
        setIsJsonPasteModalOpen(false);
        setJsonSuccessMessage(`Berhasil mengimpor ${rawRuns.length} aktivitas lari!`);
        setTimeout(() => {
          onBack();
        }, 1200);
        return;
      }

      // Case 2: Direct array of runs [ { ... }, { ... } ]
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          setJsonError('Array JSON kosong.');
          return;
        }
        if (parsed.length === 1) {
          handleSingleRunImport(parsed[0]);
          return;
        }
        for (const r of parsed) {
          if (r && (r.distance_km || r.duration_seconds)) {
            const formatted: Run = {
              id: r.id || `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              date: r.date || new Date().toISOString(),
              source: normalizeSourceName(r.source || 'Huawei Health'),
              distance_km: Number(r.distance_km) || 0,
              duration_seconds: Number(r.duration_seconds) || 0,
              pace_seconds_per_km: r.pace_seconds_per_km || (r.distance_km && r.duration_seconds ? Math.round(r.duration_seconds / r.distance_km) : null),
              best_pace_seconds_per_km: r.best_pace_seconds_per_km || null,
              avg_speed_kmh: r.avg_speed_kmh || (r.distance_km && r.duration_seconds ? Number(((r.distance_km / (r.duration_seconds / 3600))).toFixed(2)) : null),
              avg_heart_rate: r.avg_heart_rate || null,
              max_heart_rate: r.max_heart_rate || null,
              cadence: r.cadence || null,
              max_cadence: r.max_cadence || null,
              elevation_gain_m: r.elevation_gain_m || null,
              elevation_loss_m: r.elevation_loss_m || null,
              calories: r.calories || null,
              active_calories: r.active_calories || null,
              total_steps: r.total_steps || null,
              stride_length_cm: r.stride_length_cm || null,
              ground_contact_time_ms: r.ground_contact_time_ms || null,
              vertical_oscillation_cm: r.vertical_oscillation_cm || null,
              ground_contact_balance: r.ground_contact_balance || null,
              aerobic_te: r.aerobic_te || null,
              anaerobic_te: r.anaerobic_te || null,
              vo2max: r.vo2max || null,
              training_load: r.training_load || null,
              recovery_hours: r.recovery_hours || null,
              route_data: r.route || r.route_data || null,
              splits: r.splits || r.route?.splits || null,
              elevationPoints: r.elevationPoints || null,
              heart_rate_zones: r.heart_rate_zones || null,
              extra_metrics: r.extra_metrics || (r.raw_notes ? { raw_notes: r.raw_notes } : null),
              created_at: r.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            await storageService.saveRun(formatted);
          }
        }
        setIsJsonPasteModalOpen(false);
        setJsonSuccessMessage(`Berhasil mengimpor ${parsed.length} aktivitas lari!`);
        setTimeout(() => {
          onBack();
        }, 1200);
        return;
      }

      // Case 3: Single Run object
      if (parsed && typeof parsed === 'object') {
        setIsJsonPasteModalOpen(false);
        handleSingleRunImport(parsed);
        return;
      }

      setJsonError('Format JSON tidak dikenali.');
    } catch (err: any) {
      setJsonError(`Gagal membaca JSON: ${err?.message || 'Format JSON tidak valid'}`);
    }
  };

  const processJsonFile = (file: File) => {
    setErrorMsg(null);
    setJsonError(null);
    if (!file.name.toLowerCase().endsWith('.json') && !file.type.includes('json')) {
      setErrorMsg('Harap pilih file JSON (.json) yang valid.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        await processJsonText(content);
      }
    };
    reader.readAsText(file);
  };

  const processImageFile = async (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG or PNG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 15MB limit.');
      return;
    }

    setScreenshotFile(file);
    try {
      const compressed = await compressImage(file, 1080, 2400, 0.85);
      setScreenshotPreview(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshotPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processIntervalImageFile = async (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid interval image file (JPG or PNG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Interval image size exceeds 15MB limit.');
      return;
    }

    setIntervalScreenshotFile(file);
    try {
      const compressed = await compressImage(file, 1080, 2400, 0.85);
      setIntervalScreenshotPreview(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        setIntervalScreenshotPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processGpxFile = (file: File) => {
    setErrorMsg(null);
    if (!file.name.toLowerCase().endsWith('.gpx') && !file.type.includes('xml')) {
      setErrorMsg('Please select a valid .gpx file.');
      return;
    }

    setGpxFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const route = parseGpx(content);
      if (route && route.coordinates.length > 0) {
        setParsedRoute(route);
      } else {
        setErrorMsg('Could not find GPS track points in the uploaded GPX file.');
      }
    };
    reader.readAsText(file);
  };

  // Clipboard Paste Support (Ctrl+V / Cmd+V anywhere on this view)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      // Check if text is pasted and it looks like JSON
      const textData = e.clipboardData?.getData('text');
      if (textData && textData.trim().startsWith('{') && textData.trim().endsWith('}')) {
        try {
          const parsed = JSON.parse(textData.trim());
          if (parsed.distance_km || parsed.duration_seconds || parsed.runs) {
            e.preventDefault();
            processJsonText(textData);
            setClipboardToast('Workout JSON detected and imported!');
            setTimeout(() => setClipboardToast(null), 3000);
            return;
          }
        } catch (_) {}
      }

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            if (!screenshotPreview) {
              processImageFile(file);
              setClipboardToast('Main workout screenshot pasted from clipboard!');
              setTimeout(() => setClipboardToast(null), 3000);
            } else if (!intervalScreenshotPreview) {
              processIntervalImageFile(file);
              setClipboardToast('Interval segment screenshot pasted from clipboard!');
              setTimeout(() => setClipboardToast(null), 3000);
            } else {
              processImageFile(file);
              setClipboardToast('Main screenshot replaced from clipboard!');
              setTimeout(() => setClipboardToast(null), 3000);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [screenshotPreview, intervalScreenshotPreview]);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processIntervalImageFile(file);
  };

  const handleGpxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processGpxFile(file);
  };

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processJsonFile(file);
  };

  const handleJsonDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingJson(true);
  };

  const handleJsonDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingJson(false);
  };

  const handleJsonDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingJson(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processJsonFile(files[0]);
    }
  };

  // Image Dropzone Handlers
  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.gpx')) {
        processGpxFile(file);
      } else {
        processImageFile(file);
      }
    }
  };

  // GPX Dropzone Handlers
  const handleGpxDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingGpx(true);
  };

  const handleGpxDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingGpx(false);
  };

  const handleGpxDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingGpx(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processGpxFile(files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!screenshotPreview) {
      setErrorMsg('Please upload a running result screenshot first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setStopwatchSeconds(0);

    const startTs = performance.now();
    if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    stopwatchIntervalRef.current = setInterval(() => {
      setStopwatchSeconds(Number(((performance.now() - startTs) / 1000).toFixed(1)));
    }, 100);

    try {
      setAnalysisStep(
        intervalScreenshotPreview
          ? `Analyzing main & interval screenshots with ${activeModelOption.name}...`
          : `Analyzing screenshot with ${activeModelOption.name}...`
      );

      const response = await fetch('/api/analyze-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: screenshotPreview,
          intervalImageBase64: intervalScreenshotPreview || undefined,
          model: selectedModelId,
          customApiKey: customApiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned error status ${response.status}`);
      }

      setAnalysisStep('Extracting metrics & interval splits...');
      const result = await response.json();
      const extracted: ExtractedRunData = result.data;

      const elapsedSec = result.durationSeconds || Number(((performance.now() - startTs) / 1000).toFixed(2));
      setStopwatchSeconds(elapsedSec);

      await new Promise((r) => setTimeout(r, 300));

      onAnalysisComplete({
        screenshotBase64: screenshotPreview,
        routeData: parsedRoute,
        extractedData: extracted,
      });
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMsg(`AI Extraction failed: ${err.message || 'Check your OpenRouter connection'}`);
    } finally {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
        stopwatchIntervalRef.current = null;
      }
      setIsAnalyzing(false);
    }
  };



  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-16 space-y-5">
      <div className="flex items-center space-x-3 pt-2">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Add Run</h1>
      </div>

      {clipboardToast && (
        <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center space-x-2.5 text-emerald-300 text-xs animate-in fade-in shadow-soft-xs">
          <Clipboard className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{clipboardToast}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/30 flex items-start space-x-2.5 text-rose-300 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Extraction Notice</span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {jsonSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center space-x-2.5 text-emerald-300 text-xs animate-in fade-in shadow-soft-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{jsonSuccessMessage}</span>
        </div>
      )}

      {jsonError && (
        <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/30 flex items-start space-x-2.5 text-rose-300 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">JSON Import Notice</span>
            <span>{jsonError}</span>
          </div>
          <button
            type="button"
            onClick={() => setJsonError(null)}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <input
        ref={screenshotInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic"
        className="hidden"
        onChange={handleScreenshotChange}
      />
      <input
        ref={intervalInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic"
        className="hidden"
        onChange={handleIntervalChange}
      />
      <input
        ref={gpxInputRef}
        type="file"
        accept=".gpx,application/gpx+xml,text/xml"
        className="hidden"
        onChange={handleGpxChange}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleJsonFileChange}
      />

      {/* 1. Main Workout Screenshot Dropzone Card */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            1. Main Workout Screenshot
          </span>
          <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
            Paste (⌘+V / Ctrl+V)
          </span>
        </div>

        <Card
          onClick={() => screenshotInputRef.current?.click()}
          onDragOver={handleImageDragOver}
          onDragLeave={handleImageDragLeave}
          onDrop={handleImageDrop}
          className={`p-6 sm:p-7 border-2 border-dashed text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center min-h-[190px] ${
            isDraggingImage
              ? 'border-[#FF5500] bg-[#FF5500]/10 scale-[1.01] shadow-glow-orange'
              : 'border-white/10 hover:border-[#FF5500]/50 bg-[#1E1E1E] hover:bg-[#252525]'
          }`}
        >
          {screenshotPreview ? (
            <div className="relative w-full flex flex-col items-center">
              <div className="relative max-h-52 overflow-hidden rounded-2xl border border-white/10 shadow-sm bg-neutral-950 p-1">
                <img
                  src={screenshotPreview}
                  alt="Main Workout Preview"
                  className="max-h-48 object-contain rounded-xl mx-auto"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setScreenshotFile(null);
                    setScreenshotPreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs font-semibold text-emerald-400 flex items-center mt-2.5">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Main screenshot selected: {screenshotFile?.name || 'Image ready'}
              </span>
            </div>
          ) : (
            <>
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center mb-3 transition-transform duration-200 ${
                isDraggingImage ? 'bg-[#FF5500] text-white scale-110' : 'bg-[#FF5500]/15 text-[#FF5500] group-hover:scale-105'
              }`}>
                <ImageIcon className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                {isDraggingImage ? 'Drop Main Screenshot Here!' : 'Drop main running screenshot here'}
              </h3>
              <p className="text-xs font-medium text-neutral-400">
                Drag & drop, click to upload, or paste with <kbd className="font-mono font-bold text-neutral-300">Ctrl+V</kbd>
              </p>
            </>
          )}
        </Card>
      </div>

      {/* 2. Interval / Splits / Lap Segments Screenshot Card (Optional) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              2. Interval & Segments Screenshot
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-950/50 text-indigo-300 border border-indigo-500/30">
              Optional
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
            Paste (⌘+V / Ctrl+V)
          </span>
        </div>

        <Card
          onClick={() => intervalInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingInterval(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingInterval(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingInterval(false);
            const files = e.dataTransfer.files;
            if (files && files.length > 0) processIntervalImageFile(files[0]);
          }}
          className={`p-4 sm:p-5 transition-all duration-200 border-2 border-dashed cursor-pointer group ${
            isDraggingInterval
              ? 'border-indigo-500 bg-indigo-950/30 scale-[1.01]'
              : 'border-white/10 hover:border-indigo-400/50 bg-[#1E1E1E] hover:bg-[#252525]'
          }`}
        >
          {intervalScreenshotPreview ? (
            <div className="p-2 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <img
                  src={intervalScreenshotPreview}
                  alt="Interval Preview"
                  className="w-12 h-12 object-cover rounded-xl border border-indigo-500/30 bg-black shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-indigo-200 block truncate max-w-[200px]">
                    {intervalScreenshotFile?.name || 'Interval screenshot attached'}
                  </span>
                  <span className="text-[11px] text-indigo-400 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Interval splits will be analyzed
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIntervalScreenshotFile(null);
                  setIntervalScreenshotPreview(null);
                }}
                className="text-indigo-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
                title="Remove interval image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white">
                  {isDraggingInterval ? 'Drop Interval Screenshot Here' : 'Add Interval Segments / Laps'}
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Upload screenshot of your interval reps, split times, or work/rest breakdown.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 3. GPX Dropzone Card */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              3. GPS Route (GPX)
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/5 text-neutral-400 border border-white/10">
              Optional
            </span>
          </div>
        </div>

        <Card
          onDragOver={handleGpxDragOver}
          onDragLeave={handleGpxDragLeave}
          onDrop={handleGpxDrop}
          className={`p-4 sm:p-5 transition-all duration-200 border-2 ${
            isDraggingGpx
              ? 'border-emerald-500 bg-emerald-950/30 scale-[1.01]'
              : 'border-white/10 bg-[#1E1E1E]'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/5 text-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
              <Compass className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white">
                {isDraggingGpx ? 'Drop GPX File Here' : 'Add GPX route'}
              </h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Drag & drop or upload GPX file to display your route map.
              </p>
            </div>
          </div>

          {parsedRoute ? (
            <div className="mt-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-emerald-300 truncate max-w-[200px]">
                  {gpxFile?.name || 'Route attached'} ({parsedRoute.coordinates.length} pts)
                </span>
              </div>
              <button
                onClick={() => {
                  setGpxFile(null);
                  setParsedRoute(null);
                }}
                className="text-emerald-400 hover:text-emerald-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                leftIcon={<Upload className="w-4 h-4 text-neutral-400" />}
                onClick={() => gpxInputRef.current?.click()}
                className="text-xs font-semibold py-2"
              >
                Upload / Drop GPX
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* 4. Import JSON (File or Paste) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              4. Import Workout Data (JSON)
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-950/50 text-amber-300 border border-amber-500/30">
              Direct Import
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setJsonError(null);
              setIsJsonPasteModalOpen(true);
            }}
            className="text-[10px] font-mono text-amber-400 bg-amber-950/40 hover:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30 transition-colors cursor-pointer"
          >
            Paste JSON
          </button>
        </div>

        <Card
          onDragOver={handleJsonDragOver}
          onDragLeave={handleJsonDragLeave}
          onDrop={handleJsonDrop}
          className={`p-4 sm:p-5 transition-all duration-200 border-2 ${
            isDraggingJson
              ? 'border-amber-500 bg-amber-950/30 scale-[1.01]'
              : 'border-white/10 bg-[#1E1E1E]'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white">
                {isDraggingJson ? 'Drop JSON File Here' : 'Import Run from JSON'}
              </h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Upload or drop a Runno export, single run, or batch runs in JSON format.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              leftIcon={<Upload className="w-4 h-4 text-neutral-400" />}
              onClick={() => jsonInputRef.current?.click()}
              className="text-xs font-semibold py-2"
            >
              Upload .json
            </Button>
            <Button
              variant="secondary"
              size="md"
              fullWidth
              leftIcon={<Clipboard className="w-4 h-4 text-amber-400" />}
              onClick={() => {
                setJsonError(null);
                setIsJsonPasteModalOpen(true);
              }}
              className="text-xs font-semibold py-2"
            >
              Paste JSON
            </Button>
          </div>
        </Card>
      </div>

      {/* Paste JSON Modal Dialog */}
      {isJsonPasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Import Workout JSON</h3>
                  <p className="text-[11px] text-neutral-400">Paste single run or batch JSON payload</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsJsonPasteModalOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {jsonError && (
              <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{jsonError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-300">JSON Content</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clip = await navigator.clipboard.readText();
                        if (clip) setJsonRawInput(clip);
                      } catch (_) {}
                    }}
                    className="text-[10px] font-bold text-amber-400 hover:underline"
                  >
                    Paste from Clipboard
                  </button>
                  <span className="text-neutral-600">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setJsonRawInput(JSON.stringify({
                        date: new Date().toISOString().split('T')[0],
                        distance_km: 5.0,
                        duration_seconds: 1800,
                        pace_seconds_per_km: 360,
                        avg_heart_rate: 148,
                        calories: 320,
                        cadence: 168
                      }, null, 2));
                    }}
                    className="text-[10px] font-bold text-neutral-400 hover:text-white"
                  >
                    Load Sample
                  </button>
                </div>
              </div>
              <textarea
                rows={9}
                value={jsonRawInput}
                onChange={(e) => setJsonRawInput(e.target.value)}
                placeholder={'{\n  "date": "2026-08-18",\n  "distance_km": 5.0,\n  "duration_seconds": 1800,\n  "pace_seconds_per_km": 360,\n  "avg_heart_rate": 148\n}'}
                className="w-full bg-[#111111] border border-white/10 rounded-2xl p-3 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] resize-none"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsJsonPasteModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!jsonRawInput.trim()}
                onClick={() => processJsonText(jsonRawInput)}
                className="flex-1 py-2.5 text-xs font-bold bg-[#FF5500] hover:bg-[#E64D00] text-white shadow-glow-orange"
              >
                Import JSON
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Extraction Model Selector Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1E1E1E] rounded-2xl border border-white/5 shadow-2xs">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#252525] border border-white/10 flex items-center justify-center p-1 shrink-0">
            <img src={activeModelOption.iconSrc} alt={activeModelOption.name} className="w-5 h-5 object-contain" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-white flex items-center gap-1.5 truncate">
              <span className="truncate">{activeModelOption.name}</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 shrink-0">
                {activeModelOption.badge}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 font-medium">Vision Extraction Engine</div>
          </div>
        </div>

        {/* Actions: Test Vision API & Change Model */}
        <div className="flex items-center space-x-1.5 shrink-0 ml-2">
          {/* Test Vision Button */}
          <button
            type="button"
            onClick={handleTestVision}
            disabled={isTestingVision}
            className={clsx(
              "flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-2xs",
              visionTestResult?.success
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/60"
                : visionTestResult?.success === false
                ? "bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-950/60"
                : "border-white/10 bg-[#252525] hover:bg-[#2F2F2F] text-neutral-300"
            )}
            title="Test AI Vision Model latency and readiness before uploading"
          >
            <Activity className={clsx("w-3.5 h-3.5", isTestingVision ? "animate-spin text-[#FF5500]" : "text-neutral-400")} />
            <span>{isTestingVision ? 'Testing...' : visionTestResult?.durationMs ? `${visionTestResult.durationMs}ms` : 'Test API'}</span>
          </button>

          {/* Change Model Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-white/10 bg-[#252525] hover:bg-[#2F2F2F] text-xs font-bold text-neutral-300 active:scale-95 transition-all shadow-2xs"
            >
              <span>Change</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {isModelDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsModelDropdownOpen(false)} />
                <div className="absolute bottom-full right-0 mb-2 z-50 w-64 bg-[#1E1E1E] rounded-2xl border border-white/10 shadow-xl p-1.5 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Select Extraction Model
                  </div>
                  {OCR_MODELS.map((m) => {
                    const isSelected = selectedModelId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedModelId(m.id);
                          setIsModelDropdownOpen(false);
                          setVisionTestResult(null);
                          try {
                            localStorage.setItem('runno_ocr_model', m.id);
                          } catch (_) {}
                        }}
                        className={clsx(
                          'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-left',
                          isSelected ? 'bg-white text-neutral-900 font-bold' : 'text-neutral-300 hover:bg-[#252525]'
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
                            <div className="font-bold leading-tight truncate flex items-center gap-1.5">
                              <span className="truncate">{m.name}</span>
                              <span className={clsx(
                                "text-[8.5px] px-1 py-0.2 rounded font-black border shrink-0",
                                isSelected ? "bg-neutral-800 border-neutral-700 text-white" : "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
                              )}>
                                {m.badge}
                              </span>
                            </div>
                            <div className={clsx('text-[10px] leading-tight mt-0.5 truncate', isSelected ? 'text-neutral-600' : 'text-neutral-400')}>
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
        </div>
      </div>

      {/* Vision Pre-Flight Test Result Notification */}
      {visionTestResult && (
        <div className={clsx(
          "p-3 rounded-2xl border text-xs flex items-start space-x-2.5 animate-in fade-in duration-150 shadow-soft-xs",
          visionTestResult.success
            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
            : "bg-rose-950/40 border-rose-500/30 text-rose-300"
        )}>
          {visionTestResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold flex items-center gap-1.5 flex-wrap">
              <span>{activeModelOption.name}: {visionTestResult.success ? 'Ready & Online' : 'Check Required'}</span>
              {visionTestResult.durationMs && (
                <span className="font-mono text-[10px] bg-white/10 px-1.5 py-0.2 rounded-md border border-white/10 font-bold">
                  {visionTestResult.durationMs}ms
                </span>
              )}
            </div>
            <p className="text-[11px] mt-0.5 leading-snug">
              {visionTestResult.success ? visionTestResult.message : visionTestResult.error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setVisionTestResult(null)}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}


      {/* Single prominent submit button */}
      <div className="pt-1">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleAnalyze}
          disabled={!screenshotPreview || isAnalyzing}
          leftIcon={<Sparkles className="w-5 h-5 text-white fill-white/20" />}
          className="text-base font-bold shadow-glow-orange py-4 rounded-2xl"
        >
          {screenshotPreview ? 'Analyze Run' : 'Select Screenshot to Analyze'}
        </Button>
      </div>

      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 bg-[#1E1E1E] border-white/10">
            <div className="relative w-16 h-16 rounded-full bg-[#FF5500]/15 text-[#FF5500] flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-8 h-8" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#252525] border border-white/10 flex items-center justify-center p-0.5 shadow-xs">
                <img src={activeModelOption.iconSrc} alt={activeModelOption.name} className="w-4 h-4 object-contain" />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#252525] text-white font-mono text-sm font-black mb-2 border border-white/5">
                <Timer className="w-4 h-4 text-[#FF5500] animate-spin" />
                <span>{stopwatchSeconds.toFixed(1)}s</span>
              </div>
              <h3 className="text-base font-extrabold text-white mb-1">
                Analyzing Run
              </h3>
              <p className="text-xs font-medium text-neutral-400">{analysisStep}</p>
            </div>
            <div className="w-full bg-[#252525] rounded-full h-2 overflow-hidden">
              <div className="bg-[#FF5500] h-full rounded-full w-2/3 animate-pulse" />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
