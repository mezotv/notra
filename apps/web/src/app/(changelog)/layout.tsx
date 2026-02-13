export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-220 flex-col items-stretch px-4 pt-24 pb-16 sm:px-6 sm:pt-28 md:px-8 md:pt-32 lg:px-0">
        {children}
      </div>
      <div className="w-full border-border border-t" />
    </>
  );
}
