import { Section, Text } from "@react-email/components";
import { EmailShell, emailStyles } from "./components";

export type GuardianRejectedProps = {
  guardianName: string;
  playerName: string;
  reference: string;
  reason: string;
  resubmitUrl: string;
};

export function GuardianRejectedEmail({
  guardianName,
  playerName,
  reference,
  reason,
  resubmitUrl,
}: GuardianRejectedProps) {
  return (
    <EmailShell preview={`About ${playerName}'s registration`}>
      <Section style={emailStyles.section}>
        <Text style={emailStyles.h2}>About {playerName}&apos;s registration</Text>
        <Text style={emailStyles.p}>Dear {guardianName},</Text>
        <Text style={emailStyles.p}>
          We reviewed {playerName}&apos;s application (reference{" "}
          <span style={emailStyles.mono}>{reference}</span>) and couldn&apos;t
          confirm it this time:
        </Text>
        <Text style={{ ...emailStyles.p, fontWeight: 600 }}>{reason}</Text>
        <Text style={emailStyles.p}>
          This is fixable — you can submit a fresh application with the
          corrected details or payment at{" "}
          <a href={resubmitUrl}>moyoursacademy.ng/enroll</a>. If you believe this
          was a mistake, reply to this email or call 08099926480 and we&apos;ll
          look at it together.
        </Text>
      </Section>
    </EmailShell>
  );
}

export function guardianRejectedText(props: GuardianRejectedProps): string {
  return `Dear ${props.guardianName},

We reviewed ${props.playerName}'s application (reference ${props.reference}) and couldn't confirm it this time:

${props.reason}

This is fixable — you can submit a fresh application with the corrected details or payment at ${props.resubmitUrl}. If you believe this was a mistake, reply to this email or call 08099926480 and we'll look at it together.

Moyours Sports Academy`;
}
