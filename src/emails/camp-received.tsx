import { Section, Text } from "@react-email/components";
import { EmailShell, emailStyles } from "./components";

export type CampReceivedProps = {
  guardianName: string;
  participantName: string;
  reference: string;
  paymentMethod: string; // CASH | TRANSFER
  feeLine: string; // "₦120,000 (5 weeks)"
  venue: string;
  startLine: string; // "Monday 27 July"
  scheduleLines: string[];
  bankLine: string; // "Lightway Microfinance Bank · 2020009050 · Moyours Sports Academy Limited"
  whatsappPhone: string;
};

export function CampReceivedEmail(props: CampReceivedProps) {
  return (
    <EmailShell preview={`${props.participantName} is registered for the Football Summer Camp`}>
      <Section style={emailStyles.section}>
        <Text style={emailStyles.h2}>Summer camp registration received</Text>
        <Text style={emailStyles.p}>Dear {props.guardianName},</Text>
        <Text style={emailStyles.p}>
          {props.participantName} is registered for the Moyours Football Summer
          Camp. Your registration reference:
        </Text>
        <Section style={emailStyles.codeBox}>
          <Text style={emailStyles.codeText}>{props.reference}</Text>
        </Section>

        <Text style={emailStyles.h2}>First session</Text>
        <Text style={emailStyles.p}>
          {props.startLine} at {props.venue}. Please arrive 15 minutes early
          with water, shin guards if you have them, and boots or trainers.
        </Text>

        <Text style={emailStyles.h2}>Weekly schedule</Text>
        <Text style={emailStyles.p}>
          {props.scheduleLines.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </Text>

        <Text style={emailStyles.h2}>Payment</Text>
        <Text style={emailStyles.p}>
          Camp fee: {props.feeLine}.{" "}
          {props.paymentMethod === "TRANSFER"
            ? "We've received your transfer details and will confirm your payment shortly."
            : "You chose to pay cash — please pay at the venue before the first session."}
          <br />
          Bank transfer: <span style={emailStyles.mono}>{props.bankLine}</span>
          <br />
          Use your reference as the transfer narration.
        </Text>

        <Text style={emailStyles.p}>
          Questions? WhatsApp us on {props.whatsappPhone}. See you on the pitch!
        </Text>
      </Section>
    </EmailShell>
  );
}

export function campReceivedText(props: CampReceivedProps): string {
  return `Dear ${props.guardianName},

${props.participantName} is registered for the Moyours Football Summer Camp.

Reference: ${props.reference}

FIRST SESSION
${props.startLine} at ${props.venue}. Arrive 15 minutes early with water, shin guards if you have them, and boots or trainers.

WEEKLY SCHEDULE
${props.scheduleLines.join("\n")}

PAYMENT
Camp fee: ${props.feeLine}. ${
    props.paymentMethod === "TRANSFER"
      ? "We've received your transfer details and will confirm your payment shortly."
      : "You chose to pay cash — please pay at the venue before the first session."
  }
Bank transfer: ${props.bankLine}
Use your reference as the transfer narration.

Questions? WhatsApp us on ${props.whatsappPhone}. See you on the pitch!

Moyours Sports Academy`;
}

export type CampAdminAlertProps = {
  participantName: string;
  ageLine: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  reference: string;
  paymentLine: string;
  reviewUrl: string;
};

export function CampAdminAlertEmail(props: CampAdminAlertProps) {
  return (
    <EmailShell preview={`Camp registration: ${props.participantName}`}>
      <Section style={emailStyles.section}>
        <Text style={emailStyles.h2}>New summer camp registration</Text>
        <Text style={emailStyles.muted}>Participant</Text>
        <Text style={emailStyles.p}>
          {props.participantName}
          <br />
          {props.ageLine}
        </Text>
        <Text style={emailStyles.muted}>Parent / guardian</Text>
        <Text style={emailStyles.p}>
          {props.guardianName}
          <br />
          {props.guardianPhone} · {props.guardianEmail}
        </Text>
        <Text style={emailStyles.muted}>Payment</Text>
        <Text style={emailStyles.p}>
          {props.paymentLine}
          <br />
          Reference: <span style={emailStyles.mono}>{props.reference}</span>
        </Text>
        <Text style={emailStyles.p}>
          <a href={props.reviewUrl}>Open the camp register</a>
        </Text>
      </Section>
    </EmailShell>
  );
}

export function campAdminAlertText(props: CampAdminAlertProps): string {
  return `New summer camp registration — ${props.participantName}

Participant: ${props.participantName}
${props.ageLine}

Guardian: ${props.guardianName}
${props.guardianPhone} · ${props.guardianEmail}

Payment: ${props.paymentLine}
Reference: ${props.reference}

Camp register: ${props.reviewUrl}`;
}
