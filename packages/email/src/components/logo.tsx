import { Img, Link, Section } from "react-email";

import { EMAIL_CONFIG } from "../utils/config";

type EmailLogoVariant = "mark" | "wordmark";

const WORDMARK = { width: 120, height: 46 } as const;
const MARK = { width: 64, height: 64 } as const;

export const EmailLogo = ({
  className = "mt-[32px] text-center",
  variant = "mark",
}: {
  className?: string;
  variant?: EmailLogoVariant;
} = {}) => {
  const isWordmark = variant === "wordmark";
  const size = isWordmark ? WORDMARK : MARK;

  return (
    <Section className={className}>
      <Link href={EMAIL_CONFIG.getSiteUrl()}>
        <Img
          alt="Notra"
          className="mx-auto"
          height={size.height}
          src={
            isWordmark
              ? EMAIL_CONFIG.getWordmarkUrl()
              : EMAIL_CONFIG.getLogoUrl()
          }
          style={isWordmark ? undefined : { borderRadius: "14px" }}
          width={size.width}
        />
      </Link>
    </Section>
  );
};
