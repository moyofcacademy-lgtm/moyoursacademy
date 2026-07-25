import { Section, Text } from "@react-email/components";
import { EmailShell, emailStyles } from "./components";

export type ContactMessageProps = {
  name: string;
  phone: string;
  email?: string;
  message: string;
};

export function ContactMessageEmail(props: ContactMessageProps) {
  return (
    <EmailShell preview={`Website message from ${props.name}`}>
      <Section style={emailStyles.section}>
        <Text style={emailStyles.h2}>New message from the website</Text>
        <Text style={emailStyles.muted}>From</Text>
        <Text style={emailStyles.p}>
          {props.name}
          <br />
          {props.phone}
          {props.email ? (
            <>
              <br />
              {props.email}
            </>
          ) : null}
        </Text>
        <Text style={emailStyles.muted}>Message</Text>
        <Text style={emailStyles.p}>{props.message}</Text>
      </Section>
    </EmailShell>
  );
}

export function contactMessageText(props: ContactMessageProps): string {
  return `New message from the website

From: ${props.name}
Phone: ${props.phone}${props.email ? `\nEmail: ${props.email}` : ""}

${props.message}`;
}
