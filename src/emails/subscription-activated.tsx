import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export type SubscriptionActivatedProps = {
  name: string;
  planName: string;
  intervalLabel: string;
};

export function SubscriptionActivatedEmail({
  name,
  planName,
  intervalLabel,
}: SubscriptionActivatedProps) {
  return (
    <EmailLayout preview={`Your ${planName} subscription is active`}>
      <Heading style={headingStyle}>Subscription activated</Heading>
      <Text style={textStyle}>Hello {name},</Text>
      <Text style={textStyle}>
        Your {planName} plan ({intervalLabel}) is now active. Thank you for
        subscribing.
      </Text>
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };

export default SubscriptionActivatedEmail;
