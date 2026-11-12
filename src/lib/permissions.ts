export type MemberRole = "owner" | "administrator" | "staff" | "viewer";

export type Permission =
  | "workspace:read"
  | "workspace:update"
  | "workspace:delete"
  | "billing:manage"
  | "members:read"
  | "members:invite"
  | "members:update"
  | "members:remove"
  | "businessProfile:read"
  | "businessProfile:manage"
  | "clients:read"
  | "clients:create"
  | "clients:update"
  | "clients:archive"
  | "catalogue:read"
  | "catalogue:manage"
  | "invoices:read"
  | "invoices:create"
  | "invoices:update"
  | "invoices:send"
  | "invoices:void"
  | "invoices:archive"
  | "quotes:read"
  | "quotes:create"
  | "quotes:update"
  | "quotes:send"
  | "quotes:archive"
  | "payments:record"
  | "reports:read"
  | "settings:read"
  | "settings:update"
  | "auditLog:read"
  | "exports:request";

const ALL_PERMISSIONS = [
  "workspace:read",
  "workspace:update",
  "workspace:delete",
  "billing:manage",
  "members:read",
  "members:invite",
  "members:update",
  "members:remove",
  "businessProfile:read",
  "businessProfile:manage",
  "clients:read",
  "clients:create",
  "clients:update",
  "clients:archive",
  "catalogue:read",
  "catalogue:manage",
  "invoices:read",
  "invoices:create",
  "invoices:update",
  "invoices:send",
  "invoices:void",
  "invoices:archive",
  "quotes:read",
  "quotes:create",
  "quotes:update",
  "quotes:send",
  "quotes:archive",
  "payments:record",
  "reports:read",
  "settings:read",
  "settings:update",
  "auditLog:read",
  "exports:request",
] as const satisfies readonly Permission[];

export const ROLE_PERMISSIONS: Record<MemberRole, readonly Permission[]> = {
  owner: ALL_PERMISSIONS,
  administrator: [
    "workspace:read",
    "workspace:update",
    "members:read",
    "members:invite",
    "members:update",
    "members:remove",
    "businessProfile:read",
    "businessProfile:manage",
    "clients:read",
    "clients:create",
    "clients:update",
    "clients:archive",
    "catalogue:read",
    "catalogue:manage",
    "invoices:read",
    "invoices:create",
    "invoices:update",
    "invoices:send",
    "invoices:void",
    "invoices:archive",
    "quotes:read",
    "quotes:create",
    "quotes:update",
    "quotes:send",
    "quotes:archive",
    "payments:record",
    "reports:read",
    "settings:read",
    "settings:update",
    "auditLog:read",
    "exports:request",
  ],
  staff: [
    "workspace:read",
    "members:read",
    "businessProfile:read",
    "clients:read",
    "clients:create",
    "clients:update",
    "catalogue:read",
    "catalogue:manage",
    "invoices:read",
    "invoices:create",
    "invoices:update",
    "invoices:send",
    "quotes:read",
    "quotes:create",
    "quotes:update",
    "quotes:send",
    "payments:record",
    "reports:read",
    "settings:read",
  ],
  viewer: [
    "workspace:read",
    "members:read",
    "businessProfile:read",
    "clients:read",
    "catalogue:read",
    "invoices:read",
    "quotes:read",
    "reports:read",
    "settings:read",
  ],
};

export class ForbiddenError extends Error {
  constructor(
    message = "You do not have permission to perform this action.",
    public readonly permission?: Permission,
  ) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function hasPermission(role: MemberRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertPermission(role: MemberRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(undefined, permission);
  }
}

const ROLE_RANK: Record<MemberRole, number> = {
  viewer: 1,
  staff: 2,
  administrator: 3,
  owner: 4,
};

export function roleMeetsMinimum(
  role: MemberRole,
  minimumRole: MemberRole,
): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimumRole];
}

export function assertMinimumRole(
  role: MemberRole,
  minimumRole: MemberRole,
): void {
  if (!roleMeetsMinimum(role, minimumRole)) {
    throw new ForbiddenError(
      `This action requires ${minimumRole} access or higher.`,
    );
  }
}
