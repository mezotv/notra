import Link from "next/link";
import type { SponsorsProps } from "~types/sponsors";

export function Sponsors({ sponsors }: SponsorsProps) {
  if (sponsors.length === 0) {
    return null;
  }

  return (
    <section className="flex w-full flex-col gap-8 px-4 py-12 sm:px-6 md:px-8 md:py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="font-sans font-semibold text-2xl text-foreground tracking-tight md:text-3xl">
          Our Sponsors
        </h2>
        <p className="max-w-2xl text-balance text-muted-foreground">
          Notra is supported by sponsors who help keep the project running.
          Thank you for backing open source.
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-stretch justify-center gap-4">
        {sponsors.map((sponsor) => (
          <Link
            className="group flex flex-col items-center gap-4 rounded-xl bg-card px-8 py-6 transition-colors hover:bg-muted"
            href={sponsor.url}
            key={sponsor.name}
            rel="noopener noreferrer"
            target="_blank"
          >
            <sponsor.logo
              aria-label={sponsor.name}
              className="h-10 w-auto"
              role="img"
            />
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="font-medium font-sans text-foreground text-sm">
                {sponsor.name}
              </span>
              <span className="max-w-[16rem] text-muted-foreground text-xs leading-5">
                {sponsor.description}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
