import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export type AccountDeletionConfirmationProps = {
  name: string;
  scheduledFor: string;
};

export function AccountDeletionConfirmationEmail({
  name,
  scheduledFor,
}: AccountDeletionConfirmationProps) {
  return (
    <EmailLayout preview="Account deletion scheduled">
      <Heading style={headingStyle}>Account deletion scheduled</Heading>
      <Text style={textStyle}>Hello {name},</Text>
      <Text style={textStyle}>
        We have received your request to delete your account. Deletion is scheduled
        for {scheduledFor}.
      </Text>
      <Text style={mutedStyle}>
        Contact support before that date if you wish to cancel this request.
      </Text>
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };
const mutedStyle = { fontSize: "13px", lineHeight: "20px", color: "#64748b" };

export default AccountDeletionConfirmationEmail;
