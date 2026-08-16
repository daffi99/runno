import React, { useState, useRef } from 'react';
import type { Run, UnitSystem } from '../types/run';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { RunMap } from '../components/map/RunMap';
import { SplitsTable } from '../components/splits/SplitsTable';
import { RunCharts } from '../components/charts/RunCharts';
import { parseGpx } from '../utils/gpx';
import {
  formatDate,
  formatDuration,
  formatPace,
} from '../utils/formatters';
import {
  ChevronLeft,
  MoreVertical,
  Download,
  Trash2,
  Copy,
  Check,
  Maximize2,
  X,
  Footprints,
  Zap,
  Compass,
  Upload,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface RunDetailViewProps {
  run: Run;
  unitSystem: UnitSystem;
  onBack: () => void;
  onDeleteRun: (id: string) => void;
  onExportJson: (runId: string) => void;
  onUpdateRun?: (updatedRun: Run) => void;
}

export const RunDetailView: React.FC<RunDetailViewProps> = ({
  run,
  unitSystem,
  onBack,
  onDeleteRun,
  onUpdateRun,
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [gpxError, setGpxError] = useState<string | null>(null);
  const [gpxSuccess, setGpxSuccess] = useState<string | null>(null);

  const gpxInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'map', label: 'Map' },
    { id: 'splits', label: 'Splits' },
    { id: 'charts', label: 'Charts' },
  ];

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify({ runs: [run] }, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify({ runs: [run] }, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `run-${formatDate(run.date, 'isoDate')}-${run.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGpxFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGpxError(null);
    setGpxSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseGpx(content);
      if (parsed && parsed.coordinates.length > 0) {
        const updated: Run = {
          ...run,
          route_data: parsed,
          updated_at: new Date().toISOString(),
        };
        if (onUpdateRun) {
          onUpdateRun(updated);
        }
        setGpxSuccess(`Successfully attached GPX route (${parsed.coordinates.length} GPS points)!`);
        setTimeout(() => setGpxSuccess(null), 4000);
      } else {
        setGpxError('Could not find GPS track points in the uploaded GPX file.');
        setTimeout(() => setGpxError(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset so same file can be reselected
  };

  const handleRemoveGpx = () => {
    if (confirm('Remove the attached GPX route from this run?')) {
      const updated: Run = {
        ...run,
        route_data: null,
        updated_at: new Date().toISOString(),
      };
      if (onUpdateRun) {
        onUpdateRun(updated);
      }
      setGpxSuccess('GPX route removed.');
      setTimeout(() => setGpxSuccess(null), 3000);
    }
  };

  const hasRunningDynamics =
    run.total_steps ||
    run.stride_length_cm ||
    run.ground_contact_time_ms ||
    run.vertical_oscillation_cm ||
    run.ground_contact_balance ||
    run.max_cadence;

  const hasPerformance =
    run.aerobic_te ||
    run.vo2max ||
    run.training_load ||
    run.recovery_hours ||
    run.best_pace_seconds_per_km ||
    run.active_calories;

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-4">
      <input
        ref={gpxInputRef}
        type="file"
        accept=".gpx,application/gpx+xml,text/xml"
        className="hidden"
        onChange={handleGpxFileChange}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-700 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-bold text-neutral-900 leading-tight">
            {formatDate(run.date, 'short')}
          </h1>
          <span className="text-xs text-neutral-400 font-medium">{run.source}</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 -mr-2 rounded-full hover:bg-neutral-100 text-neutral-700 transition-colors"
            aria-label="Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-soft-lg border border-neutral-200/80 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    gpxInputRef.current?.click();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2"
                >
                  <Compass className="w-4 h-4 text-[#FF5500]" />
                  <span>{run.route_data ? 'Update GPX Route' : 'Attach GPX Route'}</span>
                </button>

                {run.route_data && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleRemoveGpx();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2"
                  >
                    <X className="w-4 h-4 text-neutral-400" />
                    <span>Remove GPX Route</span>
                  </button>
                )}

                <div className="h-px bg-neutral-100 my-1" />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowJsonModal(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4 text-neutral-500" />
                  <span>Export JSON</span>
                </button>

                <div className="h-px bg-neutral-100 my-1" />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (confirm('Are you sure you want to delete this run?')) {
                      onDeleteRun(run.id);
                    }
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>Delete Run</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {gpxSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-emerald-800 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{gpxSuccess}</span>
        </div>
      )}

      {gpxError && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center space-x-2 text-red-800 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{gpxError}</span>
        </div>
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in">
          {run.route_data ? (
            <RunMap
              routeData={run.route_data}
              height="220px"
              showElevationProfile={false}
            />
          ) : (
            <Card
              onClick={() => gpxInputRef.current?.click()}
              className="p-4 border-2 border-dashed border-neutral-200 hover:border-[#FF5500]/50 bg-white hover:bg-orange-50/20 text-center cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF5500] flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Add GPS Map Route</h4>
                  <p className="text-[11px] text-neutral-400">Upload GPX file to display your route</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" className="text-xs font-bold shrink-0">
                Upload GPX
              </Button>
            </Card>
          )}

          {/* Big Distance */}
          <div className="pt-2 text-left">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-4xl font-black text-neutral-900 tracking-tight font-mono">
                {run.distance_km.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-neutral-400">
                {unitSystem === 'metric' ? 'km' : 'mi'}
              </span>
            </div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Distance
            </span>
          </div>

          {/* 3x3 Key Statistics Grid */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <Card className="p-3 bg-white">
              <span className="text-sm font-black text-neutral-900 font-mono block">
                {formatDuration(run.duration_seconds)}
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mt-0.5">
                Duration
              </span>
            </Card>

            <Card className="p-3 bg-white">
              <span className="text-sm font-black text-neutral-900 font-mono block">
                {formatPace(run.pace_seconds_per_km, unitSystem, false)}
                <span className="text-[10px] text-neutral-400 font-normal ml-0.5">/km</span>
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mt-0.5">
                Avg Pace
              </span>
            </Card>

            <Card className="p-3 bg-white">
              <span className="text-sm font-black text-neutral-900 font-mono block">
                {run.avg_speed_kmh ? `${run.avg_speed_kmh.toFixed(2)}` : '--'}
                <span className="text-[10px] text-neutral-400 font-normal ml-0.5">km/h</span>
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mt-0.5">
                Avg Speed
              </span>
            </Card>

            <Card className="p-3 bg-white">
              <span className="text-sm font-black text-neutral-900 font-mono block">
                {run.avg_heart_rate ? `${run.avg_heart_rate}` : '--'}
                <span className="text-[10px] text-neutral-400 font-normal ml-0.5">bpm</span>
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mt-0.5">
                Avg HR
              </span>
            </Card>

            <Card className="p-3 bg-white">
              <span className="text-sm font-black text-neutral-900 font-mono block">
                {run.max_heart_rate ? `${run.max_heart_rate}` : '--'}
                <span className="text-[10px] text-neutral-400 font-normal ml-0.5">bpm</span>
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mt-0.5">
                Max HR
              </span>
            </Card>

            <Card className="p-3 bg-white">
              <span className="text-sm font-black text-neutral-900 font-mono block">
                {run.cadence ? `${run.cadence}` : '--'}
                <span className="text-[10px] text-neutral-400 font-normal ml-0.5">spm</span>
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mt-0.5">
                Cadence
              </span>
            </Card>

            <Card className="p-3 bg-white">
              <span className="text-sm font-black text-neutral-900 font-mono block">
                {run.elevation_gain_m !== null ? `${run.elevation_gain_m}` : '--'}
                <span className="text-[10px] text-neutral-400 font-normal ml-0.5">m</span>
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mt-0.5">
                Elev Gain
              </span>
            </Card>

            <Card className="p-3 bg-white">
              <span className="text-sm font-black text-neutral-900 font-mono block">
                {run.elevation_loss_m !== null ? `${run.elevation_loss_m}` : '--'}
                <span className="text-[10px] text-neutral-400 font-normal ml-0.5">m</span>
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mt-0.5">
                Elev Loss
              </span>
            </Card>

            <Card className="p-3 bg-white">
              <span className="text-sm font-black text-neutral-900 font-mono block">
                {run.calories ? `${run.calories}` : '--'}
                <span className="text-[10px] text-neutral-400 font-normal ml-0.5">kcal</span>
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mt-0.5">
                Calories
              </span>
            </Card>
          </div>

          {/* Running Dynamics Card */}
          {hasRunningDynamics && (
            <Card className="p-4 sm:p-5 space-y-3 bg-white border border-neutral-200/80">
              <div className="flex items-center space-x-2 pb-2 border-b border-neutral-100">
                <Footprints className="w-4 h-4 text-[#FF5500]" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Running Dynamics & Form
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {run.total_steps && (
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Total Steps
                    </span>
                    <span className="text-sm font-black text-neutral-900 font-mono">
                      {run.total_steps.toLocaleString()}
                    </span>
                  </div>
                )}

                {run.stride_length_cm && (
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Stride Length
                    </span>
                    <span className="text-sm font-black text-neutral-900 font-mono">
                      {run.stride_length_cm} <span className="text-[10px] font-normal text-neutral-400">cm</span>
                    </span>
                  </div>
                )}

                {run.ground_contact_time_ms && (
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Ground Contact
                    </span>
                    <span className="text-sm font-black text-neutral-900 font-mono">
                      {run.ground_contact_time_ms} <span className="text-[10px] font-normal text-neutral-400">ms</span>
                    </span>
                  </div>
                )}

                {run.vertical_oscillation_cm && (
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Vert. Oscillation
                    </span>
                    <span className="text-sm font-black text-neutral-900 font-mono">
                      {run.vertical_oscillation_cm} <span className="text-[10px] font-normal text-neutral-400">cm</span>
                    </span>
                  </div>
                )}

                {run.max_cadence && (
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Max Cadence
                    </span>
                    <span className="text-sm font-black text-neutral-900 font-mono">
                      {run.max_cadence} <span className="text-[10px] font-normal text-neutral-400">spm</span>
                    </span>
                  </div>
                )}

                {run.ground_contact_balance && (
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Balance (L/R)
                    </span>
                    <span className="text-xs font-bold text-neutral-800 font-mono">
                      {run.ground_contact_balance}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Performance & Training Load Card */}
          {hasPerformance && (
            <Card className="p-4 sm:p-5 space-y-3 bg-white border border-neutral-200/80">
              <div className="flex items-center space-x-2 pb-2 border-b border-neutral-100">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Performance & Recovery
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {run.aerobic_te && (
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Training Effect
                    </span>
                    <span className="text-sm font-black text-emerald-600 font-mono">
                      {run.aerobic_te} <span className="text-[10px] font-normal text-neutral-400">TE</span>
                    </span>
                  </div>
                )}

                {run.vo2max && (
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      VO2Max
                    </span>
                    <span className="text-sm font-black text-cyan-600 font-mono">
                      {run.vo2max} <span className="text-[10px] font-normal text-neutral-400">ml/kg</span>
                    </span>
                  </div>
                )}

                {run.training_load && (
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Training Load
                    </span>
                    <span className="text-sm font-black text-neutral-900 font-mono">
                      {run.training_load}
                    </span>
                  </div>
                )}

                {run.recovery_hours && (
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Recovery Time
                    </span>
                    <span className="text-sm font-black text-neutral-900 font-mono">
                      {run.recovery_hours} <span className="text-[10px] font-normal text-neutral-400">hrs</span>
                    </span>
                  </div>
                )}

                {run.best_pace_seconds_per_km && (
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Best Pace
                    </span>
                    <span className="text-sm font-black text-neutral-900 font-mono">
                      {formatPace(run.best_pace_seconds_per_km, unitSystem, false)}
                    </span>
                  </div>
                )}

                {run.active_calories && (
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Active Calories
                    </span>
                    <span className="text-sm font-black text-orange-600 font-mono">
                      {run.active_calories} <span className="text-[10px] font-normal text-neutral-400">kcal</span>
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Screenshot Preview */}
          {run.screenshot_url && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Screenshot
              </span>
              <Card
                onClick={() => setShowScreenshotModal(true)}
                className="p-3 bg-neutral-900 text-white flex items-center justify-between cursor-pointer hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0">
                    <img
                      src={run.screenshot_url}
                      alt="Run Screenshot"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {run.distance_km} km {run.source}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {formatDate(run.date, 'full')}
                    </span>
                  </div>
                </div>
                <Maximize2 className="w-4 h-4 text-neutral-400 mr-1" />
              </Card>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MAP */}
      {activeTab === 'map' && (
        <div className="space-y-4 animate-in fade-in">
          {run.route_data ? (
            <>
              <RunMap
                routeData={run.route_data}
                elevationGain={run.elevation_gain_m}
                elevationLoss={run.elevation_loss_m}
                height="360px"
                showElevationProfile={true}
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-neutral-400 font-medium">
                  {run.route_data.coordinates.length} GPS Track Points
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  onClick={() => gpxInputRef.current?.click()}
                  className="text-xs font-bold"
                >
                  Replace GPX
                </Button>
              </div>
            </>
          ) : (
            <Card className="p-8 text-center space-y-4 bg-white border border-neutral-200/80">
              <div className="w-14 h-14 rounded-3xl bg-orange-50 text-[#FF5500] flex items-center justify-center mx-auto">
                <Compass className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">No GPS Route Attached</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                  You can upload a GPX file anytime to display your route map and elevation profile for this run.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={() => gpxInputRef.current?.click()}
                className="font-bold shadow-glow-orange"
              >
                Upload GPX File
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: SPLITS */}
      {activeTab === 'splits' && (
        <div className="animate-in fade-in">
          <SplitsTable
            splits={run.splits || run.route_data?.splits}
            avgPaceSeconds={run.pace_seconds_per_km}
            unitSystem={unitSystem}
          />
        </div>
      )}

      {/* TAB 4: CHARTS */}
      {activeTab === 'charts' && (
        <div className="animate-in fade-in">
          <RunCharts
            routeData={run.route_data}
            elevationPoints={run.elevationPoints || (run as any).elevation_points || run.route_data?.elevationPoints}
            heartRateZones={run.heart_rate_zones}
            avgPaceSeconds={run.pace_seconds_per_km}
            avgHeartRate={run.avg_heart_rate}
            cadence={run.cadence}
            unitSystem={unitSystem}
          />
        </div>
      )}

      {/* Screenshot Full Modal */}
      {showScreenshotModal && run.screenshot_url && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full bg-neutral-900 rounded-3xl p-4 overflow-hidden border border-neutral-800">
            <button
              onClick={() => setShowScreenshotModal(false)}
              className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={run.screenshot_url}
              alt="Full screenshot"
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Export JSON Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900">Export Single Run</h3>
              <button
                onClick={() => setShowJsonModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-900 text-neutral-200 rounded-2xl p-3 font-mono text-[11px] max-h-56 overflow-y-auto leading-relaxed">
              <pre>{JSON.stringify({ runs: [run] }, null, 2)}</pre>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleCopyJson}
                className="py-2.5 px-3 rounded-2xl border border-neutral-200 text-neutral-800 text-xs font-bold hover:bg-neutral-50 flex items-center justify-center space-x-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={handleDownloadJson}
                className="py-2.5 px-3 rounded-2xl bg-[#FF5500] text-white text-xs font-bold hover:bg-[#E64D00] flex items-center justify-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
