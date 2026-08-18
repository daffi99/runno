import type { UnitSystem } from '../types/run';

/**
 * Format duration in seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds <= 0) {
    return '--:--';
  }

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format pace in seconds/km to "M:SS /km" or "M:SS /mi"
 */
export function formatPace(
  secondsPerKm: number | null | undefined,
  unit: UnitSystem = 'metric',
  includeSuffix: boolean = true
): string {
  if (secondsPerKm === null || secondsPerKm === undefined || isNaN(secondsPerKm) || secondsPerKm <= 0) {
    return includeSuffix ? `--:-- /${unit === 'metric' ? 'km' : 'mi'}` : '--:--';
  }

  let sec = secondsPerKm;
  if (unit === 'imperial') {
    sec = secondsPerKm * 1.60934;
  }

  const mins = Math.floor(sec / 60);
  const secs = Math.round(sec % 60);
  const paceStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  if (!includeSuffix) return paceStr;
  return `${paceStr} /${unit === 'metric' ? 'km' : 'mi'}`;
}

/**
 * Format distance according to unit system
 */
export function formatDistance(
  km: number | null | undefined,
  unit: UnitSystem = 'metric',
  showUnit: boolean = true
): string {
  if (km === null || km === undefined || isNaN(km)) {
    return showUnit ? `0.00 ${unit === 'metric' ? 'km' : 'mi'}` : '0.00';
  }

  const dist = unit === 'imperial' ? km * 0.621371 : km;
  const numStr = dist.toFixed(2);

  if (!showUnit) return numStr;
  return `${numStr} ${unit === 'metric' ? 'km' : 'mi'}`;
}

/**
 * Format speed according to unit system
 */
export function formatSpeed(
  kmh: number | null | undefined,
  unit: UnitSystem = 'metric',
  showUnit: boolean = true
): string {
  if (kmh === null || kmh === undefined || isNaN(kmh) || kmh <= 0) {
    return showUnit ? `0.00 ${unit === 'metric' ? 'km/h' : 'mph'}` : '0.00';
  }

  const speed = unit === 'imperial' ? kmh * 0.621371 : kmh;
  const numStr = speed.toFixed(2);

  if (!showUnit) return numStr;
  return `${numStr} ${unit === 'metric' ? 'km/h' : 'mph'}`;
}

/**
 * Format date nicely
 */
export function formatDate(
  dateStr: string | null | undefined,
  formatType: 'short' | 'full' | 'monthYear' | 'isoDate' = 'short'
): string {
  if (!dateStr) return 'Unknown Date';

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    if (formatType === 'monthYear') {
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (formatType === 'full') {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });
    }

    if (formatType === 'isoDate') {
      return d.toISOString().split('T')[0];
    }

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Convert string "01:01:39" or "45:20" to total seconds
 */
export function parseDurationToSeconds(str: string | null | undefined): number | null {
  if (!str) return null;
  const clean = str.trim().replace(/[^\d:]/g, '');
  const parts = clean.split(':').map(Number);

  if (parts.some(isNaN)) return null;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return null;
}

/**
 * Convert pace string "6:30" or "9:32/km" to seconds per km
 */
export function parsePaceToSeconds(str: string | null | undefined): number | null {
  if (!str) return null;
  const clean = str.split('/')[0].trim().replace(/[^\d:]/g, '');
  return parseDurationToSeconds(clean);
}

/**
 * Calculate pace from distance (km) and duration (seconds)
 */
export function calculatePaceSeconds(distanceKm: number, durationSec: number): number | null {
  if (distanceKm <= 0 || durationSec <= 0) return null;
  return Math.round(durationSec / distanceKm);
}

/**
 * Calculate avg speed (km/h) from distance (km) and duration (seconds)
 */
export function calculateSpeedKmh(distanceKm: number, durationSec: number): number | null {
  if (distanceKm <= 0 || durationSec <= 0) return null;
  return Number(((distanceKm / durationSec) * 3600).toFixed(2));
}

/**
 * Safely parse date or date string into a local Date without UTC offset shifts or Safari parsing failures
 */
export function parseDateSafe(date: Date | string | null | undefined): Date {
  if (!date) return new Date();
  if (date instanceof Date) return isNaN(date.getTime()) ? new Date() : date;
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (!trimmed) return new Date();
    
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parts = trimmed.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    // Safari fix: replace space with T and slashes with dashes (e.g. 2026-08-10 06:30:00 -> 2026-08-10T06:30:00)
    const isoLike = trimmed.replace(' ', 'T').replace(/\//g, '-');
    const d = new Date(isoLike);
    if (!isNaN(d.getTime())) {
      return d;
    }
    const dFallback = new Date(trimmed);
    if (!isNaN(dFallback.getTime())) {
      return dFallback;
    }
  }
  return new Date();
}

/**
 * Format local date as YYYY-MM-DD string
 */
export function formatLocalDateKey(date: Date | string): string {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  const d = parseDateSafe(date);
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date for a given dayOfWeek (0=Sun, 1=Mon, ..., 6=Sat) in the active week.
 * Monday is the start of the week.
 */
export function getDateForDayOfWeek(dayOfWeek: number, baseDate: Date = new Date()): Date {
  const currentDay = baseDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const currentMonIndex = currentDay === 0 ? 6 : currentDay - 1;
  const targetMonIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const diffDays = targetMonIndex - currentMonIndex;
  const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  targetDate.setDate(baseDate.getDate() + diffDays);
  return targetDate;
}

/**
 * Format a workout date (e.g. "16 Ags" or "16 Aug")
 */
export function formatWorkoutDate(date: Date | string): string {
  const d = parseDateSafe(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Format full date (e.g. "Sabtu, 16 Agustus 2026")
 */
export function formatFullWorkoutDate(date: Date | string): string {
  const d = parseDateSafe(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format week range (e.g. "11 - 17 Ags 2026")
 */
export function formatWeekRange(baseDate: Date = new Date()): string {
  const monday = getDateForDayOfWeek(1, baseDate);
  const sunday = getDateForDayOfWeek(0, baseDate);

  const monDay = monday.getDate();
  const sunDay = sunday.getDate();
  const monthYear = sunday.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

  return `${monDay} - ${sunDay} ${monthYear}`;
}

/**
 * Normalize source names case-insensitively to prevent duplicates like "huawei health" vs "Huawei Health"
 */
export function normalizeSourceName(source?: string | null): string {
  if (!source) return 'Other';
  const clean = source.trim().toLowerCase().replace(/[_-]/g, ' ');
  if (clean.includes('huawei')) return 'Huawei Health';
  if (clean.includes('strava')) return 'Strava';
  if (clean.includes('garmin')) return 'Garmin';
  if (clean.includes('apple') || clean.includes('fitness')) return 'Apple Fitness';
  if (clean.includes('amazfit')) return 'Amazfit';
  if (clean.includes('zepp')) return 'Zepp';
  if (clean.includes('nike') || clean.includes('nrc')) return 'Nike Run Club';
  if (clean.includes('coros')) return 'Coros';
  if (clean.includes('suunto')) return 'Suunto';
  if (clean.includes('polar')) return 'Polar';
  if (clean.includes('gpx')) return 'GPX Import';
  if (clean.includes('json') || clean.includes('manual')) return 'Manual / JSON';
  return source.replace(/\b\w/g, (c) => c.toUpperCase());
}

