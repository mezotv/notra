import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80svh] w-full flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-2">
        <span className="font-serif text-[8rem] text-foreground leading-none tracking-tight sm:text-[12rem] md:text-[16rem]">
          404
        </span>
        <p className="font-serif text-foreground text-xl sm:text-2xl">
          This page doesn&apos;t exist yet.
        </p>
      </div>
      <Link
        className="font-sans text-primary text-sm underline underline-offset-4 transition-colors hover:text-primary/80"
        href="/"
      >
        Back to home
      </Link>
    </div>
  );
}
