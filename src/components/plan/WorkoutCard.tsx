import React from 'react';
import type { PlanWorkout, UnitSystem } from '../../types/run';
import { formatDistance, formatPace, formatWorkoutDate, getDateForDayOfWeek } from '../../utils/formatters';
import { Card } from '../ui/Card';
import {
  CheckCircle2,
  Circle,
  Zap,
  Flame,
  Heart,
  Moon,
  ExternalLink,
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
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  unitSystem,
  isToday = false,
  date,
  onToggleComplete,
  onSelectWorkout,
  onSelectRun,
}) => {

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
    <Card
      className={clsx(
        'p-3.5 transition-all duration-200 border relative overflow-hidden',
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
        {/* Left: Completion Checkbox (Only for active running sessions, NOT rest/recovery) */}
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
            'text-sm font-black text-neutral-900 mt-0.5 tracking-tight line-clamp-1',
            workout.completed && 'line-through text-neutral-500'
          )}>
            {workout.title}
          </h4>

          {workout.description && (
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed line-clamp-2">
              {workout.description}
            </p>
          )}

          {/* Metrics summary */}
          {!isRestOrRecovery && (

            <div className="flex flex-wrap items-center gap-2 mt-2 pt-1 border-t border-neutral-100 text-xs font-mono">
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
            <div className="mt-2.5 flex items-center justify-between">
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

    </Card>
  );
};
