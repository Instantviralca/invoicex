import { runAccountDeletionJob } from "@/lib/jobs/account-deletion";
import { runCleanupTempUploadsJob } from "@/lib/jobs/cleanup-temp-uploads";
import { runCleanupTokensJob } from "@/lib/jobs/cleanup-tokens";
import { runDataExportsJob } from "@/lib/jobs/data-exports";
import { runEmailRetriesJob } from "@/lib/jobs/email-retries";
import { runPaymentRemindersJob } from "@/lib/jobs/payment-reminders";
import { runRecurringInvoicesJob } from "@/lib/jobs/recurring-invoices";
import { runSubscriptionReconciliationJob } from "@/lib/jobs/subscription-reconciliation";
import type { JobRunResult } from "@/lib/jobs/runner";

export const JOB_NAMES = [
  "recurring-invoices",
  "payment-reminders",
  "subscription-reconciliation",
  "email-retries",
  "data-exports",
  "account-deletion",
  "cleanup-tokens",
  "cleanup-temp-uploads",
] as const;

export type JobName = (typeof JOB_NAMES)[number];

const jobHandlers: Record<JobName, () => Promise<JobRunResult>> = {
  "recurring-invoices": runRecurringInvoicesJob,
  "payment-reminders": runPaymentRemindersJob,
  "subscription-reconciliation": runSubscriptionReconciliationJob,
  "email-retries": runEmailRetriesJob,
  "data-exports": runDataExportsJob,
  "account-deletion": runAccountDeletionJob,
  "cleanup-tokens": runCleanupTokensJob,
  "cleanup-temp-uploads": runCleanupTempUploadsJob,
};

export function isJobName(value: string): value is JobName {
  return JOB_NAMES.includes(value as JobName);
}

export async function runJob(jobName: JobName): Promise<JobRunResult> {
  return jobHandlers[jobName]();
}
