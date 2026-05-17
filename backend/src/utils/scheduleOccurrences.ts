import { todayUtcDateOnly, toUtcDateOnly } from "./scheduleTime";

export type ScheduleOccurrenceInput = {
  start_date: Date;
  end_date: Date;
  days_of_week: number[];
  is_enabled?: boolean;
};

/** Count how many scheduled session days have occurred up to `asOf` (UTC date). */
export function countScheduledSessionOccurrences(
  schedules: ScheduleOccurrenceInput[],
  asOf: Date = todayUtcDateOnly()
): number {
  const asOfTime = asOf.getTime();
  let total = 0;

  for (const schedule of schedules) {
    if (schedule.is_enabled === false) continue;

    const rangeStart = toUtcDateOnly(schedule.start_date);
    const rangeEnd = toUtcDateOnly(schedule.end_date);
    const effectiveEndTime = Math.min(rangeEnd.getTime(), asOfTime);

    if (rangeStart.getTime() > effectiveEndTime) continue;

    let cursor = new Date(rangeStart);
    while (cursor.getTime() <= effectiveEndTime) {
      if (schedule.days_of_week.includes(cursor.getUTCDay())) {
        total += 1;
      }
      cursor = new Date(
        Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1)
      );
    }
  }

  return total;
}
