"use client";

import { ResponsiveDialogClose } from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@/components/button";
import type { McpDialogFooterProps } from "@/types/integrations/mcp";

export function McpDialogFooter({
  authType,
  canSubmit,
  status,
  onCancel,
  onTest,
}: McpDialogFooterProps) {
  const isCreating = status === "creating";
  const isRedirecting = status === "redirecting";
  const isTesting = status === "testing";
  const isPending = isCreating || isRedirecting;
  let submitLabel = authType === "oauth" ? "Connect & Authorize" : "Add Server";
  if (isCreating) {
    submitLabel = "Adding...";
  } else if (isRedirecting) {
    submitLabel = "Redirecting...";
  }

  return (
    <>
      {authType !== "oauth" ? (
        <Button
          className="sm:mr-auto"
          disabled={isTesting}
          onClick={onTest}
          type="button"
          variant="outline"
        >
          {isTesting ? "Testing..." : "Test Connection"}
        </Button>
      ) : (
        <div className="sm:mr-auto" />
      )}
      <ResponsiveDialogClose
        disabled={isPending}
        onClick={onCancel}
        render={<Button type="button" variant="outline" />}
      >
        Cancel
      </ResponsiveDialogClose>
      <Button disabled={!canSubmit || isPending} type="submit">
        {submitLabel}
      </Button>
    </>
  );
}
