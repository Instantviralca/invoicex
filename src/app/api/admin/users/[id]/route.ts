import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logAdminAction, requireAdmin } from "@/lib/admin-auth";

const schema = z.object({
  action: z.enum(["suspend", "restore"]),
  reason: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = schema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    if (body.data.action === "suspend") {
      await db
        .update(users)
        .set({
          suspendedAt: new Date(),
          suspendedReason: body.data.reason ?? "Suspended by admin",
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));
      await logAdminAction({
        adminId: admin.adminId,
        action: "admin.user.suspend",
        entityType: "user",
        entityId: id,
        metadata: { reason: body.data.reason },
      });
    } else {
      await db
        .update(users)
        .set({
          suspendedAt: null,
          suspendedReason: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));
      await logAdminAction({
        adminId: admin.adminId,
        action: "admin.user.restore",
        entityType: "user",
        entityId: id,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}
