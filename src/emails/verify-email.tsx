import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";
import { PrimaryButton } from "./components/button";

export type VerifyEmailProps = {
  name: string;
  verifyUrl: string;
  expiryHours: number;
};

export function VerifyEmailEmail({ name, verifyUrl, expiryHours }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Verify your email address">
      <Heading style={headingStyle}>Verify your email address</Heading>
      <Text style={textStyle}>Hello {name},</Text>
      <Text style={textStyle}>
        Thank you for registering. Please verify your email address to sign in.
      </Text>
      <PrimaryButton href={verifyUrl}>Verify email address</PrimaryButton>
      <Text style={mutedStyle}>
        This link expires in {expiryHours} hours. If you did not create an account,
        you can ignore this email.
      </Text>
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };
const mutedStyle = { fontSize: "13px", lineHeight: "20px", color: "#64748b" };

export default VerifyEmailEmail;
