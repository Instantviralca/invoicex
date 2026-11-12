import { redirect } from "next/navigation";
import {
  getCurrentWorkspace,
  requireAuthenticatedUser,
  type WorkspaceMember,
} from "@/lib/workspace";

export type AppContext = {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    workspaceId?: string | null;
  };
  membership: WorkspaceMember;
};

export async function requireAppContext(): Promise<AppContext> {
  const user = await requireAuthenticatedUser();
  const membership = await getCurrentWorkspace();

  if (!membership) {
    redirect("/register");
  }

  return { user, membership };
}

export async function getAppContext(): Promise<AppContext | null> {
  try {
    return await requireAppContext();
  } catch {
    return null;
  }
}
