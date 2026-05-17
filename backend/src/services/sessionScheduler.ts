import prisma from "../lib/prisma";
import {
  combineDateAndTime,
  isSameUtcDate,
  todayUtcDateOnly,
} from "../utils/scheduleTime";

type ScheduleRow = {
  id: number;
  course_id: number;
  start_date: Date;
  end_date: Date;
  daily_start_time: string;
  daily_end_time: string;
  days_of_week: number[];
  is_enabled: boolean;
};

function isDateInRange(day: Date, start: Date, end: Date): boolean {
  const t = day.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

async function findTodaysScheduledSession(scheduleId: number, day: Date) {
  return prisma.attendanceSession.findFirst({
    where: {
      schedule_id: scheduleId,
      scheduled_date: day,
    },
  });
}

async function processSchedule(schedule: ScheduleRow, now: Date, today: Date) {
  if (!schedule.is_enabled) return;
  if (!isDateInRange(today, schedule.start_date, schedule.end_date)) return;
  if (!schedule.days_of_week.includes(now.getUTCDay())) return;

  const windowStart = combineDateAndTime(today, schedule.daily_start_time);
  const windowEnd = combineDateAndTime(today, schedule.daily_end_time);
  const session = await findTodaysScheduledSession(schedule.id, today);

  if (now >= windowStart && now <= windowEnd) {
    if (!session) {
      await prisma.attendanceSession.create({
        data: {
          course_id: schedule.course_id,
          schedule_id: schedule.id,
          scheduled_date: today,
          start_time: now > windowStart ? now : windowStart,
          end_time: null,
          manually_started: false,
          manually_ended: false,
        },
      });
      return;
    }

    if (session.manually_ended) return;

    if (session.end_time !== null) return;

    return;
  }

  if (now > windowEnd && session && session.end_time === null && !session.manually_started) {
    await prisma.attendanceSession.update({
      where: { id: session.id },
      data: { end_time: windowEnd },
    });
  }
}

export async function runSessionSchedulerTick(now = new Date()): Promise<void> {
  const today = todayUtcDateOnly(now);

  const schedules = await prisma.sessionSchedule.findMany({
    where: { is_enabled: true },
  });

  for (const schedule of schedules) {
    try {
      await processSchedule(schedule, now, today);
    } catch (err) {
      console.error(`[session-scheduler] schedule ${schedule.id} failed:`, err);
    }
  }
}

export async function findMatchingScheduleForToday(courseId: number, now = new Date()) {
  const today = todayUtcDateOnly(now);
  const schedules = await prisma.sessionSchedule.findMany({
    where: {
      course_id: courseId,
      is_enabled: true,
    },
  });

  return schedules.find(
    (s) =>
      isDateInRange(today, s.start_date, s.end_date) &&
      s.days_of_week.includes(now.getUTCDay())
  );
}

export { isSameUtcDate };
