import cron from "node-cron";
import { runSessionSchedulerTick } from "../services/sessionScheduler";

const CRON_EXPRESSION = process.env.SESSION_CRON_EXPRESSION ?? "* * * * *";

export function startSessionCron(): void {
  if (process.env.SESSION_CRON_ENABLED === "false") {
    console.log("[session-cron] disabled (SESSION_CRON_ENABLED=false)");
    return;
  }

  cron.schedule(CRON_EXPRESSION, async () => {
    try {
      await runSessionSchedulerTick();
    } catch (err) {
      console.error("[session-cron] tick failed:", err);
    }
  });

  console.log(`[session-cron] started (${CRON_EXPRESSION})`);
}
