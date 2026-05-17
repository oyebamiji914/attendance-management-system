import {
  toUtcDateOnly,
  validateDaysOfWeek,
  validateTimeRange,
} from "../utils/scheduleTime";

export interface CreateScheduleInput {
  start_date: string;
  end_date: string;
  daily_start_time: string;
  daily_end_time: string;
  days_of_week?: number[];
}

export function parseCreateScheduleBody(body: CreateScheduleInput) {
  const { start_date, end_date, daily_start_time, daily_end_time, days_of_week } = body;

  if (!start_date || !end_date || !daily_start_time || !daily_end_time) {
    throw new Error("start_date, end_date, daily_start_time, and daily_end_time are required");
  }

  validateTimeRange(daily_start_time, daily_end_time);

  const startDate = toUtcDateOnly(start_date);
  const endDate = toUtcDateOnly(end_date);

  if (endDate < startDate) {
    throw new Error("end_date must be on or after start_date");
  }

  const days = validateDaysOfWeek(days_of_week ?? [1, 2, 3, 4, 5]);

  return {
    start_date: startDate,
    end_date: endDate,
    daily_start_time,
    daily_end_time,
    days_of_week: days,
  };
}
