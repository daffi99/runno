import React from 'react';
import type { Split, UnitSystem } from '../../types/run';
import { formatPace } from '../../utils/formatters';
import { ListOrdered } from 'lucide-react';

interface SplitsTableProps {
  splits?: Split[] | null;
  avgPaceSeconds?: number | null;
  unitSystem?: UnitSystem;
}

export const SplitsTable: React.FC<SplitsTableProps> = ({
  splits = [],
  avgPaceSeconds,
  unitSystem = 'metric',
}) => {
  const validSplits = splits || [];

  if (validSplits.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-soft text-center my-4 space-y-2">
        <div className="w-12 h-12 rounded-full bg-orange-50 text-[#FF5500] flex items-center justify-center mx-auto">
          <ListOrdered className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-neutral-800">No split breakdown available</p>
        <p className="text-xs text-neutral-400 max-w-xs mx-auto">
          Splits are automatically populated when visible in the screenshot or calculated from an attached GPX file.
        </p>
      </div>
    );
  }

  const paces = validSplits.map((s) => s.pace_seconds).filter((p) => p > 0);
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const paceRange = maxPace - minPace || 1;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-soft">
        <div className="grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-neutral-400 pb-3 border-b border-neutral-100 px-1">
          <div className="col-span-2 text-left">KM</div>
          <div className="col-span-7 text-left">Pace</div>
          <div className="col-span-3 text-right">Elev (m)</div>
        </div>

        <div className="divide-y divide-neutral-50">
          {validSplits.map((split, index) => {
            const relativeScore = 1 - (split.pace_seconds - minPace) / paceRange;
            const barWidthPercent = Math.max(35, Math.min(100, Math.round(40 + relativeScore * 60)));
            const isFastest = split.pace_seconds === minPace && paces.length > 1;

            return (
              <div
                key={index}
                className="grid grid-cols-12 items-center py-3.5 px-1 hover:bg-neutral-50/60 rounded-xl transition-colors"
              >
                <div className="col-span-2 text-sm font-bold text-neutral-800 font-mono">
                  {split.km}
                </div>

                <div className="col-span-7 flex items-center space-x-3">
                  <span className="text-sm font-semibold text-neutral-700 w-12 font-mono">
                    {formatPace(split.pace_seconds, unitSystem, false)}
                  </span>
                  <div className="flex-1 bg-neutral-100 rounded-full h-3.5 max-w-[130px] overflow-hidden">
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
                          ? 'text-emerald-600'
                          : split.elevation_diff_m < 0
                          ? 'text-rose-500'
                          : 'text-neutral-400'
                      }
                    >
                      {split.elevation_diff_m > 0 ? `+${split.elevation_diff_m}` : split.elevation_diff_m}
                      <span className="text-[10px] text-neutral-400 ml-0.5">m</span>
                    </span>
                  ) : (
                    <span className="text-neutral-300">--</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {avgPaceSeconds && (
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-soft flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Average Pace
          </span>
          <div className="text-right">
            <span className="text-2xl font-black text-neutral-900 font-mono tracking-tight">
              {formatPace(avgPaceSeconds, unitSystem, false)}
            </span>
            <span className="text-xs font-bold text-neutral-500 ml-1">
              /{unitSystem === 'metric' ? 'km' : 'mi'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
