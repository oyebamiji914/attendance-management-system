"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Fingerprint } from "lucide-react";
import { scanFingerprint } from "@/lib/api/lecturer";
import { captureFingerprint } from "@/lib/biometric-scanner";
import { Button } from "@/components/ui/button";

interface SessionScanButtonProps {
  sessionId: number;
  className?: string;
  onStatusChange?: (message: string) => void;
}

export function SessionScanButton({
  sessionId,
  className,
  onStatusChange,
}: SessionScanButtonProps) {
  const qc = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: (template: string) => scanFingerprint(sessionId, template),
    onSuccess: (data) => {
      const msg = `✓ ${data.student?.full_name} marked present`;
      onStatusChange?.(msg);
      qc.invalidateQueries({ queryKey: ["lecturer", "session", sessionId] });
      qc.invalidateQueries({ queryKey: ["lecturer", "sessions"] });
      qc.invalidateQueries({ queryKey: ["lecturer", "courses"] });
      qc.invalidateQueries({ queryKey: ["lecturer", "stats"] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      onStatusChange?.(`✗ ${err?.response?.data?.error || "No match found"}`);
    },
  });

  async function handleScan() {
    onStatusChange?.("Place finger on scanner...");
    try {
      const result = await captureFingerprint();
      onStatusChange?.("Matching fingerprint...");
      await scanMutation.mutateAsync(result.template);
    } catch {
      onStatusChange?.("✗ Scanner error");
    }
  }

  return (
    <Button
      onClick={handleScan}
      disabled={scanMutation.isPending}
      className={className ?? "bg-slate-900 hover:bg-slate-800"}
    >
      <Fingerprint className="mr-2 h-4 w-4" />
      {scanMutation.isPending ? "Scanning..." : "Scan Fingerprint"}
    </Button>
  );
}
