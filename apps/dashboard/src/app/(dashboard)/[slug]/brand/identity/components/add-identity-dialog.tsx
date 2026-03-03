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
import { useState } from "react";
import { toast } from "sonner";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import {
  useAnalyzeBrand,
  useCreateBrandVoice,
} from "../../../../../../lib/hooks/use-brand-analysis";
import type { AddIdentityDialogProps } from "../types/brand-identity";
import { sanitizeBrandUrlInput } from "../utils/brand-identity";

export function AddIdentityDialog({
  open,
  onOpenChange,
  organizationId,
  onCreated,
  startPolling,
}: AddIdentityDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const createMutation = useCreateBrandVoice(organizationId);
  const analyzeMutation = useAnalyzeBrand(organizationId, startPolling);

  const isSubmitting = createMutation.isPending || analyzeMutation.isPending;

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();

    if (!trimmedName) {
      toast.error("Please enter an identity name");
      return;
    }

    if (!trimmedUrl) {
      toast.error("Please enter a website URL");
      return;
    }

    let websiteUrl = trimmedUrl;
    if (!trimmedUrl.startsWith("https://")) {
      websiteUrl = `https://${trimmedUrl}`;
    }

    const parseRes = z.url().safeParse(websiteUrl);
    if (!parseRes.success) {
      toast.error("Please enter a valid website URL");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        name: trimmedName,
        websiteUrl,
      });
      const voice = result.voice;
      onCreated(voice);
      onOpenChange(false);
      setTimeout(() => {
        setName("");
        setUrl("");
      }, 300);

      try {
        await analyzeMutation.mutateAsync({
          url: websiteUrl,
          voiceId: voice.id,
        });
        toast.success("Brand identity created, analysis started");
      } catch {
        toast.error(
          "Brand identity created, but failed to start analysis. You can re-analyze from the identity settings."
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create brand identity"
      );
    }
  };

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add Brand Identity</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Create a new brand identity with a different tone, audience, or
            language for your content.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="voice-name">Name</Label>
            <Input
              autoFocus
              id="voice-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing, Technical, Internal"
              value={name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voice-url">Website</Label>
            <div className="flex w-full flex-row items-center overflow-hidden rounded-lg border border-input bg-background transition-all focus-within:ring-2 focus-within:ring-ring/20">
              <span className="flex h-10 items-center border-input border-r bg-muted/50 px-3 text-muted-foreground text-sm">
                https://
              </span>
              <input
                className="h-10 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                id="voice-url"
                onChange={(e) => setUrl(sanitizeBrandUrlInput(e.target.value))}
                placeholder="example.com"
                type="text"
                value={url}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              We'll analyze this website to extract your brand identity.
            </p>
          </div>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose
              disabled={isSubmitting}
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
              disabled={!name.trim() || !url.trim() || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating..." : "Create Identity"}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
