import { Button as EmailButton } from "@react-email/components";

type Props = {
  href: string;
  children: string;
};

export function PrimaryButton({ href, children }: Props) {
  return (
    <EmailButton href={href} style={buttonStyle}>
      {children}
    </EmailButton>
  );
}

const buttonStyle = {
  backgroundColor: "#1D4ED8",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  lineHeight: "100%",
  padding: "12px 20px",
  textDecoration: "none",
};
