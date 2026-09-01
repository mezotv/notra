import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";

import { EmailButton } from "../components/button";
import { EmailFooter } from "../components/footer";
import { EMAIL_CONFIG } from "../utils/config";

interface InviteUserEmailProps {
  inviteeEmail: string;
  invitedByUsername: string;
  invitedByEmail: string;
  organizationName: string;
  inviteLink: string;
}

export const InviteUserEmail = ({
  inviteeEmail,
  invitedByUsername,
  organizationName,
  inviteLink,
}: InviteUserEmailProps) => {
  const previewText = `Join ${invitedByUsername} on Notra`;
  const logoUrl = EMAIL_CONFIG.getLogoUrl();

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded p-[20px]">
            <Section className="mt-[32px]">
              <Img
                alt="Notra Logo"
                className="mx-auto"
                height="40"
                src={logoUrl}
                width="40"
              />
            </Section>

            <Heading className="my-6 text-center text-2xl font-medium text-black">
              Join <strong>{organizationName}</strong> on Notra
            </Heading>

            <Text className="text-center text-base leading-relaxed text-[#737373]">
              <strong>{invitedByUsername}</strong> has invited you to join the{" "}
              <strong>{organizationName}</strong> organization on Notra.
            </Text>

            <Section className="my-8 text-center">
              <EmailButton href={inviteLink}>Join Organization</EmailButton>
            </Section>

            <Text className="text-[14px] leading-[24px] text-black">
              or copy and paste this URL into your browser:{" "}
              <Link className="text-blue-600 no-underline" href={inviteLink}>
                {inviteLink}
              </Link>
            </Text>

            <Hr className="mx-0 mt-[26px] w-full border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              This invitation was intended for{" "}
              <span className="text-black">{inviteeEmail}</span>. If you weren't
              expecting this, you can safely ignore this email. Need help? Reach
              us at {EMAIL_CONFIG.replyTo}.
            </Text>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
