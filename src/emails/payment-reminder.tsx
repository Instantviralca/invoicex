import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export type PaymentReminderProps = {
  businessName: string;
  invoiceNumber: string;
  clientName: string;
  amountFormatted: string;
  dueDate: string;
  daysOverdue?: number;
};

export function PaymentReminderEmail({
  businessName,
  invoiceNumber,
  clientName,
  amountFormatted,
  dueDate,
  daysOverdue,
}: PaymentReminderProps) {
  const timing =
    daysOverdue === undefined
      ? `due on ${dueDate}`
      : daysOverdue === 0
        ? `due today (${dueDate})`
        : daysOverdue < 0
          ? `due on ${dueDate}`
          : `${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue (due ${dueDate})`;

  return (
    <EmailLayout preview={`Payment reminder for invoice ${invoiceNumber}`}>
      <Heading style={headingStyle}>Payment reminder</Heading>
      <Text style={textStyle}>Hello {clientName},</Text>
      <Text style={textStyle}>
        This is a friendly reminder from {businessName} that invoice {invoiceNumber}{" "}
        for {amountFormatted} is {timing}.
      </Text>
      <Text style={mutedStyle}>
        If you have already paid, please disregard this message.
      </Text>
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };
const mutedStyle = { fontSize: "13px", lineHeight: "20px", color: "#64748b" };

export default PaymentReminderEmail;
