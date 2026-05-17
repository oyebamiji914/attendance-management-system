-- Recurring session schedules and manual override flags on attendance sessions

CREATE TABLE "SessionSchedule" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "daily_start_time" TEXT NOT NULL,
    "daily_end_time" TEXT NOT NULL,
    "days_of_week" INTEGER[] NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionSchedule_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AttendanceSession" ADD COLUMN "schedule_id" INTEGER,
ADD COLUMN "scheduled_date" DATE,
ADD COLUMN "manually_started" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "manually_ended" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "SessionSchedule_course_id_idx" ON "SessionSchedule"("course_id");
CREATE INDEX "SessionSchedule_is_enabled_start_date_end_date_idx" ON "SessionSchedule"("is_enabled", "start_date", "end_date");
CREATE INDEX "AttendanceSession_schedule_id_scheduled_date_idx" ON "AttendanceSession"("schedule_id", "scheduled_date");

ALTER TABLE "SessionSchedule" ADD CONSTRAINT "SessionSchedule_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "SessionSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
