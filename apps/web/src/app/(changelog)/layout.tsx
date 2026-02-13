import Link from "next/link";
import { NotraMark } from "../../components/notra-mark";

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-220 flex-col items-stretch px-4 pt-24 pb-16 sm:px-6 sm:pt-28 md:px-8 md:pt-32 lg:px-0">
      {children}
      <div className="mt-16 flex items-center justify-center gap-2 border-border border-t pt-8">
        <Link
          className="flex items-center gap-2 text-foreground/50 transition-colors hover:text-foreground/80"
          href="/"
        >
          <span className="text-[#8E51FF]">
            <NotraMark className="h-4 w-4 shrink-0" strokeWidth={40} />
          </span>
          <span className="font-medium font-sans text-xs">
            Powered by Notra
          </span>
        </Link>
      </div>
    </div>
  );
}
