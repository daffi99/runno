export type WorkoutType =
  | 'easy'
  | 'tempo'
  | 'intervals'
  | 'long_run'
  | 'recovery'
  | 'rest'
  | 'race'
  | 'cross_train';

export interface PlanWorkout {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  dayName: string; // 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  date?: string | null; // e.g. "2026-08-16"
  title: string; // e.g. "5K Tempo Pace Run"
  type: WorkoutType;
  distanceKm: number; // e.g. 5.0 (0 for rest days)
  targetPaceSecPerKm?: number | null; // e.g. 330 (5:30/km)
  targetHrZone?: string | null; // e.g. "Zone 2 (Aerobic)" or "Zone 4 (Threshold)"
  description: string; // e.g. "1km warmup, 3km steady tempo @ 5:30/km, 1km cooldown"
  completed?: boolean;
  completedRunId?: string | null;
  completedAt?: string | null;
}

export interface TrainingPlan {
  id: string;
  title: string; // e.g. "10K Progression Plan - 3 Days/Week"
  goal: string; // e.g. "Sub-50 min 10K"
  scheduleSummary: string; // e.g. "Tuesday, Thursday, Saturday"
  selectedDays: string[]; // e.g. ['Tuesday', 'Thursday', 'Saturday']
  startDate?: string | null; // e.g. "2026-08-11"
  weeklyTargetKm: number; // Total weekly distance in km
  totalWeeks: number; // e.g. 4
  currentWeek: number; // e.g. 1
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  status: 'active' | 'completed' | 'archived';
  workouts: PlanWorkout[]; // Default / active week workouts
  weeklySchedules?: Record<number, PlanWorkout[]>; // Independent workouts per week (Week 1, Week 2, Week 3, etc.)
  aiAdvice?: string; // Strategic coaching tips
  createdAt: string;
  updatedAt: string;
}



export interface AICoachMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedPlan?: TrainingPlan | null;
  debugInfo?: {
    endpoint?: string;
    status?: number | string;
    environment?: string;
    openRouterKeyLength?: number;
    openRouterKeyPrefix?: string;
    hasApiKey?: boolean;
    hasServerEnvKey?: boolean;
    serverKeyPrefix?: string;
    hasCustomClientKey?: boolean;
    modelUsed?: string;
    errorName?: string;
    rawError?: string | any;
    clientTimestamp?: string;
    [key: string]: any;
  } | null;
}


