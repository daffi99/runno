import React from 'react';
import type { TrainingPlan, UnitSystem } from '../../types/run';
import { formatDistance, formatWorkoutDate, getDateForDayOfWeek } from '../../utils/formatters';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Check, Sparkles, Target } from 'lucide-react';



interface PlanCardProps {
  plan: TrainingPlan;
  unitSystem: UnitSystem;
  isActive?: boolean;
  onApplyPlan?: (plan: TrainingPlan) => void;
  onViewDetails?: (plan: TrainingPlan) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  unitSystem,
  isActive = false,
  onApplyPlan,
  onViewDetails,
}) => {
  const runningWorkouts = plan.workouts.filter((w) => w.type !== 'rest' && w.distanceKm > 0);

  return (
    <Card className="p-4 bg-white border border-neutral-200/90 shadow-soft-md space-y-3.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center space-x-1.5 mb-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-orange-50 text-[#FF5500] px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              AI Running Plan
            </span>
            {isActive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" />
                Active Plan
              </span>
            )}
          </div>
          <h3 className="text-base font-black text-neutral-900 tracking-tight">
            {plan.title}
          </h3>
          <p className="text-xs text-neutral-500 font-medium mt-0.5 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-neutral-400" />
            {plan.goal}
          </p>
        </div>
      </div>

      {/* Highlights / Badges */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
            Schedule
          </span>
          <span className="text-xs font-bold text-neutral-800 line-clamp-1 mt-0.5">
            {plan.scheduleSummary}
          </span>
        </div>

        <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
            Weekly Volume
          </span>
          <span className="text-xs font-bold text-[#FF5500] mt-0.5 block font-mono">
            {formatDistance(plan.weeklyTargetKm, unitSystem, true)}
          </span>
        </div>
      </div>

      {/* Workouts Preview List */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
          Key Sessions This Week
        </span>
        <div className="space-y-1">
          {runningWorkouts.map((w) => {
            const dateStr = w.date
              ? formatWorkoutDate(w.date)
              : (typeof w.dayOfWeek === 'number' ? formatWorkoutDate(getDateForDayOfWeek(w.dayOfWeek)) : '');

            return (
              <div
                key={w.id || w.dayName}
                className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-neutral-50/70 rounded-lg border border-neutral-100/80"
              >
                <div className="flex items-center space-x-1.5 min-w-0 pr-2">
                  <span className="font-bold text-neutral-900 shrink-0 text-[11px]">
                    {w.dayName}
                  </span>
                  {dateStr && (
                    <>
                      <span className="text-neutral-300 text-[10px]">·</span>
                      <span className="text-neutral-500 font-semibold text-[10px] shrink-0">
                        {dateStr}
                      </span>
                    </>
                  )}
                  <span className="text-neutral-300 text-[10px]">·</span>
                  <span className="text-neutral-600 truncate text-[11px]">
                    {w.title}
                  </span>
                </div>
                <span className="font-mono font-bold text-[#FF5500] text-[11px] shrink-0">
                  {formatDistance(w.distanceKm, unitSystem, true)}
                </span>
              </div>
            );
          })}

        </div>
      </div>

      {/* AI Coach Advice Box */}
      {plan.aiAdvice && (
        <div className="p-2.5 rounded-xl bg-orange-50/60 border border-orange-100 text-xs text-neutral-700 space-y-1">
          <div className="flex items-center space-x-1.5 text-[#FF5500] font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Coach Note</span>
          </div>
          <p className="text-[11px] leading-relaxed text-neutral-600">
            {plan.aiAdvice}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 flex items-center space-x-2">
        {!isActive ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onApplyPlan?.(plan)}
            leftIcon={<Check className="w-3.5 h-3.5" />}
            className="flex-1 font-bold text-xs shadow-glow-orange"
          >
            Apply to My Schedule
          </Button>
        ) : (
          <div className="flex-1 text-center py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" />
            Currently Active
          </div>
        )}

        {onViewDetails && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(plan)}
            className="text-xs font-semibold"
          >
            Details
          </Button>
        )}
      </div>
    </Card>
  );
};
