import type { DefaultSession } from "next-auth";
import type { MemberRole } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      emailVerified?: Date | null;
      workspaceId?: string | null;
      workspaceRole?: MemberRole | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    emailVerified?: Date | null;
    workspaceId?: string | null;
    workspaceRole?: MemberRole | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    picture?: string | null;
    emailVerified?: Date | null;
    workspaceId?: string | null;
    workspaceRole?: MemberRole | null;
  }
}
