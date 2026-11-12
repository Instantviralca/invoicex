import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export type UpcomingRecurringProps = {
  businessName: string;
  clientName: string;
  runDate: string;
  frequencyLabel: string;
};

export function UpcomingRecurringEmail({
  businessName,
  clientName,
  runDate,
  frequencyLabel,
}: UpcomingRecurringProps) {
  return (
    <EmailLayout preview="Upcoming recurring invoice">
      <Heading style={headingStyle}>Upcoming recurring invoice</Heading>
      <Text style={textStyle}>
        A recurring invoice for {clientName} is scheduled to generate on {runDate}{" "}
        ({frequencyLabel}) for {businessName}.
      </Text>
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };

export default UpcomingRecurringEmail;
