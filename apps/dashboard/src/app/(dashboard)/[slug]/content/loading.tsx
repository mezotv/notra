import { ContentPageSkeleton } from "./skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-9 w-36 rounded-md bg-muted" />
            <div className="h-5 w-72 rounded-md bg-muted" />
          </div>
          <div className="h-9 w-36 rounded-md bg-muted" />
        </div>
        <ContentPageSkeleton />
      </div>
    </div>
  );
}
