export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-180 px-4 pt-24 pb-16 sm:px-6 sm:pt-28 md:px-8 md:pt-32 lg:px-0">
      <article className="prose prose-neutral max-w-none prose-headings:font-sans prose-headings:font-semibold prose-p:font-sans prose-a:text-primary prose-li:text-foreground/80 prose-p:text-foreground/80 prose-strong:text-foreground prose-p:leading-7 prose-headings:tracking-tight prose-a:no-underline hover:prose-a:underline">
        {children}
      </article>
    </div>
  );
}
