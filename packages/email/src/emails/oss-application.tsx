import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";

import { EmailFooter } from "../components/footer";
import type { OssApplicationEmailProps } from "../types/oss-application";
import { EMAIL_CONFIG } from "../utils/config";

export const OssApplicationEmail = ({
  name = "Linus Torvalds",
  email = "linus@example.com",
  projectName = "Linux",
  repositoryUrl = "https://github.com/torvalds/linux",
  description = "A free and open source operating system kernel used by everything from phones to supercomputers.",
  assetNeeds = "We need help turning releases into clear changelogs, launch posts, and social updates so new contributors can understand what's shipping.",
}: OssApplicationEmailProps) => {
  const logoUrl = EMAIL_CONFIG.getLogoUrl();

  return (
    <Html>
      <Head />
      <Preview>
        New OSS program application: {projectName} from {name}
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

            <Heading className="my-6 text-center text-2xl font-medium text-black">
              New OSS program application
            </Heading>

            <Section className="mt-6 rounded-md border border-solid border-[#eaeaea] bg-[#fafafa] p-5">
              <Text className="m-0 text-[15px] leading-[22px] whitespace-pre-wrap text-black">
                {description}
              </Text>
            </Section>

            <Section className="mt-8">
              <Text className="m-0 text-[12px] tracking-wide text-[#666666] uppercase">
                From
              </Text>
              <Text className="mt-1 mb-0 text-[14px] leading-[22px] text-black">
                {name} &lt;{email}&gt;
              </Text>
            </Section>

            <Section className="mt-4">
              <Text className="m-0 text-[12px] tracking-wide text-[#666666] uppercase">
                Project
              </Text>
              <Text className="mt-1 mb-0 text-[14px] leading-[22px] text-black">
                {projectName}
              </Text>
            </Section>

            <Section className="mt-4">
              <Text className="m-0 text-[12px] tracking-wide text-[#666666] uppercase">
                Repository
              </Text>
              <Text className="mt-1 mb-0 text-[14px] leading-[22px] break-all">
                <Link
                  href={repositoryUrl}
                  style={{ color: "#000000", textDecoration: "underline" }}
                >
                  {repositoryUrl}
                </Link>
              </Text>
            </Section>

            <Section className="mt-4">
              <Text className="m-0 text-[12px] tracking-wide text-[#666666] uppercase">
                Asset needs
              </Text>
              <Text className="mt-1 mb-0 text-[14px] leading-[22px] whitespace-pre-wrap text-black">
                {assetNeeds}
              </Text>
            </Section>

            <Section className="mt-4">
              <Text className="m-0 text-[12px] leading-[18px] text-[#666666]">
                The applicant confirmed they are an owner or maintainer of this
                repository.
              </Text>
            </Section>

            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OssApplicationEmail;
