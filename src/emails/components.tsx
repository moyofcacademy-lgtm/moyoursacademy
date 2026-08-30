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
import type { ReactNode } from "react";

export const emailColors = {
  pitch: "#0B3D2C",
  pitchDeep: "#062218",
  chalk: "#F3F1E7",
  gold: "#E8B319",
  kit: "#14140F",
  line: "#C9C4AE",
} as const;

export const emailStyles = {
  body: {
    backgroundColor: emailColors.chalk,
    fontFamily:
      "'Inter', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: emailColors.kit,
    margin: 0,
    padding: "24px 12px",
  },
  container: {
    backgroundColor: "#FFFFFF",
    border: `1px solid ${emailColors.line}`,
    borderRadius: 4,
    maxWidth: 560,
    margin: "0 auto",
    overflow: "hidden" as const,
  },
  header: {
    backgroundColor: emailColors.pitch,
    borderBottom: `3px solid ${emailColors.gold}`,
    padding: "20px 32px",
  },
  headerText: {
    color: emailColors.chalk,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: 0,
  },
  section: { padding: "28px 32px" },
  p: { fontSize: 15, lineHeight: "24px", margin: "0 0 16px" },
  muted: { fontSize: 13, lineHeight: "20px", color: "#4A4A40", margin: "0 0 8px" },
  h2: { fontSize: 17, fontWeight: 700, margin: "0 0 12px" },
  mono: {
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  },
  codeBox: {
    backgroundColor: emailColors.pitchDeep,
    borderTop: `3px solid ${emailColors.gold}`,
    borderRadius: 4,
    padding: "18px 24px",
    textAlign: "center" as const,
    margin: "8px 0 20px",
  },
  codeText: {
    color: emailColors.gold,
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "0.08em",
    margin: 0,
  },
  button: {
    backgroundColor: emailColors.gold,
    borderRadius: 4,
    color: emailColors.kit,
    display: "inline-block",
    fontSize: 15,
    fontWeight: 600,
    padding: "12px 24px",
    textDecoration: "none",
  },
  hr: { borderColor: emailColors.line, margin: "24px 0" },
  footer: {
    fontSize: 12,
    lineHeight: "18px",
    color: "#4A4A40",
    padding: "0 32px 28px",
  },
} as const;

export function EmailShell({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Section style={emailStyles.header}>
            <Text style={emailStyles.headerText}>Moyours Football Club Academy</Text>
          </Section>
          {children}
          <Hr style={emailStyles.hr} />
          <Section style={emailStyles.footer}>
            <Text style={emailStyles.muted}>
              Moyours Football Club Academy · Suite A05, Tsukunda House, CBD, Abuja
            </Text>
            <Text style={emailStyles.muted}>
              Questions? Reply to this email or call 09139583674.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
