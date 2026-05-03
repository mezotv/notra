import { Hr, Link, Section, Text } from "@react-email/components";
import type { EmailFooterProps } from "../types/footer";
import { EMAIL_CONFIG } from "../utils/config";

export const EmailFooter = ({ unsubscribeUrl }: EmailFooterProps = {}) => {
  const currentYear = new Date().getFullYear();
  const linkStyle = { color: "#717175", textDecoration: "underline" };

  return (
    <Section>
      <Hr className="mx-0 mb-[26px] w-full border border-[#eaeaea] border-solid" />
      <Text className="m-0 text-center text-xs" style={{ color: "#717175" }}>
        © {currentYear} Notra. All rights reserved.
      </Text>
      <Text className="mt-4 text-center text-xs" style={{ color: "#717175" }}>
        <Link href="https://www.usenotra.com" style={linkStyle}>
          Website
        </Link>
        {" · "}
        <Link href="https://www.usenotra.com/legal" style={linkStyle}>
          Legal Notice
        </Link>
        {" · "}
        <Link href="https://www.usenotra.com/privacy" style={linkStyle}>
          Privacy Policy
        </Link>
        {" · "}
        <Link href={`mailto:${EMAIL_CONFIG.replyTo}`} style={linkStyle}>
          Support
        </Link>
        {unsubscribeUrl ? (
          <>
            {" · "}
            <Link href={unsubscribeUrl} style={linkStyle}>
              Unsubscribe
            </Link>
          </>
        ) : null}
      </Text>
      <Text
        className="mt-4 text-center text-xs"
        style={{ color: "#717175", lineHeight: "1.5" }}
      >
        {EMAIL_CONFIG.physicalAddress.name}
        <br />
        {EMAIL_CONFIG.physicalAddress.street},{" "}
        {EMAIL_CONFIG.physicalAddress.zip} {EMAIL_CONFIG.physicalAddress.city},{" "}
        {EMAIL_CONFIG.physicalAddress.country}
      </Text>
    </Section>
  );
};
