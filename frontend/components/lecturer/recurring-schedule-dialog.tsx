"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import {
  createSessionSchedule,
  deleteSessionSchedule,
  getCourseSchedules,
  updateSessionSchedule,
} from "@/lib/api/lecturer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const DAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

interface RecurringScheduleDialogProps {
  courseId: number;
  courseCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecurringScheduleDialog({
  courseId,
  courseCode,
  open,
  onOpenChange,
}: RecurringScheduleDialogProps) {
  const qc = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const schedulesQuery = useQuery({
    queryKey: ["lecturer", "schedules", courseId],
    queryFn: () => getCourseSchedules(courseId),
    enabled: open && !!courseId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createSessionSchedule(courseId, {
        start_date: startDate,
        end_date: endDate,
        daily_start_time: startTime,
        daily_end_time: endTime,
        days_of_week: days,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lecturer", "schedules", courseId] });
      qc.invalidateQueries({ queryKey: ["lecturer", "courses"] });
      setStartDate("");
      setEndDate("");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_enabled }: { id: number; is_enabled: boolean }) =>
      updateSessionSchedule(id, is_enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lecturer", "schedules", courseId] });
      qc.invalidateQueries({ queryKey: ["lecturer", "courses"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSessionSchedule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lecturer", "schedules", courseId] });
      qc.invalidateQueries({ queryKey: ["lecturer", "courses"] });
    },
  });

  useEffect(() => {
    if (!open) return;
    schedulesQuery.refetch();
  }, [open, courseId]);

  function toggleDay(day: number) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  }

  const schedules = schedulesQuery.data?.schedules ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recurring sessions — {courseCode}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-slate-600">
          Sessions open automatically between the daily times on selected days. You can still
          start or stop manually from the course page.
        </p>

        <div className="space-y-4 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">New schedule</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sched-start">From date</Label>
              <Input
                id="sched-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sched-end">To date</Label>
              <Input
                id="sched-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sched-time-start">From time</Label>
              <Input
                id="sched-time-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sched-time-end">To time</Label>
              <Input
                id="sched-time-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Days of week</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAY_OPTIONS.map(({ value, label }) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={days.includes(value) ? "default" : "outline"}
                  className={days.includes(value) ? "bg-slate-900 hover:bg-slate-800" : ""}
                  onClick={() => toggleDay(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <Button
            className="w-full bg-slate-900 hover:bg-slate-800"
            disabled={
              !startDate ||
              !endDate ||
              days.length === 0 ||
              createMutation.isPending
            }
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "Creating..." : "Create recurring schedule"}
          </Button>
          {createMutation.isError && (
            <p className="text-sm text-red-600">
              {(createMutation.error as { response?: { data?: { error?: string } } })?.response
                ?.data?.error ?? "Failed to create schedule"}
            </p>
          )}
        </div>

        <div className="space-y-3 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">Existing schedules</h3>
          {schedulesQuery.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : schedules.length === 0 ? (
            <p className="text-sm text-slate-500">No recurring schedules yet.</p>
          ) : (
            <ul className="space-y-2">
              {schedules.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 p-3"
                >
                  <div className="text-sm">
                    <p className="font-medium text-slate-900">
                      {s.daily_start_time} – {s.daily_end_time}
                    </p>
                    <p className="text-slate-600">
                      {String(s.start_date).slice(0, 10)} → {String(s.end_date).slice(0, 10)}
                    </p>
                    <p className="text-slate-500">
                      {s.days_of_week
                        .map((d) => DAY_OPTIONS.find((o) => o.value === d)?.label)
                        .join(", ")}
                    </p>
                    <Badge
                      className={
                        s.is_enabled
                          ? "mt-2 bg-green-500 text-white hover:bg-green-600"
                          : "mt-2"
                      }
                      variant={s.is_enabled ? "default" : "secondary"}
                    >
                      {s.is_enabled ? "Auto-enabled" : "Paused"}
                    </Badge>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={toggleMutation.isPending}
                      onClick={() =>
                        toggleMutation.mutate({ id: s.id, is_enabled: !s.is_enabled })
                      }
                    >
                      {s.is_enabled ? "Pause" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(s.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
