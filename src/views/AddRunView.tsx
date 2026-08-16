import React, { useState, useRef } from 'react';
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
} from 'lucide-react';

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
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [parsedRoute, setParsedRoute] = useState<RouteData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('Preparing upload...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false);
  const [isDraggingGpx, setIsDraggingGpx] = useState<boolean>(false);

  const screenshotInputRef = useRef<HTMLInputElement>(null);
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

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
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

    try {
      setAnalysisStep('Uploading screenshot...');
      setAnalysisStep('Gemini 2.5 Flash Lite analyzing image...');

      const response = await fetch('/api/analyze-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: screenshotPreview,
          customApiKey: customApiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned error status ${response.status}`);
      }

      setAnalysisStep('Extracting running statistics...');
      const result = await response.json();
      const extracted: ExtractedRunData = result.data;

      await new Promise((r) => setTimeout(r, 400));

      onAnalysisComplete({
        screenshotBase64: screenshotPreview,
        routeData: parsedRoute,
        extractedData: extracted,
      });
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMsg(`AI Extraction failed: ${err.message || 'Check your OpenRouter connection'}`);
    } finally {
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
        ref={gpxInputRef}
        type="file"
        accept=".gpx,application/gpx+xml,text/xml"
        className="hidden"
        onChange={handleGpxChange}
      />

      {/* 1. Screenshot Dropzone Card */}
      <Card
        onClick={() => screenshotInputRef.current?.click()}
        onDragOver={handleImageDragOver}
        onDragLeave={handleImageDragLeave}
        onDrop={handleImageDrop}
        className={`p-8 border-2 border-dashed text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center min-h-[220px] ${
          isDraggingImage
            ? 'border-[#FF5500] bg-orange-50/60 scale-[1.01] shadow-glow-orange'
            : 'border-neutral-200 hover:border-[#FF5500]/50 bg-white hover:bg-orange-50/20'
        }`}
      >
        {screenshotPreview ? (
          <div className="relative w-full flex flex-col items-center">
            <div className="relative max-h-56 overflow-hidden rounded-2xl border border-neutral-200 shadow-sm bg-neutral-950 p-1">
              <img
                src={screenshotPreview}
                alt="Screenshot Preview"
                className="max-h-52 object-contain rounded-xl mx-auto"
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
            <span className="text-xs font-semibold text-emerald-600 flex items-center mt-3">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Screenshot selected: {screenshotFile?.name || 'Image ready'}
            </span>
          </div>
        ) : (
          <>
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-3.5 transition-transform duration-200 ${
              isDraggingImage ? 'bg-[#FF5500] text-white scale-110' : 'bg-orange-50 text-[#FF5500] group-hover:scale-105'
            }`}>
              <ImageIcon className="w-8 h-8 stroke-[1.8]" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              {isDraggingImage ? 'Drop Screenshot Here!' : 'Drop running screenshot here'}
            </h3>
            <p className="text-xs font-medium text-neutral-400">
              Drag & drop or click to upload • JPG, PNG Max 15MB
            </p>
          </>
        )}
      </Card>

      <div className="flex items-center space-x-3 text-neutral-300">
        <div className="h-px bg-neutral-200 flex-1" />
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">OR</span>
        <div className="h-px bg-neutral-200 flex-1" />
      </div>

      <Button
        variant="secondary"
        fullWidth
        size="lg"
        leftIcon={<ImageIcon className="w-5 h-5 text-neutral-600" />}
        onClick={() => screenshotInputRef.current?.click()}
        className="font-bold text-neutral-800"
      >
        Choose from Gallery / Files
      </Button>

      {/* 2. GPX Dropzone Card */}
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
            <h4 className="text-sm font-bold text-neutral-900">
              {isDraggingGpx ? 'Drop GPX File Here' : 'Add GPX route (optional)'}
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Drag & drop or upload GPX file to display your route map.
            </p>
          </div>
        </div>

        {parsedRoute ? (
          <div className="mt-3.5 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
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
          <div className="mt-3.5">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              leftIcon={<Upload className="w-4 h-4 text-neutral-500" />}
              onClick={() => gpxInputRef.current?.click()}
              className="text-xs font-semibold"
            >
              Upload / Drop GPX
            </Button>
          </div>
        )}

        <p className="text-[11px] text-neutral-400 mt-2.5 leading-tight italic">
          * GPX is optional and is only used to show your route on the map.
        </p>
      </Card>

      {/* Single prominent submit button */}
      <div className="pt-3">
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
            <div className="w-14 h-14 rounded-full bg-orange-100 text-[#FF5500] flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
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
