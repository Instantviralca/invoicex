import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/layout";

export type ContactConfirmationProps = {
  name: string;
  subject: string;
};

export function ContactConfirmationEmail({ name, subject }: ContactConfirmationProps) {
  return (
    <EmailLayout preview="We received your message">
      <Heading style={headingStyle}>Thank you for contacting us</Heading>
      <Text style={textStyle}>Hello {name},</Text>
      <Text style={textStyle}>
        We have received your message regarding &quot;{subject}&quot;. We aim to
        respond within two working days.
      </Text>
    </EmailLayout>
  );
}

const headingStyle = { fontSize: "20px", fontWeight: "600", color: "#0f172a" };
const textStyle = { fontSize: "14px", lineHeight: "22px", color: "#334155" };

export default ContactConfirmationEmail;
