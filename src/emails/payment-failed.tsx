import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";
import { PrimaryButton } from "./components/button";

export type PaymentFailedProps = {
  name: string;
  planName: string;
  billingUrl: string;
};

export function PaymentFailedEmail({ name, planName, billingUrl }: PaymentFailedProps) {
  return (
    <EmailLayout preview="Payment failed for your subscription">
      <Heading style={headingStyle}>Payment failed</Heading>
      <Text style={textStyle}>Hello {name},</Text>
      <Text style={textStyle}>
        We could not collect payment for your {planName} subscription. Please update
        your billing details to avoid interruption.
      </Text>
      <PrimaryButton href={billingUrl}>Manage subscription</PrimaryButton>
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };

export default PaymentFailedEmail;
