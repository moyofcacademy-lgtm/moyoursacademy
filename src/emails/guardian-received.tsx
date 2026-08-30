import { Section, Text } from "@react-email/components";
import { EmailShell, emailStyles } from "./components";

export function GuardianReceivedEmail({
  guardianName,
  playerName,
  reference,
}: {
  guardianName: string;
  playerName: string;
  reference: string;
}) {
  return (
    <EmailShell preview={`We've received ${playerName}'s registration`}>
      <Section style={emailStyles.section}>
        <Text style={emailStyles.h2}>Application received</Text>
        <Text style={emailStyles.p}>Dear {guardianName},</Text>
        <Text style={emailStyles.p}>
          Thank you we&apos;ve received {playerName}&apos;s registration and
          your proof of payment. Your application reference is:
        </Text>
        <Section style={emailStyles.codeBox}>
          <Text style={emailStyles.codeText}>{reference}</Text>
        </Section>
        <Text style={emailStyles.p}>
          Our team will verify your payment and send {playerName}&apos;s member
          code once the place is confirmed usually within 2 working days. You
          can check progress anytime at moyoursacademy.ng/status using this
          reference or your phone number.
        </Text>
        <Text style={emailStyles.p}>Welcome to the Moyours family.</Text>
      </Section>
    </EmailShell>
  );
}

export function guardianReceivedText({
  guardianName,
  playerName,
  reference,
}: {
  guardianName: string;
  playerName: string;
  reference: string;
}): string {
  return `Dear ${guardianName},

Thank you we've received ${playerName}'s registration and your proof of payment.

Your application reference: ${reference}

Our team will verify your payment and send ${playerName}'s member code once the place is confirmed, usually within 2 working days. Check progress anytime at moyoursacademy.ng/status.

Welcome to the Moyours family.
Moyours Football Club Academy · Suite A05, Tsukunda House, CBD, Abuja`;
}
