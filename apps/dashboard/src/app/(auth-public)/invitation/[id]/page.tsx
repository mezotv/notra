import { Loader2Icon } from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getInvitationById } from "@/lib/auth/actions";
import { auth } from "@/lib/auth/server";
import PageClient from "./page-client";

export default async function InvitePage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { id } = params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader2Icon className="animate-spin" />
        </div>
      }
    >
      <InvitePageComponent invitationId={id} />
    </Suspense>
  );
}

async function InvitePageComponent({ invitationId }: { invitationId: string }) {
  const sessionPromise = headers().then((requestHeaders) =>
    auth.api.getSession({
      headers: requestHeaders,
    })
  );
  const invitationPromise = getInvitationById(invitationId);
  const [session, invitationData] = await Promise.all([
    sessionPromise,
    invitationPromise,
  ]);

  if (!invitationData) {
    notFound();
  }

  // If invitation is expired or already accepted/rejected, show error
  if (invitationData.expired || invitationData.status !== "pending") {
    let initialError = "This invitation is no longer valid.";
    if (invitationData.expired) {
      initialError = "This invitation has expired.";
    } else if (invitationData.status === "accepted") {
      initialError = "This invitation has already been accepted.";
    } else if (invitationData.status === "rejected") {
      initialError = "This invitation has been declined.";
    }
    return (
      <PageClient
        initialError={initialError}
        invitation={invitationData}
        invitationId={invitationId}
        user={session?.user ?? null}
      />
    );
  }

  return (
    <PageClient
      invitation={invitationData}
      invitationId={invitationId}
      user={session?.user ?? null}
    />
  );
}
