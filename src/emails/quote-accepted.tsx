import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export type QuoteAcceptedProps = {
  quoteNumber: string;
  clientName: string;
  respondentName: string;
  comment?: string;
};

export function QuoteAcceptedEmail({
  quoteNumber,
  clientName,
  respondentName,
  comment,
}: QuoteAcceptedProps) {
  return (
    <EmailLayout preview={`Quote ${quoteNumber} accepted`}>
      <Heading style={headingStyle}>Quote accepted</Heading>
      <Text style={textStyle}>
        Quote {quoteNumber} for {clientName} was accepted by {respondentName}.
      </Text>
      {comment ? <Text style={textStyle}>Comment: {comment}</Text> : null}
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };

export default QuoteAcceptedEmail;
