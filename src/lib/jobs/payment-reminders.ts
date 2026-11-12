import { dailyJobKey, runIdempotentJob } from "@/lib/jobs/runner";
import { processPaymentReminders } from "@/lib/services/reminders";

export async function runPaymentRemindersJob() {
  const idempotencyKey = dailyJobKey("payment-reminders");

  return runIdempotentJob("payment-reminders", idempotencyKey, async () => {
    return processPaymentReminders();
  });
}
