import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { brand } from "@/config/brand";
import type { ReactNode } from "react";

type EmailLayoutProps = {
  preview: string;
  children: ReactNode;
};

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="en-GB">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={logoStyle}>{brand.productName}</Text>
          </Section>
          <Section style={contentStyle}>{children}</Section>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            {brand.productName} · {brand.supportEmail} · {brand.supportPhone}
          </Text>
          <Text style={footerMutedStyle}>
            This message was sent by {brand.productName}. Please do not reply
            directly unless a reply address is shown above.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const containerStyle = {
  margin: "0 auto",
  padding: "24px 0 48px",
  maxWidth: "560px",
};

const headerStyle = {
  padding: "0 24px 16px",
};

const logoStyle = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#1D4ED8",
  margin: "0",
};

const contentStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "24px",
  margin: "0 24px",
};

const hrStyle = {
  borderColor: "#e2e8f0",
  margin: "24px",
};

const footerStyle = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "0 24px 8px",
};

const footerMutedStyle = {
  color: "#94a3b8",
  fontSize: "11px",
  lineHeight: "18px",
  margin: "0 24px",
};
