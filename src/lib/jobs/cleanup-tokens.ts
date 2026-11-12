import { lt } from "drizzle-orm";
import { db } from "@/db";
import {
  passwordResetTokens,
  quotePublicTokens,
  verificationTokens,
} from "@/db/schema";
import { dailyJobKey, runIdempotentJob } from "@/lib/jobs/runner";

export async function runCleanupTokensJob() {
  const idempotencyKey = dailyJobKey("cleanup-tokens");

  return runIdempotentJob("cleanup-tokens", idempotencyKey, async () => {
    const now = new Date();

    const expiredVerification = await db
      .select({ id: verificationTokens.identifier })
      .from(verificationTokens)
      .where(lt(verificationTokens.expires, now));

    if (expiredVerification.length) {
      await db.delete(verificationTokens).where(lt(verificationTokens.expires, now));
    }

    const expiredPasswordResets = await db
      .select({ id: passwordResetTokens.id })
      .from(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, now));

    if (expiredPasswordResets.length) {
      await db
        .delete(passwordResetTokens)
        .where(lt(passwordResetTokens.expiresAt, now));
    }

    const expiredQuoteTokens = await db
      .select({ id: quotePublicTokens.id })
      .from(quotePublicTokens)
      .where(lt(quotePublicTokens.expiresAt, now));

    if (expiredQuoteTokens.length) {
      await db
        .delete(quotePublicTokens)
        .where(lt(quotePublicTokens.expiresAt, now));
    }

    return {
      verificationTokensRemoved: expiredVerification.length,
      passwordResetTokensRemoved: expiredPasswordResets.length,
      quotePublicTokensRemoved: expiredQuoteTokens.length,
    };
  });
}
