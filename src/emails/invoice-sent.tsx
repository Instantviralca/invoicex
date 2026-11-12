import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";
import { plainTextToLines } from "@/lib/email/sanitize";

export type InvoiceSentProps = {
  businessName: string;
  invoiceNumber: string;
  clientName: string;
  amountFormatted: string;
  dueDate: string;
  customMessage?: string;
};

export function InvoiceSentEmail({
  businessName,
  invoiceNumber,
  clientName,
  amountFormatted,
  dueDate,
  customMessage,
}: InvoiceSentProps) {
  return (
    <EmailLayout preview={`Invoice ${invoiceNumber} from ${businessName}`}>
      <Heading style={headingStyle}>Invoice {invoiceNumber}</Heading>
      <Text style={textStyle}>Hello {clientName},</Text>
      <Text style={textStyle}>
        {businessName} has sent you invoice {invoiceNumber} for {amountFormatted},
        due on {dueDate}.
      </Text>
      {customMessage
        ? plainTextToLines(customMessage).map((line) => (
            <Text key={line} style={textStyle}>
              {line}
            </Text>
          ))
        : null}
      <Text style={mutedStyle}>
        A PDF copy is attached to this email for your records.
      </Text>
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };
const mutedStyle = { fontSize: "13px", lineHeight: "20px", color: "#64748b" };

export default InvoiceSentEmail;
