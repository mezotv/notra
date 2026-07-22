import Link from "next/link";

const linkClass =
  "font-medium text-primary underline underline-offset-2 hover:text-primary-hover";

export function ContactDeveloperNote() {
  return (
    <div className="flex flex-col gap-1 rounded-3xl border border-[#ECECEC] px-7 py-5 dark:border-white/10">
      <p className="font-display font-medium text-[#1E1E1E] text-[0.9375rem]/5 tracking-[-0.01em] dark:text-white">
        Building with the API or an agent?
      </p>
      <p className="font-sans text-[#1E1E1EA6] text-[0.8125rem]/4.75 dark:text-white/60">
        Start with the{" "}
        <Link className={linkClass} href="/auth.md">
          agent authentication guide
        </Link>
        , the{" "}
        <Link className={linkClass} href="/.well-known/api-catalog">
          API catalog
        </Link>
        , and the scoped{" "}
        <Link className={linkClass} href="/developers/llms.txt">
          developer llms.txt
        </Link>
        .
      </p>
    </div>
  );
}
