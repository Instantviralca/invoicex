import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";
import { PrimaryButton } from "./components/button";

export type TeamInviteProps = {
  workspaceName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
};

export function TeamInviteEmail({
  workspaceName,
  inviterName,
  role,
  acceptUrl,
}: TeamInviteProps) {
  return (
    <EmailLayout preview={`Invitation to join ${workspaceName}`}>
      <Heading style={headingStyle}>Team invitation</Heading>
      <Text style={textStyle}>
        {inviterName} has invited you to join {workspaceName} as {role}.
      </Text>
      <PrimaryButton href={acceptUrl}>Accept invitation</PrimaryButton>
      <Text style={mutedStyle}>
        If you were not expecting this invitation, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };
const mutedStyle = { fontSize: "13px", lineHeight: "20px", color: "#64748b" };

export default TeamInviteEmail;
