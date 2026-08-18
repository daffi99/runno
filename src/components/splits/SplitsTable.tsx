import React from 'react';
import type { Split, UnitSystem } from '../../types/run';
import { formatPace, formatDuration } from '../../utils/formatters';
import { ListOrdered, Layers, Heart } from 'lucide-react';
import { clsx } from 'clsx';

interface SplitsTableProps {
  splits?: Split[] | null;
  avgPaceSeconds?: number | null;
  unitSystem?: UnitSystem;
  onUploadInterval?: () => void;
}

export const SplitsTable: React.FC<SplitsTableProps> = ({
  splits = [],
  avgPaceSeconds,
  unitSystem = 'metric',
  onUploadInterval,
}) => {
  const validSplits = splits || [];

  if (validSplits.length === 0) {
    return (
      <div className="bg-[#1E1E1E] rounded-3xl p-8 border border-white/5 shadow-soft text-center my-4 space-y-3">
        <div className="w-12 h-12 rounded-full bg-[#FF5500]/15 text-[#FF5500] flex items-center justify-center mx-auto">
          <ListOrdered className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">No split breakdown available</p>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-0.5">
            Splits are automatically populated when visible in screenshot or attached from interval screens.
          </p>
        </div>
        {onUploadInterval && (
          <div className="pt-1">
            <button
              onClick={onUploadInterval}
              className="px-4 py-2 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 rounded-xl text-xs font-bold transition-all active:scale-95 border border-indigo-500/30 inline-flex items-center space-x-1.5 shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Upload Interval Splits Screenshot</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  const isIntervalTable = validSplits.some(
    (s) => s.type || s.duration_seconds || (s.distance_km !== undefined && s.distance_km < 0.95)
  );

  const paces = validSplits.map((s) => s.pace_seconds).filter((p) => p > 0);
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const paceRange = maxPace - minPace || 1;

  if (isIntervalTable) {
    return (
      <div className="space-y-4">
        <div className="bg-[#1E1E1E] rounded-3xl p-4 sm:p-5 border border-white/5 shadow-soft overflow-x-auto">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 px-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Interval Segments Table
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                {validSplits.length} Reps/Laps
              </span>
            </div>
          </div>

          <div className="min-w-[340px] divide-y divide-white/5 text-xs">
            <div className="grid grid-cols-12 py-2.5 px-1 font-bold uppercase tracking-wider text-neutral-400 text-[11px]">
              <div className="col-span-1 text-left">#</div>
              <div className="col-span-3 text-left">Type</div>
              <div className="col-span-2 text-right">Dist</div>
              <div className="col-span-2 text-right">Time</div>
              <div className="col-span-2 text-right">Pace</div>
              <div className="col-span-2 text-right">Avg HR</div>
            </div>

            {validSplits.map((split, index) => {
              const isRun = split.type?.toLowerCase() === 'run';
              const isRest = split.type?.toLowerCase() === 'rest';

              const distLabel = split.distance_km !== undefined && split.distance_km !== null
                ? split.distance_km < 1
                  ? `${Math.round(split.distance_km * 1000)}m`
                  : `${split.distance_km.toFixed(2)}km`
                : '--';

              return (
                <div
                  key={index}
                  className={clsx(
                    "grid grid-cols-12 items-center py-2.5 px-1 rounded-xl transition-colors font-mono",
                    isRun ? "bg-[#FF5500]/10 hover:bg-[#FF5500]/15" : "hover:bg-white/5"
                  )}
                >
                  <div className="col-span-1 font-bold text-neutral-200">
                    {split.km}
                  </div>

                  <div className="col-span-3">
                    <span
                      className={clsx(
                        "px-2 py-0.5 text-[10px] font-black rounded-md inline-block tracking-wider uppercase font-sans",
                        isRun && "bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30",
                        isRest && "bg-indigo-950/60 text-indigo-300 border border-indigo-500/30",
                        !isRun && !isRest && "bg-[#252525] text-neutral-300"
                      )}
                    >
                      {split.type || 'Lap'}
                    </span>
                  </div>

                  <div className="col-span-2 text-right font-bold text-white">
                    {distLabel}
                  </div>

                  <div className="col-span-2 text-right font-semibold text-neutral-300">
                    {split.duration_seconds ? formatDuration(split.duration_seconds) : '--'}
                  </div>

                  <div className="col-span-2 text-right font-bold text-white">
                    {split.pace_seconds ? formatPace(split.pace_seconds, unitSystem, false) : '--'}
                  </div>

                  <div className="col-span-2 text-right font-semibold">
                    {split.avg_heart_rate ? (
                      <span className="text-rose-400 font-bold flex items-center justify-end gap-0.5">
                        <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400 shrink-0" />
                        {split.avg_heart_rate}
                      </span>
                    ) : (
                      <span className="text-neutral-500">--</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {avgPaceSeconds && (
          <div className="bg-[#1E1E1E] rounded-3xl p-5 border border-white/5 shadow-soft flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Workout Average Pace
            </span>
            <div className="text-right">
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                {formatPace(avgPaceSeconds, unitSystem, false)}
              </span>
              <span className="text-xs font-bold text-neutral-400 ml-1">
                /{unitSystem === 'metric' ? 'km' : 'mi'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#1E1E1E] rounded-3xl p-4 sm:p-5 border border-white/5 shadow-soft">
        <div className="grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-neutral-400 pb-3 border-b border-white/5 px-1">
          <div className="col-span-2 text-left">KM</div>
          <div className="col-span-7 text-left">Pace</div>
          <div className="col-span-3 text-right">Elev (m)</div>
        </div>

        <div className="divide-y divide-white/5">
          {validSplits.map((split, index) => {
            const relativeScore = 1 - (split.pace_seconds - minPace) / paceRange;
            const barWidthPercent = Math.max(35, Math.min(100, Math.round(40 + relativeScore * 60)));
            const isFastest = split.pace_seconds === minPace && paces.length > 1;

            return (
              <div
                key={index}
                className="grid grid-cols-12 items-center py-3.5 px-1 hover:bg-white/5 rounded-xl transition-colors"
              >
                <div className="col-span-2 text-sm font-bold text-white font-mono">
                  {split.km}
                </div>

                <div className="col-span-7 flex items-center space-x-3">
                  <span className="text-sm font-semibold text-neutral-200 w-12 font-mono">
                    {formatPace(split.pace_seconds, unitSystem, false)}
                  </span>
                  <div className="flex-1 bg-[#252525] rounded-full h-3.5 max-w-[130px] overflow-hidden">
                    <div
                      style={{ width: `${barWidthPercent}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFastest ? 'bg-[#FF5500]' : 'bg-[#FF884D]'
                      }`}
                    />
                  </div>
                </div>

                <div className="col-span-3 text-right text-xs font-semibold">
                  {split.elevation_diff_m !== undefined && split.elevation_diff_m !== null ? (
                    <span
                      className={
                        split.elevation_diff_m > 0
                          ? 'text-emerald-400'
                          : split.elevation_diff_m < 0
                          ? 'text-rose-400'
                          : 'text-neutral-400'
                      }
                    >
                      {split.elevation_diff_m > 0 ? `+${split.elevation_diff_m}` : split.elevation_diff_m}
                      <span className="text-[10px] text-neutral-400 ml-0.5">m</span>
                    </span>
                  ) : (
                    <span className="text-neutral-500">--</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {avgPaceSeconds && (
        <div className="bg-[#1E1E1E] rounded-3xl p-5 border border-white/5 shadow-soft flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Average Pace
          </span>
          <div className="text-right">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              {formatPace(avgPaceSeconds, unitSystem, false)}
            </span>
            <span className="text-xs font-bold text-neutral-400 ml-1">
              /{unitSystem === 'metric' ? 'km' : 'mi'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
