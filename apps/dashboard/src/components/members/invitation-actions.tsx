"use client";

import {
  Cancel01Icon,
  MailSend01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@notra/ui/components/shared/responsive-alert-dialog";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import type { Invitation } from "better-auth/plugins/organization";
import { useState } from "react";
import { toast } from "sonner";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { authClient } from "@/lib/auth/client";

interface InvitationActionsProps {
  invitation: Invitation;
}

export function InvitationActions({ invitation }: InvitationActionsProps) {
  const queryClient = useQueryClient();
  const { activeOrganization } = useOrganizationsContext();

  const [isResending, setIsResending] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showResendDialog, setShowResendDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  if (!activeOrganization) {
    return null;
  }

  async function handleResendInvitation() {
    if (!activeOrganization) {
      return;
    }

    setIsResending(true);
    try {
      const { error } = await authClient.organization.inviteMember({
        email: invitation.email,
        role: invitation.role as "member" | "owner" | "admin",
        organizationId: activeOrganization.id,
        resend: true,
      });

      if (error) {
        toast.error(error.message || "Failed to resend invitation");
        return;
      }

      toast.success(`Invitation resent to ${invitation.email}`);

      await queryClient.invalidateQueries({
        queryKey: ["invitations", activeOrganization.id],
      });

      setShowResendDialog(false);
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error("Failed to resend invitation");
    } finally {
      setIsResending(false);
    }
  }

  async function handleCancelInvitation() {
    if (!activeOrganization) {
      return;
    }

    setIsCanceling(true);
    try {
      const { error } = await authClient.organization.cancelInvitation({
        invitationId: invitation.id,
      });

      if (error) {
        toast.error(error.message || "Failed to cancel invitation");
        return;
      }

      toast.success(`Invitation to ${invitation.email} has been canceled`);

      await queryClient.invalidateQueries({
        queryKey: ["invitations", activeOrganization.id],
      });

      setShowCancelDialog(false);
    } catch (error) {
      console.error("Error canceling invitation:", error);
      toast.error("Failed to cancel invitation");
    } finally {
      setIsCanceling(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button className="size-8 p-0" variant="ghost">
              <span className="sr-only">Open menu</span>
              <HugeiconsIcon className="size-4" icon={MoreVerticalIcon} />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            disabled={isResending || isCanceling}
            onClick={() => setShowResendDialog(true)}
          >
            <HugeiconsIcon className="mr-2 size-4" icon={MailSend01Icon} />
            Resend invitation
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isResending || isCanceling}
            onClick={() => setShowCancelDialog(true)}
            variant="destructive"
          >
            <HugeiconsIcon className="mr-2 size-4" icon={Cancel01Icon} />
            Cancel invitation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResponsiveDialog
        onOpenChange={(open) => {
          if (!isResending) {
            setShowResendDialog(open);
          }
        }}
        open={showResendDialog}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Resend invitation?</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              This will resend the invitation email to{" "}
              <span className="font-semibold underline">
                {invitation.email}
              </span>
              . They will receive a new invitation link.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose
              disabled={isResending}
              render={<Button variant="outline" />}
            >
              Cancel
            </ResponsiveDialogClose>
            <Button disabled={isResending} onClick={handleResendInvitation}>
              {isResending ? "Resending..." : "Resend Invitation"}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveAlertDialog
        onOpenChange={(open) => {
          if (!isCanceling) {
            setShowCancelDialog(open);
          }
        }}
        open={showCancelDialog}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Cancel invitation?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              This will cancel the invitation sent to {invitation.email}. They
              will no longer be able to accept this invitation.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel disabled={isCanceling}>
              Cancel
            </ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isCanceling}
              onClick={handleCancelInvitation}
            >
              {isCanceling ? "Canceling..." : "Cancel Invitation"}
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </>
  );
}
