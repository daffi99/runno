export interface Split {
  km: number;
  pace_seconds: number;
  elevation_diff_m?: number;
  cumulative_time_seconds?: number;
  type?: string; // 'Run', 'Rest', 'Warmup', 'Cooldown', 'Other'
  duration_seconds?: number;
  distance_km?: number;
  avg_heart_rate?: number;
}


export interface ElevationPoint {
  distance_km: number;
  elevation_m: number;
  pace_seconds?: number;
  heart_rate?: number;
  cadence?: number;
}

export interface HeartRateZone {
  zone: number;
  name: string; // "Extreme", "Anaerobic", "Aerobic", "Fat Burning", "Warm Up"
  percentage: number; // e.g. 42
  duration_seconds?: number; // e.g. 1530
  bpm_range?: string; // e.g. "155 - 172"
}

export interface RouteData {
  coordinates: [number, number][]; // [lat, lng]
  elevations?: number[];
  timestamps?: string[];
  bounds?: [[number, number], [number, number]]; // [[minLat, minLng], [maxLat, maxLng]]
  elevationPoints?: ElevationPoint[];
  splits?: Split[];
  startPoint?: [number, number];
  finishPoint?: [number, number];
  totalGpxDistanceKm?: number;
}

export interface Run {
  id: string;
  date: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  source: string; // Huawei Health, Amazfit, Garmin, Strava, Apple Fitness, Nike Run Club, Zepp, Coros, Other
  distance_km: number;
  duration_seconds: number;
  pace_seconds_per_km: number | null;
  avg_speed_kmh: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  cadence: number | null;
  elevation_gain_m: number | null;
  elevation_loss_m: number | null;
  calories: number | null;
  
  // Advanced Huawei Health & Running Dynamics Variables
  total_steps?: number | null;
  stride_length_cm?: number | null;
  ground_contact_time_ms?: number | null;
  vertical_oscillation_cm?: number | null;
  ground_contact_balance?: string | null;
  aerobic_te?: number | null;
  anaerobic_te?: number | null;
  vo2max?: number | null;
  training_load?: number | null;
  recovery_hours?: number | null;
  active_calories?: number | null;
  best_pace_seconds_per_km?: number | null;
  max_cadence?: number | null;
  
  // Extracted Splits and Chart Data (from screenshot or GPX)
  splits?: Split[] | null;
  elevationPoints?: ElevationPoint[] | null;
  heart_rate_zones?: HeartRateZone[] | null;

  screenshot_url?: string | null;
  route_data?: RouteData | null;
  extra_metrics?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedRunData {
  date: string | null;
  source: string | null;
  distance_km: number | null;
  duration_seconds: number | null;
  pace_seconds_per_km: number | null;
  avg_speed_kmh: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  cadence: number | null;
  elevation_gain_m: number | null;
  elevation_loss_m: number | null;
  calories: number | null;
  
  // Advanced Huawei Health & Running Dynamics Variables
  total_steps?: number | null;
  stride_length_cm?: number | null;
  ground_contact_time_ms?: number | null;
  vertical_oscillation_cm?: number | null;
  ground_contact_balance?: string | null;
  aerobic_te?: number | null;
  anaerobic_te?: number | null;
  vo2max?: number | null;
  training_load?: number | null;
  recovery_hours?: number | null;
  active_calories?: number | null;
  best_pace_seconds_per_km?: number | null;
  max_cadence?: number | null;
  
  // Extracted Splits and Chart Series from screenshot
  splits?: Split[] | null;
  elevationPoints?: ElevationPoint[] | null;
  heart_rate_zones?: HeartRateZone[] | null;

  raw_notes?: string | null;
}

export type UnitSystem = 'metric' | 'imperial';

export * from './plan';

