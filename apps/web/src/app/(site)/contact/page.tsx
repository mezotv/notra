import type { Metadata } from "next";
import { ContactDeveloperNote } from "@/components/contact/contact-developer-note";
import { ContactEmail } from "@/components/contact/contact-email";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactResources } from "@/components/contact/contact-resources";
import { HeroDither } from "@/components/landing/hero-dither";
import { CONTACT_RESPONSE_TIME } from "@/constants/contact";
import { PAGE_SOCIAL_IMAGES, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const title = "Contact Notra";
const description =
  "Talk to the Notra team about sales, support, security disclosures, partnerships, and developer integration help. A real human writes back.";
const url = `${SITE_URL}/contact`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: "website",
    siteName: "Notra",
    images: [PAGE_SOCIAL_IMAGES.contact],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [PAGE_SOCIAL_IMAGES.contact.url],
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
};

export default function ContactPage() {
  return (
    <div className="flex w-full flex-col items-center gap-8 pt-6 pb-2">
      <section className="relative flex w-full flex-col items-center overflow-clip rounded-3xl bg-white pt-16 pb-20 antialiased sm:pt-20 lg:pt-24 dark:bg-transparent">
        <HeroDither className="-top-14 -translate-x-1/2 pointer-events-none absolute left-1/2 h-264.5 w-403.25" />
        <div className="relative flex flex-col items-center gap-6 px-6">
          <h1 className="max-w-[51.25rem] text-balance text-center font-display font-medium text-[#1E1E1E] text-[2.5rem] leading-[1.12] tracking-[-0.015em] sm:text-[3.25rem] lg:text-[4.25rem] dark:text-white">
            We read every message. Let's talk.
          </h1>
          <p className="max-w-[37.5rem] text-balance text-center font-medium font-sans text-[#1E1E1EBF] text-lg leading-[1.28] tracking-[-0.005em] sm:text-xl dark:text-white/70">
            Tell us what you're working on and a real human will write back.{" "}
            {CONTACT_RESPONSE_TIME}
          </p>
        </div>
      </section>

      <section className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_32.5rem]">
        <ContactForm />
        <div className="flex flex-col gap-6">
          <ContactEmail />
          <ContactResources />
          <ContactDeveloperNote />
        </div>
      </section>
    </div>
  );
}
