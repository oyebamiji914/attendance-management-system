"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ClipboardList, Eye, Fingerprint, Play, Square } from "lucide-react";
import { startAttendanceSession, stopAttendanceSession } from "@/lib/api/lecturer";
import { Button } from "@/components/ui/button";

export interface CourseActiveSession {
  id: number;
  end_time: string | null;
}

interface CourseActionsProps {
  courseId: number;
  activeSession?: CourseActiveSession | null;
  onScheduleClick: () => void;
  showDetails?: boolean;
  className?: string;
}

export function CourseActions({
  courseId,
  activeSession,
  onScheduleClick,
  showDetails = true,
  className = "",
}: CourseActionsProps) {
  const qc = useQueryClient();
  const isLive = activeSession?.end_time === null;

  const startMutation = useMutation({
    mutationFn: () => startAttendanceSession(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lecturer", "courses"] });
      qc.invalidateQueries({ queryKey: ["lecturer", "course", courseId] });
      qc.invalidateQueries({ queryKey: ["lecturer", "sessions"] });
      qc.invalidateQueries({ queryKey: ["lecturer", "stats"] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => stopAttendanceSession(activeSession!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lecturer", "courses"] });
      qc.invalidateQueries({ queryKey: ["lecturer", "course", courseId] });
      qc.invalidateQueries({ queryKey: ["lecturer", "sessions"] });
      qc.invalidateQueries({ queryKey: ["lecturer", "stats"] });
    },
  });

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {showDetails && (
        <Button size="sm" variant="outline" asChild>
          <Link href={`/lecturer/dashboard/courses/${courseId}`}>
            <Eye className="mr-2 h-4 w-4" />
            Course details
          </Link>
        </Button>
      )}

      <Button size="sm" variant="outline" onClick={onScheduleClick}>
        <CalendarClock className="mr-2 h-4 w-4" />
        Recurring sessions
      </Button>

      <Button size="sm" variant="outline" asChild>
        <Link href={`/lecturer/dashboard/sessions?course=${courseId}`}>
          <ClipboardList className="mr-2 h-4 w-4" />
          View sessions
        </Link>
      </Button>

      {isLive && activeSession && (
        <Button size="sm" className="bg-slate-900 hover:bg-slate-800" asChild>
          <Link href={`/lecturer/dashboard/sessions/${activeSession.id}`}>
            <Fingerprint className="mr-2 h-4 w-4" />
            Scan fingerprint
          </Link>
        </Button>
      )}

      {isLive ? (
        <Button
          size="sm"
          variant="destructive"
          disabled={stopMutation.isPending}
          className="bg-red-600 hover:bg-red-700"
          onClick={() => stopMutation.mutate()}
        >
          <Square className="mr-2 h-4 w-4" />
          {stopMutation.isPending ? "Stopping..." : "Stop session"}
        </Button>
      ) : (
        <Button
          size="sm"
          disabled={startMutation.isPending}
          className="bg-green-600 hover:bg-green-700"
          onClick={() => startMutation.mutate()}
        >
          <Play className="mr-2 h-4 w-4" />
          {startMutation.isPending ? "Starting..." : "Start session"}
        </Button>
      )}
    </div>
  );
}
