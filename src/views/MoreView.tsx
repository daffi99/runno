import React, { useState, useRef } from 'react';
import type { UnitSystem } from '../types/run';
import { type AppSettings, storageService } from '../services/storage';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  ChevronRight,
  Sparkles,
  Scale,
  DownloadCloud,
  UploadCloud,
  Trash2,
  CheckCircle2,
  Smartphone,
  Check,
  BarChart2,
} from 'lucide-react';

interface MoreViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onNavigateExport: () => void;
  onNavigateStats?: () => void;
  onDataChanged: () => void;
}

export const MoreView: React.FC<MoreViewProps> = ({
  settings,
  onUpdateSettings,
  onNavigateExport,
  onNavigateStats,
  onDataChanged,
}) => {

  const [apiKeyInput, setApiKeyInput] = useState<string>(settings.customOpenRouterKey || '');
  const [savedKeySuccess, setSavedKeySuccess] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveApiKey = () => {
    onUpdateSettings({ customOpenRouterKey: apiKeyInput.trim() });
    setSavedKeySuccess(true);
    setTimeout(() => setSavedKeySuccess(false), 2500);
  };

  const handleToggleUnit = () => {
    const nextUnit: UnitSystem = settings.unitSystem === 'metric' ? 'imperial' : 'metric';
    onUpdateSettings({ unitSystem: nextUnit });
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = storageService.importRunsJson(content);
      if (result.success) {
        onDataChanged();
        setImportStatus(`Successfully imported ${result.count} runs!`);
      } else {
        setImportStatus(`Import error: ${result.error}`);
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all running logs? This will delete all local and database records.')) {
      storageService.clearAllData();
      onDataChanged();
      setImportStatus('Cleared all runs.');
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-5">
      <div className="pt-2">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">More & Settings</h1>
        <p className="text-xs text-neutral-400 font-medium mt-0.5">
          Preferences, API key & data management
        </p>
      </div>

      {importStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-emerald-800 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Preferences */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Preferences
        </span>

        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF5500] flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Unit System</h3>
              <p className="text-xs text-neutral-400">
                {settings.unitSystem === 'metric'
                  ? 'Metric (Kilometers, km/h, meters)'
                  : 'Imperial (Miles, mph, feet)'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleUnit}
            className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-800 transition-colors uppercase"
          >
            {settings.unitSystem}
          </button>
        </Card>

        {onNavigateStats && (
          <Card
            variant="interactive"
            onClick={onNavigateStats}
            className="p-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Stats & Records</h3>
                <p className="text-xs text-neutral-400">Monthly mileage volume and personal bests</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </Card>
        )}
      </div>


      {/* AI Extraction Settings */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          AI Screenshot Extraction
        </span>

        <Card className="p-4 space-y-3 bg-white">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF5500] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Custom OpenRouter API Key</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Override server API key with your own personal OpenRouter key.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <input
              type="password"
              placeholder="sk-or-v1-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 font-mono"
            />
            <div className="flex justify-end">
              <Button
                variant={savedKeySuccess ? 'outline' : 'secondary'}
                size="sm"
                onClick={handleSaveApiKey}
                leftIcon={savedKeySuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : undefined}
                className="text-xs font-bold"
              >
                {savedKeySuccess ? 'Saved Key!' : 'Save Key'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Backup & Restore */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Data & Backup
        </span>

        <Card
          variant="interactive"
          onClick={onNavigateExport}
          className="p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Export Runs (JSON)</h3>
              <p className="text-xs text-neutral-400">Export single run or all runs formatted for Claude</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </Card>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleImportJsonFile}
        />

        <Card
          variant="interactive"
          onClick={() => fileInputRef.current?.click()}
          className="p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Import Runs (JSON)</h3>
              <p className="text-xs text-neutral-400">Restore runs from a previously exported backup file</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </Card>
      </div>

      {/* Danger Zone */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-red-500">
          Danger Zone
        </span>

        <Card className="p-4 flex items-center justify-between border border-red-100 bg-red-50/30">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Clear All Runs</h3>
              <p className="text-xs text-neutral-400">Permanently delete all running activities</p>
            </div>
          </div>
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
          >
            Clear All
          </button>
        </Card>
      </div>

      {/* PWA & Version info */}
      <div className="pt-2 text-center text-xs text-neutral-400 space-y-1">
        <div className="flex items-center justify-center space-x-1.5 font-semibold text-neutral-600">
          <Smartphone className="w-3.5 h-3.5 text-[#FF5500]" />
          <span>Runno PWA • v1.0.0</span>
        </div>
        <p className="text-[11px] text-neutral-400">
          Precision Personal Running Tracker • Mobile-First PWA
        </p>
      </div>
    </div>
  );
};
