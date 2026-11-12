import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export type SubscriptionChangedProps = {
  name: string;
  previousPlan: string;
  newPlan: string;
  effectiveDate: string;
};

export function SubscriptionChangedEmail({
  name,
  previousPlan,
  newPlan,
  effectiveDate,
}: SubscriptionChangedProps) {
  return (
    <EmailLayout preview="Your subscription has changed">
      <Heading style={headingStyle}>Subscription updated</Heading>
      <Text style={textStyle}>Hello {name},</Text>
      <Text style={textStyle}>
        Your subscription will change from {previousPlan} to {newPlan} on{" "}
        {effectiveDate}.
      </Text>
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };

export default SubscriptionChangedEmail;
