import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Logs",
};

function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">Logs</h1>
          <p className="text-muted-foreground">
            View brand analysis history and activity logs
          </p>
        </div>

        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      </div>
    </div>
  );
}

export default Page;
