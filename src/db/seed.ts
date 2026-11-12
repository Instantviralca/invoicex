import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { ensureBootstrapAdmin } from "@/lib/admin-auth";

/**
 * Safe local development seed only.
 * Does not create fake public reviews, testimonials, or marketing statistics.
 */
async function seed() {
  console.log("Seeding InvoiceX development data…");

  await ensureBootstrapAdmin();

  if (process.env.NODE_ENV === "production") {
    console.log("Production seed limited to admin bootstrap (if configured).");
    process.exit(0);
  }

  const demoEmail = "demo@invoicerush.local";
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, demoEmail))
    .limit(1);

  if (!existing) {
    const passwordHash = await hashPassword("DemoPass1234");
    await db.insert(users).values({
      name: "Demo User",
      email: demoEmail,
      passwordHash,
      emailVerified: new Date(),
      onboardingCompleted: false,
      marketingConsent: false,
    });
    console.log(`Created local demo user ${demoEmail} / DemoPass1234`);
    console.log(
      "Note: complete registration flow normally for a full workspace; this user is for auth smoke tests only.",
    );
  } else {
    console.log("Demo user already exists.");
  }

  const [adminCount] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .limit(1);
  console.log(adminCount ? "Admin user present." : "No admin user — set ADMIN_BOOTSTRAP_* env vars.");

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
