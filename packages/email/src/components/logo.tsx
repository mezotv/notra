import { Img, Link, Section } from "react-email";

import { EMAIL_CONFIG } from "../utils/config";

export const EmailLogo = () => (
  <Section className="mt-[32px] text-center">
    <Link href={EMAIL_CONFIG.getSiteUrl()}>
      <Img
        alt="Notra"
        className="mx-auto"
        height="64"
        src={EMAIL_CONFIG.getLogoUrl()}
        style={{ borderRadius: "14px" }}
        width="64"
      />
    </Link>
  </Section>
);
