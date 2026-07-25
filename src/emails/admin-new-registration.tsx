import { Button, Section, Text } from "@react-email/components";
import { EmailShell, emailStyles } from "./components";

export type AdminNewRegistrationProps = {
  playerName: string;
  ageLine: string; // "9 years (14 Mar 2017) · U11 · Female"
  position?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  address: string;
  reference: string;
  amountLine: string; // "₦180,000 (initial payment)"
  proofUrl: string;
  reviewUrl: string;
};

export function AdminNewRegistrationEmail(props: AdminNewRegistrationProps) {
  return (
    <EmailShell preview={`New registration: ${props.playerName}`}>
      <Section style={emailStyles.section}>
        <Text style={emailStyles.h2}>New player registration</Text>

        <Text style={emailStyles.muted}>Player</Text>
        <Text style={emailStyles.p}>
          {props.playerName}
          <br />
          {props.ageLine}
          {props.position ? (
            <>
              <br />
              Preferred position: {props.position}
            </>
          ) : null}
        </Text>

        <Text style={emailStyles.muted}>Guardian</Text>
        <Text style={emailStyles.p}>
          {props.guardianName}
          <br />
          {props.guardianPhone} · {props.guardianEmail}
          <br />
          {props.address}
        </Text>

        <Text style={emailStyles.muted}>Payment</Text>
        <Text style={emailStyles.p}>
          {props.amountLine}
          <br />
          Reference: <span style={emailStyles.mono}>{props.reference}</span>
          <br />
          <a href={props.proofUrl}>View payment proof</a> (signed link, expires in
          10 minutes)
        </Text>

        <Button href={props.reviewUrl} style={emailStyles.button}>
          Review registration
        </Button>
      </Section>
    </EmailShell>
  );
}

export function adminNewRegistrationText(props: AdminNewRegistrationProps): string {
  return `New player registration — ${props.playerName}

Player: ${props.playerName}
${props.ageLine}${props.position ? `\nPreferred position: ${props.position}` : ""}

Guardian: ${props.guardianName}
${props.guardianPhone} · ${props.guardianEmail}
${props.address}

Payment: ${props.amountLine}
Reference: ${props.reference}
Proof (signed link, expires in 10 minutes): ${props.proofUrl}

Review: ${props.reviewUrl}`;
}
