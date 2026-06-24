import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { EmailFooter } from "../components/footer";
import type { ContactMessageEmailProps } from "../types/contact";
import { EMAIL_CONFIG } from "../utils/config";

export const ContactMessageEmail = ({
  name = "Jane Doe",
  email = "jane@example.com",
  company,
  message = "We're evaluating Notra for our team and would love to chat about volume pricing.",
}: ContactMessageEmailProps) => {
  const logoUrl = EMAIL_CONFIG.getLogoUrl();

  return (
    <Html>
      <Head />
      <Preview>
        New contact message from {name}
        {company ? ` (${company})` : ""}
      </Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[520px] rounded p-[20px]">
            <Section className="mt-[32px]">
              <Img
                alt="Notra Logo"
                className="mx-auto"
                height="40"
                src={logoUrl}
                width="40"
              />
            </Section>

            <Heading className="my-6 text-center font-medium text-2xl text-black">
              New contact message
            </Heading>

            <Section className="mt-6 rounded-md border border-[#eaeaea] border-solid bg-[#fafafa] p-5">
              <Text className="m-0 whitespace-pre-wrap text-[15px] text-black leading-[22px]">
                {message}
              </Text>
            </Section>

            <Section className="mt-8">
              <Text className="m-0 text-[#666666] text-[12px] uppercase tracking-wide">
                From
              </Text>
              <Text className="mt-1 mb-0 text-[14px] text-black leading-[22px]">
                {name} &lt;{email}&gt;
              </Text>
            </Section>

            {company ? (
              <Section className="mt-4">
                <Text className="m-0 text-[#666666] text-[12px] uppercase tracking-wide">
                  Company
                </Text>
                <Text className="mt-1 mb-0 text-[14px] text-black leading-[22px]">
                  {company}
                </Text>
              </Section>
            ) : null}

            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ContactMessageEmail;
