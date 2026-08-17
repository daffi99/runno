import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { X, Sparkles, Check } from 'lucide-react';
import { clsx } from 'clsx';


interface QuickPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: {
    selectedDays: string[];
    goal: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    customNotes?: string;
  }) => void;
  isLoading?: boolean;
}

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PRESET_GOALS = [
  { id: '10k', label: '10K Progression / PR', desc: 'Build threshold & stamina for 10K' },
  { id: '5k', label: '5K Speed & Finish', desc: 'Improve 5K time and aerobic speed' },
  { id: 'half', label: 'Half Marathon (21.1K)', desc: 'Progressive weekly long run buildup' },
  { id: 'base', label: 'Aerobic Base & Fitness', desc: 'Heart health & fat burning in Zone 2' },
];

export const QuickPlanModal: React.FC<QuickPlanModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isLoading = false,
}) => {
  // Default days: Tuesday, Thursday, Saturday
  const [selectedDays, setSelectedDays] = useState<string[]>(['Tuesday', 'Thursday', 'Saturday']);
  const [selectedGoal, setSelectedGoal] = useState<string>('10k');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [customGoalText, setCustomGoalText] = useState<string>('');

  if (!isOpen) return null;

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) return prev; // At least 1 day
        return prev.filter((d) => d !== day);
      } else {
        // Keep in natural weekday order
        const next = [...prev, day];
        return ALL_DAYS.filter((d) => next.includes(d));
      }
    });
  };

  const handleGenerate = () => {
    const goalObj = PRESET_GOALS.find((g) => g.id === selectedGoal);
    const goalText = customGoalText.trim() || goalObj?.label || '10K Progression';
    onGenerate({
      selectedDays,
      goal: goalText,
      level,
      customNotes: `Target days: ${selectedDays.join(', ')}. Level: ${level}. Goal: ${goalText}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90dvh] h-[85dvh] sm:h-auto sm:max-h-[85vh] flex flex-col shadow-2xl border border-neutral-100 overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-neutral-100 shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors shrink-0"
              title="Batal"
              aria-label="Batal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h3 className="text-base font-black text-neutral-900 truncate">
                Plan Setup Assistant
              </h3>
              <p className="text-[11px] text-neutral-400 font-medium truncate">
                Pick days & target goal
              </p>
            </div>
          </div>

          {/* Top Right Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-black shadow-glow-orange active:scale-95 transition-all shrink-0 ml-2"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>{isLoading ? 'Wait...' : 'Generate'}</span>
          </button>
        </div>


        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          {/* 1. Select Available Days */}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              1. Select Running Days ({selectedDays.length} days)
            </span>
            <span className="text-[11px] text-[#FF5500] font-bold">
              {selectedDays.map((d) => d.substring(0, 3)).join(' · ')}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {ALL_DAYS.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={clsx(
                    'py-2.5 px-1 rounded-xl text-xs font-bold transition-all duration-150 flex flex-col items-center justify-center border',
                    isSelected
                      ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-soft-sm scale-[1.02]'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200/80 hover:bg-neutral-100'
                  )}
                >
                  <span className="text-[10px] uppercase font-semibold">
                    {day.substring(0, 3)}
                  </span>
                  {isSelected && <Check className="w-3 h-3 mt-0.5 stroke-[3]" />}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-neutral-400">
            Coach will schedule rest and recovery sessions on the remaining days.
          </p>
        </div>

        {/* 2. Select Goal */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            2. Running Target & Focus
          </span>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_GOALS.map((g) => {
              const isSelected = selectedGoal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setSelectedGoal(g.id);
                    setCustomGoalText('');
                  }}
                  className={clsx(
                    'p-3 rounded-2xl text-left border transition-all duration-150',
                    isSelected
                      ? 'bg-orange-50/70 border-[#FF5500] ring-1 ring-[#FF5500] text-neutral-900'
                      : 'bg-neutral-50 border-neutral-200/80 text-neutral-600 hover:bg-neutral-100'
                  )}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>{g.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1 line-clamp-2 leading-tight">
                    {g.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-1">
            <input
              type="text"
              placeholder="Or write custom goal (e.g. Sub-45 min 10K, Marathon pacing)..."
              value={customGoalText}
              onChange={(e) => {
                setCustomGoalText(e.target.value);
                if (e.target.value) setSelectedGoal('custom');
              }}
              className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20"
            />
          </div>
        </div>

        {/* 3. Fitness Level */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            3. Experience Level
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => {
              const isSelected = level === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={clsx(
                    'py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all border text-center',
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  )}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>
        </div>

        {/* Action button - Pinned Sticky Footer */}
        <div className="p-4 border-t border-neutral-100 bg-white shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            onClick={handleGenerate}
            leftIcon={<Sparkles className="w-4 h-4" />}
            className="font-bold text-sm shadow-glow-orange rounded-2xl py-3.5"
          >
            Generate AI Training Plan
          </Button>
        </div>
      </div>
    </div>
  );
};

