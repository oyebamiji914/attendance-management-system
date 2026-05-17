const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;

export function parseTimeHHmm(value: string): { hours: number; minutes: number } {
  const match = TIME_RE.exec(value.trim());
  if (!match) {
    throw new Error("Time must be in HH:mm format (24-hour)");
  }
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

export function validateTimeRange(startTime: string, endTime: string): void {
  const start = parseTimeHHmm(startTime);
  const end = parseTimeHHmm(endTime);
  const startMins = start.hours * 60 + start.minutes;
  const endMins = end.hours * 60 + end.minutes;
  if (endMins <= startMins) {
    throw new Error("daily_end_time must be after daily_start_time");
  }
}

export function toUtcDateOnly(dateInput: string | Date): Date {
  if (typeof dateInput === "string") {
    const [y, m, d] = dateInput.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  }
  return new Date(
    Date.UTC(dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate(), 0, 0, 0, 0)
  );
}

export function combineDateAndTime(dateOnly: Date, timeHHmm: string): Date {
  const { hours, minutes } = parseTimeHHmm(timeHHmm);
  return new Date(
    Date.UTC(
      dateOnly.getUTCFullYear(),
      dateOnly.getUTCMonth(),
      dateOnly.getUTCDate(),
      hours,
      minutes,
      0,
      0
    )
  );
}

export function todayUtcDateOnly(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

export function isSameUtcDate(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function validateDaysOfWeek(days: number[]): number[] {
  if (!Array.isArray(days) || days.length === 0) {
    throw new Error("days_of_week must include at least one day");
  }
  const normalized = [...new Set(days.map((d) => Number(d)))];
  if (normalized.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
    throw new Error("days_of_week values must be integers 0 (Sunday) through 6 (Saturday)");
  }
  return normalized.sort((a, b) => a - b);
}
