import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export type SubscriptionCancelledProps = {
  name: string;
  planName: string;
  accessUntil: string;
};

export function SubscriptionCancelledEmail({
  name,
  planName,
  accessUntil,
}: SubscriptionCancelledProps) {
  return (
    <EmailLayout preview="Your subscription has been cancelled">
      <Heading style={headingStyle}>Subscription cancelled</Heading>
      <Text style={textStyle}>Hello {name},</Text>
      <Text style={textStyle}>
        Your {planName} subscription has been cancelled. You will retain access until{" "}
        {accessUntil}.
      </Text>
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };

export default SubscriptionCancelledEmail;
