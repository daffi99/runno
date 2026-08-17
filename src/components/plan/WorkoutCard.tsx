import React, { useState } from 'react';
import type { PlanWorkout, UnitSystem } from '../../types/run';
import { formatDistance, formatPace, formatWorkoutDate, getDateForDayOfWeek } from '../../utils/formatters';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  CheckCircle2,
  Circle,
  Zap,
  Flame,
  Heart,
  Moon,
  ExternalLink,
  Info,
  X,
  Pencil,
} from 'lucide-react';
import { clsx } from 'clsx';

interface WorkoutCardProps {
  workout: PlanWorkout;
  unitSystem: UnitSystem;
  isToday?: boolean;
  date?: string | Date;
  onToggleComplete?: (workoutId: string) => void;
  onSelectWorkout?: (workout: PlanWorkout) => void;
  onSelectRun?: (runId: string) => void;
  onEditWorkout?: (workout: PlanWorkout) => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  unitSystem,
  isToday = false,
  date,
  onToggleComplete,
  onSelectWorkout,
  onSelectRun,
  onEditWorkout,
}) => {

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const isRestOrRecovery = workout.type === 'rest' || workout.type === 'recovery' || workout.distanceKm === 0;

  const displayDateStr = (() => {
    if (workout.date) return formatWorkoutDate(workout.date);
    if (date) return formatWorkoutDate(date);
    if (typeof workout.dayOfWeek === 'number') {
      const calculated = getDateForDayOfWeek(workout.dayOfWeek);
      return formatWorkoutDate(calculated);
    }
    return '';
  })();

  const getTypeIcon = () => {
    switch (workout.type) {
      case 'tempo':
      case 'intervals':
      case 'race':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'long_run':
        return <Flame className="w-3.5 h-3.5 text-[#FF5500]" />;
      case 'recovery':
      case 'easy':
        return <Heart className="w-3.5 h-3.5 text-emerald-500" />;
      case 'rest':
      default:
        return <Moon className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return (
    <>
      <Card
        className={clsx(
          'p-3 transition-all duration-200 border relative overflow-hidden',
          isToday ? 'ring-2 ring-[#FF5500] border-[#FF5500]/30 shadow-md bg-white' : 'bg-white/80 hover:bg-white',
          workout.completed && !isRestOrRecovery && 'bg-emerald-50/40 border-emerald-200/80',
          isRestOrRecovery && !isToday && 'bg-neutral-50/60 border-dashed border-neutral-200 opacity-90'
        )}
      >
        {isToday && (
          <div className="absolute top-0 right-0">
            <span className="bg-[#FF5500] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-bl-xl shadow-xs">
              Today
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-2.5">
          {/* Left: Completion Checkbox / Rest Icon */}
          {!isRestOrRecovery ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete?.(workout.id);
              }}
              className="mt-0.5 text-neutral-300 hover:text-emerald-500 active:scale-95 transition-transform shrink-0 focus:outline-none"
              aria-label={workout.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {workout.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
              ) : (
                <Circle className="w-5 h-5 text-neutral-300 hover:text-neutral-400" />
              )}
            </button>
          ) : (
            <div className="mt-0.5 w-5 h-5 rounded-full bg-neutral-100/80 flex items-center justify-center text-neutral-400 shrink-0">
              <Moon className="w-3 h-3 text-neutral-400" />
            </div>
          )}

          {/* Middle: Details */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              if (workout.completedRunId) {
                onSelectRun?.(workout.completedRunId);
              } else {
                onSelectWorkout?.(workout);
              }
            }}
          >
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className={clsx(
                'text-[11px] font-bold uppercase tracking-wider',
                isToday ? 'text-[#FF5500]' : 'text-neutral-500'
              )}>
                {workout.dayName}
              </span>
              {displayDateStr && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className={clsx(
                    'text-[11px] font-bold',
                    isToday ? 'text-[#FF5500]' : 'text-neutral-400'
                  )}>
                    {displayDateStr}
                  </span>
                </>
              )}
              <span className="text-neutral-300">·</span>
              <span className={clsx(
                'text-[10px] font-semibold flex items-center gap-1 uppercase tracking-tight',
                workout.type === 'long_run' && 'text-[#FF5500]',
                (workout.type === 'tempo' || workout.type === 'intervals') && 'text-amber-600',
                (workout.type === 'easy' || workout.type === 'recovery') && 'text-emerald-600',
                workout.type === 'rest' && 'text-neutral-400'
              )}>
                {getTypeIcon()}
                {workout.type.replace('_', ' ')}
              </span>
            </div>

            <h4 className={clsx(
              'text-sm font-black text-neutral-900 mt-0.5 tracking-tight line-clamp-1 pr-6',
              workout.completed && 'line-through text-neutral-500'
            )}>
              {workout.title}
            </h4>

            {/* Metrics summary */}
            {!isRestOrRecovery && (
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs font-mono pr-6">
                <span className="font-bold text-neutral-800">
                  {formatDistance(workout.distanceKm, unitSystem, true)}
                </span>

                {workout.targetPaceSecPerKm && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span className="text-neutral-500 text-[11px]">
                      Target {formatPace(workout.targetPaceSecPerKm, unitSystem, false)}/{unitSystem === 'metric' ? 'km' : 'mi'}
                    </span>
                  </>
                )}

                {workout.targetHrZone && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span className="text-neutral-500 text-[11px]">
                      {workout.targetHrZone}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Sync badge if completed */}
            {workout.completed && !isRestOrRecovery && (
              <div className="mt-2 flex items-center justify-between pr-6">
                {workout.completedRunId ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (workout.completedRunId) {
                        onSelectRun?.(workout.completedRunId);
                      }
                    }}
                    className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-xl transition-all active:scale-95 shadow-xs cursor-pointer group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Synced with logged run</span>
                    <ExternalLink className="w-3 h-3 text-emerald-600 opacity-70 group-hover:opacity-100 transition-opacity ml-0.5" />
                  </button>
                ) : (
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-md w-fit">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Completed</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Right: Quick Actions (Edit & Info) */}
        <div className="absolute bottom-2 right-2 flex items-center space-x-1">
          {onEditWorkout && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditWorkout(workout);
              }}
              className="p-1.5 rounded-full text-neutral-300 hover:text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-all"
              aria-label="Edit workout"
              title="Edit Sesi Latihan"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          {workout.description && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsInfoOpen(true);
              }}
              className="p-1.5 rounded-full text-neutral-300 hover:text-[#FF5500] hover:bg-orange-50 active:scale-95 transition-all"
              aria-label="View workout instructions"
              title="Workout Details & Description"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </Card>



      {/* Workout Description & Info Modal */}
      {isInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setIsInfoOpen(false);
          }}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-neutral-200/80 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#FF5500] flex items-center justify-center shadow-soft-xs">
                  {getTypeIcon()}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    {workout.dayName} {displayDateStr ? `· ${displayDateStr}` : ''}
                  </span>
                  <h3 className="text-base font-black text-neutral-900 tracking-tight leading-snug">
                    {workout.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics summary inside modal */}
            {!isRestOrRecovery && (
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-around text-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Distance</div>
                  <div className="text-sm font-black text-neutral-900 font-mono">
                    {formatDistance(workout.distanceKm, unitSystem, true)}
                  </div>
                </div>
                {workout.targetPaceSecPerKm && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-400">Target Pace</div>
                    <div className="text-sm font-black text-neutral-900 font-mono">
                      {formatPace(workout.targetPaceSecPerKm, unitSystem, false)}/{unitSystem === 'metric' ? 'km' : 'mi'}
                    </div>
                  </div>
                )}
                {workout.targetHrZone && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-400">Target Zone</div>
                    <div className="text-xs font-bold text-neutral-800 mt-0.5">
                      {workout.targetHrZone}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description text */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Coach Instructions
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-100">
                {workout.description}
              </p>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsInfoOpen(false)}
              className="w-full font-bold text-xs rounded-2xl py-2.5"
            >
              Tutup
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

