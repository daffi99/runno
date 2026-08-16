import React, { useState } from 'react';
import type { Run } from '../types/run';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatDate } from '../utils/formatters';
import {
  ChevronLeft,
  ChevronRight,
  FileCode,
  Download,
  Copy,
  Check,
} from 'lucide-react';

interface ExportViewProps {
  runs: Run[];
  onBack: () => void;
}

export const ExportView: React.FC<ExportViewProps> = ({ runs, onBack }) => {
  const [selectedRunId, setSelectedRunId] = useState<string>(runs[0]?.id || '');
  const [exportMode, setExportMode] = useState<'single' | 'all'>('all');
  const [copied, setCopied] = useState<boolean>(false);

  const getCleanExportJson = () => {
    const targetRuns =
      exportMode === 'single'
        ? runs.filter((r) => r.id === selectedRunId)
        : runs;

    const formattedRuns = targetRuns.map((r) => ({
      id: r.id,
      date: formatDate(r.date, 'isoDate'),
      source: r.source.toLowerCase(),
      distance_km: r.distance_km,
      duration_seconds: r.duration_seconds,
      pace_seconds_per_km: r.pace_seconds_per_km,
      best_pace_seconds_per_km: r.best_pace_seconds_per_km || null,
      avg_speed_kmh: r.avg_speed_kmh,
      avg_heart_rate: r.avg_heart_rate,
      max_heart_rate: r.max_heart_rate,
      cadence: r.cadence,
      max_cadence: r.max_cadence || null,
      elevation_gain_m: r.elevation_gain_m,
      elevation_loss_m: r.elevation_loss_m,
      calories: r.calories,
      active_calories: r.active_calories || null,
      
      // Huawei Health & Advanced Running Dynamics
      total_steps: r.total_steps || null,
      stride_length_cm: r.stride_length_cm || null,
      ground_contact_time_ms: r.ground_contact_time_ms || null,
      vertical_oscillation_cm: r.vertical_oscillation_cm || null,
      ground_contact_balance: r.ground_contact_balance || null,
      aerobic_te: r.aerobic_te || null,
      vo2max: r.vo2max || null,
      training_load: r.training_load || null,
      recovery_hours: r.recovery_hours || null,

      route: r.route_data
        ? {
            point_count: r.route_data.coordinates.length,
            splits: r.route_data.splits,
            coordinates: r.route_data.coordinates,
          }
        : null,
    }));

    return JSON.stringify({ runs: formattedRuns, total: formattedRuns.length }, null, 2);
  };

  const jsonContent = getCleanExportJson();

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      exportMode === 'single'
        ? `run-${selectedRunId}.json`
        : `runno-export-all-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-5">
      <div className="flex items-center space-x-3 pt-2">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-700 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-neutral-900">Export</h1>
      </div>

      <div className="space-y-3">
        <Card
          variant="interactive"
          onClick={() => setExportMode('single')}
          className={`p-4 flex items-center justify-between border-2 transition-all ${
            exportMode === 'single'
              ? 'border-[#FF5500] bg-orange-50/10'
              : 'border-transparent bg-white'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Export Single Run</h3>
              <p className="text-xs text-neutral-400">Export this run as JSON</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </Card>

        <Card
          variant="interactive"
          onClick={() => setExportMode('all')}
          className={`p-4 flex items-center justify-between border-2 transition-all ${
            exportMode === 'all'
              ? 'border-[#FF5500] bg-orange-50/10'
              : 'border-transparent bg-white'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF5500] flex items-center justify-center shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Export All Runs</h3>
              <p className="text-xs text-neutral-400">Export all runs as JSON</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </Card>
      </div>

      {exportMode === 'single' && (
        <div className="space-y-1.5 animate-in fade-in">
          <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
            Select Run to Export
          </label>
          <select
            value={selectedRunId}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="w-full bg-white border border-neutral-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {formatDate(r.date)} — {r.distance_km} km ({r.source})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Structured JSON Preview
          </span>
          <span className="text-[11px] text-neutral-400 font-mono">Claude-ready schema</span>
        </div>

        <div className="bg-neutral-900 text-emerald-400 rounded-3xl p-4 font-mono text-[11px] max-h-64 overflow-y-auto shadow-soft leading-relaxed border border-neutral-800">
          <pre>{jsonContent}</pre>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          variant="secondary"
          size="lg"
          onClick={handleCopy}
          leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          className="font-bold text-xs"
        >
          {copied ? 'Copied to Clipboard!' : 'Copy JSON'}
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={handleDownload}
          leftIcon={<Download className="w-4 h-4" />}
          className="font-bold text-xs shadow-glow-orange"
        >
          Download JSON
        </Button>
      </div>
    </div>
  );
};
