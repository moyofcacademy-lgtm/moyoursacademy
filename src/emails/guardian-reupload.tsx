import { Button, Section, Text } from "@react-email/components";
import { EmailShell, emailStyles } from "./components";

export type GuardianReuploadProps = {
  guardianName: string;
  playerName: string;
  reference: string;
  reuploadUrl: string;
};

export function GuardianReuploadEmail({
  guardianName,
  playerName,
  reference,
  reuploadUrl,
}: GuardianReuploadProps) {
  return (
    <EmailShell preview={`We need a clearer payment proof for ${playerName}`}>
      <Section style={emailStyles.section}>
        <Text style={emailStyles.h2}>We need a clearer payment proof</Text>
        <Text style={emailStyles.p}>Dear {guardianName},</Text>
        <Text style={emailStyles.p}>
          We&apos;re reviewing {playerName}&apos;s application (reference{" "}
          <span style={emailStyles.mono}>{reference}</span>), but the payment
          proof you uploaded is hard to read. Upload a clearer photo or the PDF
          receipt from your banking app and we&apos;ll continue right away:
        </Text>
        <Button href={reuploadUrl} style={emailStyles.button}>
          Upload new proof
        </Button>
        <Text style={{ ...emailStyles.p, marginTop: 16 }}>
          Your application keeps the same reference — nothing else changes.
        </Text>
      </Section>
    </EmailShell>
  );
}

export function guardianReuploadText(props: GuardianReuploadProps): string {
  return `Dear ${props.guardianName},

We're reviewing ${props.playerName}'s application (reference ${props.reference}), but the payment proof you uploaded is hard to read.

Upload a clearer photo or the PDF receipt from your banking app and we'll continue right away: ${props.reuploadUrl}

Your application keeps the same reference — nothing else changes.

Moyours Sports Academy`;
}
