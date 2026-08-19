import { BannedNotice } from "@/components/auth/banned-notice";

export default function BannedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <BannedNotice />
    </div>
  );
}
