import { pgTable, text, timestamp, real, integer, jsonb } from 'drizzle-orm/pg-core';

export const runs = pgTable('runs', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  source: text('source').notNull().default('Huawei Health'),
  distance_km: real('distance_km').notNull(),
  duration_seconds: integer('duration_seconds').notNull(),
  pace_seconds_per_km: integer('pace_seconds_per_km'),
  avg_speed_kmh: real('avg_speed_kmh'),
  avg_heart_rate: integer('avg_heart_rate'),
  max_heart_rate: integer('max_heart_rate'),
  cadence: integer('cadence'),
  elevation_gain_m: integer('elevation_gain_m'),
  elevation_loss_m: integer('elevation_loss_m'),
  calories: integer('calories'),
  
  // Huawei Health & Advanced Running Dynamics Variables
  total_steps: integer('total_steps'),
  stride_length_cm: real('stride_length_cm'),
  ground_contact_time_ms: integer('ground_contact_time_ms'),
  vertical_oscillation_cm: real('vertical_oscillation_cm'),
  ground_contact_balance: text('ground_contact_balance'),
  aerobic_te: real('aerobic_te'),
  anaerobic_te: real('anaerobic_te'),
  vo2max: real('vo2max'),
  training_load: real('training_load'),
  recovery_hours: integer('recovery_hours'),
  active_calories: integer('active_calories'),
  best_pace_seconds_per_km: integer('best_pace_seconds_per_km'),
  max_cadence: integer('max_cadence'),
  
  // Screenshot-extracted Splits, Chart series, and HR Zones
  splits: jsonb('splits'),
  elevation_points: jsonb('elevation_points'),
  heart_rate_zones: jsonb('heart_rate_zones'),

  screenshot_url: text('screenshot_url'),
  route_data: jsonb('route_data'),
  extra_metrics: jsonb('extra_metrics'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const trainingPlans = pgTable('training_plans', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  goal: text('goal').notNull(),
  schedule_summary: text('schedule_summary').notNull(),
  selected_days: jsonb('selected_days').notNull(),
  weekly_target_km: real('weekly_target_km').notNull(),
  total_weeks: integer('total_weeks').notNull().default(4),
  current_week: integer('current_week').notNull().default(1),
  fitness_level: text('fitness_level').notNull().default('intermediate'),
  status: text('status').notNull().default('active'),
  workouts: jsonb('workouts').notNull(),
  ai_advice: text('ai_advice'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const coachMessagesTable = pgTable('coach_messages', {
  id: text('id').primaryKey(),
  messages: jsonb('messages').notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type RunRecord = typeof runs.$inferSelect;
export type NewRunRecord = typeof runs.$inferInsert;
export type TrainingPlanRecord = typeof trainingPlans.$inferSelect;
export type NewTrainingPlanRecord = typeof trainingPlans.$inferInsert;
export type CoachMessageRecord = typeof coachMessagesTable.$inferSelect;


