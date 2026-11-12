import { PageHeader } from "@/components/app/page-header";
import { TeamInviteForm } from "@/components/app/team-invite-form";
import { requireAppContext } from "@/lib/app-context";
import { maxTeamMembers } from "@/lib/entitlements";
import { listTeamMembers } from "@/lib/services/team";

export default async function TeamSettingsPage() {
  const { membership } = await requireAppContext();
  const members = await listTeamMembers(membership.workspaceId);
  const limit = maxTeamMembers(membership.workspace.planId);
  const canInvite = membership.workspace.planId === "business";

  return (
    <div>
      <PageHeader
        title="Team"
        description={`Up to ${limit} member(s) on your current plan.`}
      />
      <ul className="divide-y divide-border rounded-lg border border-border bg-background">
        {members.map((member) => (
          <li key={member.id} className="flex justify-between px-4 py-3 text-sm">
            <span>{member.name ?? member.invitedEmail ?? member.email ?? member.userId}</span>
            <span className="capitalize text-foreground-muted">
              {member.role}
              {!member.acceptedAt && member.invitedEmail ? " (invited)" : ""}
            </span>
          </li>
        ))}
      </ul>
      {canInvite ? (
        <TeamInviteForm />
      ) : (
        <p className="mt-4 text-sm text-foreground-muted">
          Team invitations are available on the Business plan.
        </p>
      )}
    </div>
  );
}
