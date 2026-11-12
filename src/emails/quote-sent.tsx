import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";
import { plainTextToLines } from "@/lib/email/sanitize";

export type QuoteSentProps = {
  businessName: string;
  quoteNumber: string;
  clientName: string;
  amountFormatted: string;
  validUntil: string;
  customMessage?: string;
  publicUrl?: string;
};

export function QuoteSentEmail({
  businessName,
  quoteNumber,
  clientName,
  amountFormatted,
  validUntil,
  customMessage,
  publicUrl,
}: QuoteSentProps) {
  return (
    <EmailLayout preview={`Quote ${quoteNumber} from ${businessName}`}>
      <Heading style={headingStyle}>Quote {quoteNumber}</Heading>
      <Text style={textStyle}>Hello {clientName},</Text>
      <Text style={textStyle}>
        {businessName} has sent you quote {quoteNumber} for {amountFormatted},
        valid until {validUntil}.
      </Text>
      {customMessage
        ? plainTextToLines(customMessage).map((line) => (
            <Text key={line} style={textStyle}>
              {line}
            </Text>
          ))
        : null}
      {publicUrl ? (
        <Text style={textStyle}>
          You can view and respond online: {publicUrl}
        </Text>
      ) : null}
      <Text style={mutedStyle}>
        A PDF copy is attached to this email for your records.
      </Text>
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };
const mutedStyle = { fontSize: "13px", lineHeight: "20px", color: "#64748b" };

export default QuoteSentEmail;
