"use client";

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
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";

interface InviteMemberModalProps {
  organizationId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberModal({
  organizationId,
  open,
  onOpenChange,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin" | "owner">("member");
  const queryClient = useQueryClient();

  const { mutate: inviteMember, isPending } = useMutation({
    mutationFn: async () => {
      if (!organizationId) {
        return;
      }
      const { error } = await authClient.organization.inviteMember({
        email,
        role,
        organizationId,
      });

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      onOpenChange(false); // Close first
      setTimeout(() => {
        // Clear state after closing animation could be better but this is fine
        setEmail("");
        setRole("member");
      }, 300);
      queryClient.invalidateQueries({
        queryKey: ["invitations", organizationId],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!organizationId) {
      toast.error("Organization ID is missing. Please try again.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Please enter an email address.");
      return;
    }

    inviteMember();
  };

  const canSubmit = !!organizationId && email.trim().length > 0;

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Invite Member</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Invite a new member to your organization. They will receive an email
            invitation.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              required
              type="email"
              value={email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              onValueChange={(val) =>
                val && setRole(val as "member" | "admin" | "owner")
              }
              value={role}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  className="capitalize"
                  placeholder="Select a role"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose
              disabled={isPending}
              render={
                <Button
                  className="w-full justify-center sm:w-auto"
                  variant="outline"
                />
              }
            >
              Cancel
            </ResponsiveDialogClose>
            <Button
              className="w-full justify-center sm:w-auto"
              disabled={!canSubmit || isPending}
              onClick={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              type="button"
            >
              {isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
