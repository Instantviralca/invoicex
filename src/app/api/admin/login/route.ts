import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticateAdmin,
  createAdminSession,
  destroyAdminSession,
  logAdminAction,
} from "@/lib/admin-auth";
import { getClientIdentifier, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const limit = rateLimit("login", `admin:${getClientIdentifier(request)}`);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  }

  const admin = await authenticateAdmin(body.data.email, body.data.password);
  if (!admin) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  await createAdminSession(admin.id);
  await logAdminAction({
    adminId: admin.id,
    action: "admin.login",
    entityType: "admin_user",
    entityId: admin.id,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await destroyAdminSession();
  return NextResponse.json({ ok: true });
}
