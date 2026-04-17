"use client";

import {
  CheckmarkCircle02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { authClient } from "@/lib/auth/client";
import type { LoginDetailsSectionProps } from "@/types/settings/account";

const passwordSchema = z
  .object({
    currentPassword: z.string().trim().min(1, "Current password is required"),
    newPassword: z
      .string()
      .trim()
      .min(1, "New password cannot be empty")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().trim().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function LoginDetailsSection({
  email,
  hasPasswordAccount,
}: LoginDetailsSectionProps) {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      const validated = passwordSchema.safeParse(value);

      if (!validated.success) {
        const issue = validated.error?.issues[0];
        toast.error(issue?.message ?? "Invalid password details");
        return;
      }

      setIsChangingPassword(true);
      try {
        const result = await authClient.changePassword({
          currentPassword: validated.data.currentPassword,
          newPassword: validated.data.newPassword,
          revokeOtherSessions: true,
        });

        if (result.error) {
          toast.error(result.error.message ?? "Failed to change password");
          return;
        }

        toast.success("Password changed successfully");
        form.reset();
      } catch {
        toast.error("Failed to change password");
      } finally {
        setIsChangingPassword(false);
      }
    },
  });

  return (
    <TitleCard heading="Login Details">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Email</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 truncate rounded-md border bg-muted/50 px-3 py-2 text-sm">
              {email}
            </div>
            <HugeiconsIcon
              className="text-green-600"
              icon={CheckmarkCircle02Icon}
              size={20}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Your email is used to sign in and receive notifications
          </p>
        </div>

        {hasPasswordAccount && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <div className="border-t pt-4">
              <p className="mb-4 font-medium text-sm">Update your password</p>

              <div className="space-y-3">
                <form.Field name="currentPassword">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Current password</Label>
                      <div className="relative">
                        <Input
                          autoComplete="current-password"
                          className="pr-9"
                          id={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter current password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={field.state.value}
                        />
                        <button
                          aria-label={
                            showCurrentPassword
                              ? "Hide current password"
                              : "Show current password"
                          }
                          className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          type="button"
                        >
                          <HugeiconsIcon
                            icon={
                              showCurrentPassword ? ViewOffSlashIcon : ViewIcon
                            }
                            size={16}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </form.Field>

                <form.Field name="newPassword">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>New password</Label>
                      <div className="relative">
                        <Input
                          autoComplete="new-password"
                          className="pr-9"
                          id={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter new password"
                          type={showNewPassword ? "text" : "password"}
                          value={field.state.value}
                        />
                        <button
                          aria-label={
                            showNewPassword
                              ? "Hide new password"
                              : "Show new password"
                          }
                          className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          type="button"
                        >
                          <HugeiconsIcon
                            icon={showNewPassword ? ViewOffSlashIcon : ViewIcon}
                            size={16}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </form.Field>

                <form.Field name="confirmPassword">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Confirm new password</Label>
                      <Input
                        autoComplete="new-password"
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Confirm new password"
                        type="password"
                        value={field.state.value}
                      />
                    </div>
                  )}
                </form.Field>
              </div>

              <Button
                className="mt-4"
                disabled={isChangingPassword}
                type="submit"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change password"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </TitleCard>
  );
}
