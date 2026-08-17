import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { parseGpx } from '../utils/gpx';
import { compressImage } from '../utils/image';
import type { RouteData, ExtractedRunData } from '../types/run';
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

  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const intervalInputRef = useRef<HTMLInputElement>(null);
  const gpxInputRef = useRef<HTMLInputElement>(null);

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
          className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-700 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-neutral-900">Add Run</h1>
      </div>

      {clipboardToast && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2.5 text-emerald-800 text-xs animate-in fade-in shadow-soft-xs">
          <Clipboard className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{clipboardToast}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start space-x-2.5 text-red-700 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Extraction Notice</span>
            <span>{errorMsg}</span>
          </div>
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

      {/* 1. Main Workout Screenshot Dropzone Card */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            1. Main Workout Screenshot
          </span>
          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
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
              ? 'border-[#FF5500] bg-orange-50/60 scale-[1.01] shadow-glow-orange'
              : 'border-neutral-200 hover:border-[#FF5500]/50 bg-white hover:bg-orange-50/20'
          }`}
        >
          {screenshotPreview ? (
            <div className="relative w-full flex flex-col items-center">
              <div className="relative max-h-52 overflow-hidden rounded-2xl border border-neutral-200 shadow-sm bg-neutral-950 p-1">
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
              <span className="text-xs font-semibold text-emerald-600 flex items-center mt-2.5">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Main screenshot selected: {screenshotFile?.name || 'Image ready'}
              </span>
            </div>
          ) : (
            <>
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center mb-3 transition-transform duration-200 ${
                isDraggingImage ? 'bg-[#FF5500] text-white scale-110' : 'bg-orange-50 text-[#FF5500] group-hover:scale-105'
              }`}>
                <ImageIcon className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mb-1">
                {isDraggingImage ? 'Drop Main Screenshot Here!' : 'Drop main running screenshot here'}
              </h3>
              <p className="text-xs font-medium text-neutral-400">
                Drag & drop, click to upload, or paste with <kbd className="font-mono font-bold text-neutral-600">Ctrl+V</kbd>
              </p>
            </>
          )}
        </Card>
      </div>

      {/* 2. Interval / Splits / Lap Segments Screenshot Card (Optional) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              2. Interval & Segments Screenshot
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-200/60">
              Optional
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
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
              ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
              : 'border-neutral-200/80 hover:border-indigo-300 bg-white hover:bg-indigo-50/20'
          }`}
        >
          {intervalScreenshotPreview ? (
            <div className="p-2 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <img
                  src={intervalScreenshotPreview}
                  alt="Interval Preview"
                  className="w-12 h-12 object-cover rounded-xl border border-indigo-200 bg-black shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-indigo-950 block truncate max-w-[200px]">
                    {intervalScreenshotFile?.name || 'Interval screenshot attached'}
                  </span>
                  <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
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
                className="text-indigo-700 hover:text-indigo-950 p-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                title="Remove interval image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-neutral-900">
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
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              3. GPS Route (GPX)
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
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
              ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
              : 'border-neutral-200/80 bg-white'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
              <Compass className="w-5 h-5 text-neutral-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-neutral-900">
                {isDraggingGpx ? 'Drop GPX File Here' : 'Add GPX route'}
              </h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Drag & drop or upload GPX file to display your route map.
              </p>
            </div>
          </div>

          {parsedRoute ? (
            <div className="mt-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-emerald-800 truncate max-w-[200px]">
                  {gpxFile?.name || 'Route attached'} ({parsedRoute.coordinates.length} pts)
                </span>
              </div>
              <button
                onClick={() => {
                  setGpxFile(null);
                  setParsedRoute(null);
                }}
                className="text-emerald-700 hover:text-emerald-900 p-1"
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
                leftIcon={<Upload className="w-4 h-4 text-neutral-500" />}
                onClick={() => gpxInputRef.current?.click()}
                className="text-xs font-semibold py-2"
              >
                Upload / Drop GPX
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* AI Extraction Model Selector Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-center p-1 shrink-0">
            <img src={activeModelOption.iconSrc} alt={activeModelOption.name} className="w-5 h-5 object-contain" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-neutral-900 flex items-center gap-1.5 truncate">
              <span className="truncate">{activeModelOption.name}</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
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
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : visionTestResult?.success === false
                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
            )}
            title="Test AI Vision Model latency and readiness before uploading"
          >
            <Activity className={clsx("w-3.5 h-3.5", isTestingVision ? "animate-spin text-[#FF5500]" : "text-neutral-500")} />
            <span>{isTestingVision ? 'Testing...' : visionTestResult?.durationMs ? `${visionTestResult.durationMs}ms` : 'Test API'}</span>
          </button>

          {/* Change Model Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-700 active:scale-95 transition-all shadow-2xs"
            >
              <span>Change</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {isModelDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsModelDropdownOpen(false)} />
                <div className="absolute bottom-full right-0 mb-2 z-50 w-64 bg-white rounded-2xl border border-neutral-200 shadow-xl p-1.5 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
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
                          isSelected ? 'bg-neutral-900 text-white font-bold' : 'text-neutral-700 hover:bg-neutral-100'
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
                                isSelected ? "bg-neutral-800 border-neutral-700 text-white" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              )}>
                                {m.badge}
                              </span>
                            </div>
                            <div className={clsx('text-[10px] leading-tight mt-0.5 truncate', isSelected ? 'text-neutral-300' : 'text-neutral-400')}>
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
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-red-50 border-red-200 text-red-700"
        )}>
          {visionTestResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold flex items-center gap-1.5 flex-wrap">
              <span>{activeModelOption.name}: {visionTestResult.success ? 'Ready & Online' : 'Check Required'}</span>
              {visionTestResult.durationMs && (
                <span className="font-mono text-[10px] bg-white/90 px-1.5 py-0.2 rounded-md border font-bold">
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
            className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="relative w-16 h-16 rounded-full bg-orange-100 text-[#FF5500] flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-8 h-8" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center p-0.5 shadow-xs">
                <img src={activeModelOption.iconSrc} alt={activeModelOption.name} className="w-4 h-4 object-contain" />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 font-mono text-sm font-black mb-2">
                <Timer className="w-4 h-4 text-[#FF5500] animate-spin" />
                <span>{stopwatchSeconds.toFixed(1)}s</span>
              </div>
              <h3 className="text-base font-extrabold text-neutral-900 mb-1">
                Analyzing Run
              </h3>
              <p className="text-xs font-medium text-neutral-500">{analysisStep}</p>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div className="bg-[#FF5500] h-full rounded-full w-2/3 animate-pulse" />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

