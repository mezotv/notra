export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex w-full flex-col items-center pb-16">{children}</div>
      <div className="w-full border-border border-t" />
    </>
  );
}
