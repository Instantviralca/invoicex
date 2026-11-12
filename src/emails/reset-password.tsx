import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";
import { PrimaryButton } from "./components/button";

export type ResetPasswordProps = {
  name: string;
  resetUrl: string;
  expiryHours: number;
};

export function ResetPasswordEmail({ name, resetUrl, expiryHours }: ResetPasswordProps) {
  return (
    <EmailLayout preview="Reset your password">
      <Heading style={headingStyle}>Reset your password</Heading>
      <Text style={textStyle}>Hello {name},</Text>
      <Text style={textStyle}>
        We received a request to reset your password. Use the button below to choose
        a new one.
      </Text>
      <PrimaryButton href={resetUrl}>Reset password</PrimaryButton>
      <Text style={mutedStyle}>
        This link expires in {expiryHours} hour{expiryHours === 1 ? "" : "s"}. If you
        did not request a reset, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };
const mutedStyle = { fontSize: "13px", lineHeight: "20px", color: "#64748b" };

export default ResetPasswordEmail;
