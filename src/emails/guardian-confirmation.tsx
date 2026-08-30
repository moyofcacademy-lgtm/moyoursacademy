import { Section, Text } from "@react-email/components";
import { EmailShell, emailStyles } from "./components";

export type GuardianConfirmationProps = {
  guardianName: string;
  playerName: string;
  memberCode: string;
  whatsappGroupUrl?: string;
};

export function GuardianConfirmationEmail({
  guardianName,
  playerName,
  memberCode,
  whatsappGroupUrl,
}: GuardianConfirmationProps) {
  return (
    <EmailShell
      preview={`${playerName} is confirmed member code ${memberCode}`}
    >
      <Section style={emailStyles.section}>
        <Text style={emailStyles.h2}>Welcome to the Moyours family</Text>
        <Text style={emailStyles.p}>Dear {guardianName},</Text>
        <Text style={emailStyles.p}>
          Wonderful news {playerName}&apos;s registration at Moyours Football
          Academy is confirmed. This is {playerName}&apos;s member code; keep it
          safe and quote it in any correspondence with the academy:
        </Text>
        <Section style={emailStyles.codeBox}>
          <Text style={emailStyles.codeText}>{memberCode}</Text>
        </Section>
        <Text style={emailStyles.p}>
          At Moyours, we believe football is more than just a game it&apos;s a
          pathway to growth, discipline, and opportunity. We&apos;re committed
          to {playerName}&apos;s development on and off the pitch, and
          we&apos;re excited to be part of the journey.
        </Text>

        <Text style={emailStyles.h2}>Training schedule</Text>
        <Text style={emailStyles.p}>
          Fridays, 4:00 – 6:00 PM WAT
          <br />
          Saturdays, 11:30 AM – 2:30 PM WAT
          <br />
          Moyours Training Ground · Suite A05, Tsukunda House, CBD, Abuja
        </Text>

        <Text style={emailStyles.h2}>What to expect</Text>
        <Text style={emailStyles.p}>
          Structured weekly training sessions · friendly matches · seasonal
          programmes including summer camps · continuous development and
          mentorship from our coaching team.
        </Text>

        {whatsappGroupUrl ? (
          <Text style={emailStyles.p}>
            Join the parents&apos; WhatsApp group for updates and matchday news:{" "}
            <a href={whatsappGroupUrl}>tap here to join</a>.
          </Text>
        ) : (
          <Text style={emailStyles.p}>
            You&apos;ll be added to the parents&apos; WhatsApp group for updates
            and matchday news.
          </Text>
        )}

        <Text style={emailStyles.h2}>Important notes</Text>
        <Text style={emailStyles.p}>
          Please arrive 15 minutes before each session punctuality is part of
          the training. Two sets of jerseys are included in your registration;
          appropriate football boots or trainers are required.
        </Text>

        <Text style={emailStyles.p}>
          Welcome to the Moyours family.
          <br /> The Moyours team, admin@moyoursacademy.com
        </Text>
      </Section>
    </EmailShell>
  );
}

export function guardianConfirmationText({
  guardianName,
  playerName,
  memberCode,
  whatsappGroupUrl,
}: GuardianConfirmationProps): string {
  return `Dear ${guardianName},

Wonderful news ${playerName}'s registration at Moyours Football Academy is confirmed.

MEMBER CODE: ${memberCode}
Keep it safe and quote it in any correspondence with the academy.

TRAINING SCHEDULE
Fridays, 4:00–6:00 PM WAT
Saturdays, 11:30 AM–2:30 PM WAT
Moyours Training Ground · Suite A05, Tsukunda House, CBD, Abuja

WHAT TO EXPECT
Structured weekly training sessions, friendly matches, seasonal programmes including summer camps, and continuous development and mentorship from our coaching team.

${whatsappGroupUrl ? `Join the parents' WhatsApp group: ${whatsappGroupUrl}` : "You'll be added to the parents' WhatsApp group for updates and matchday news."}

IMPORTANT NOTES
Please arrive 15 minutes before each session punctuality is part of the training. Two sets of jerseys are included in your registration; appropriate football boots or trainers are required.

Welcome to the Moyours family.
 The Moyours team, admin@moyoursacademy.com`;
}
