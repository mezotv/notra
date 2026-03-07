import { Body, Head, Html, Link, Preview, Text } from "@react-email/components";

import { EMAIL_CONFIG } from "../utils/config";

export const WelcomeEmail = () => {
  const appUrl = EMAIL_CONFIG.getAppUrl();

  return (
    <Html>
      <Head />
      <Preview>Welcome to Notra - A quick note from the founder</Preview>
      <Body>
        <Text>
          Hey I'm Dominik, the founder of Notra. I wanted to personally welcome
          you and say thanks for signing up.
        </Text>

        <Text>
          We built Notra because we were shipping faster than ever but didn't
          have enough time to come up with tweets, changelogs and LinkedIn
          posts.
        </Text>

        <Text>
          If you have any questions, feedback, or just want to chat reply to
          this email. We read every single one of them.
        </Text>

        <Text>
          You can also{" "}
          <Link href="https://usenotra.com/founder-chat">schedule a chat</Link>{" "}
          with us or join our{" "}
          <Link href="https://usenotra.com/discord">Discord Community</Link>!
        </Text>

        <Text>
          Cheers,
          <br />
          Dominik & The Notra Team
        </Text>

        <Text style={{ fontSize: "12px", color: "#999", marginTop: "32px" }}>
          <Link href="https://usenotra.com/legal" style={{ color: "#999" }}>
            Legal Notice
          </Link>
          {" · "}
          <Link href="https://usenotra.com/privacy" style={{ color: "#999" }}>
            Privacy Policy
          </Link>
          {" · "}
          <Link href="https://usenotra.com/terms" style={{ color: "#999" }}>
            Terms of Service
          </Link>
        </Text>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;
