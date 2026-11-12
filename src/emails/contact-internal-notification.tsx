import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";
import { plainTextToLines } from "@/lib/email/sanitize";

export type ContactInternalNotificationProps = {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
};

export function ContactInternalNotificationEmail({
  name,
  email,
  subject,
  category,
  message,
}: ContactInternalNotificationProps) {
  return (
    <EmailLayout preview={`[Contact] ${subject}`}>
      <Heading style={headingStyle}>New contact form submission</Heading>
      <Text style={textStyle}>
        <strong>From:</strong> {name} &lt;{email}&gt;
      </Text>
      <Text style={textStyle}>
        <strong>Category:</strong> {category}
      </Text>
      <Text style={textStyle}>
        <strong>Subject:</strong> {subject}
      </Text>
      {plainTextToLines(message).map((line) => (
        <Text key={line} style={textStyle}>
          {line}
        </Text>
      ))}
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };

export default ContactInternalNotificationEmail;
