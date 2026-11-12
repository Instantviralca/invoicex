import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businessProfiles, users, workspaceMembers } from "@/db/schema";

export async function getSettingsContext(workspaceId: string, userId: string) {
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.workspaceId, workspaceId))
    .limit(1);

  const members = await db
    .select({
      id: workspaceMembers.id,
      role: workspaceMembers.role,
      userId: workspaceMembers.userId,
      invitedEmail: workspaceMembers.invitedEmail,
    })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  return { user, profile, members };
}
