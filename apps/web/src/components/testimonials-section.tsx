import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";

export default function TestimonialsSection() {
  return (
    <div className="flex w-full flex-col items-center justify-center border-border border-b">
      <div className="flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-16 md:py-24">
        <p className="text-center font-medium font-sans text-foreground text-xl leading-relaxed tracking-tight md:text-2xl md:leading-10">
          &ldquo;Notra&apos;s been good to have as I get content created from
          other people&apos;s work on the team, without asking them or really
          doing anything. We can actually create decent content and talk about
          even the small things we ship, easy.&rdquo;
        </p>
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarImage alt="Will De Ath" src="/testimonials/Will.webp" />
            <AvatarFallback>WD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium font-sans text-base text-foreground">
              Will De Ath
            </span>
            <span className="font-normal font-sans text-muted-foreground text-sm">
              Head of Growth, Consent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
