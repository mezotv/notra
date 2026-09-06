import Link from "next/link";
import type { SponsorsProps } from "~types/sponsors";

export function Sponsors({ sponsors }: SponsorsProps) {
  if (sponsors.length === 0) {
    return null;
  }

  return (
    <section className="flex w-full flex-col gap-8 px-4 py-12 sm:px-6 md:px-8 md:py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="font-display text-foreground text-2xl font-medium tracking-[-0.02em] md:text-3xl">
          Our Sponsors
        </h2>
        <p className="text-muted-foreground max-w-2xl text-balance">
          Notra is supported by sponsors who help keep the project running.
          Thank you for backing open source.
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-12 sm:gap-16">
        {sponsors.map((sponsor) => (
          <Link
            className="text-foreground focus-visible:ring-ring flex flex-col items-center gap-4 rounded-sm transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none"
            href={sponsor.url}
            key={sponsor.name}
            rel="noopener noreferrer"
            target="_blank"
          >
            <sponsor.logo aria-hidden="true" className="h-10 w-auto" />
            <span className="font-sans text-sm font-medium">
              {sponsor.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
