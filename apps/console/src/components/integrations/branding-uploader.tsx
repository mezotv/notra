"use client";

import {
  Cancel01Icon,
  Moon02Icon,
  Sun03Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Dropzone } from "@notra/ui/components/kibo-ui/dropzone";
import { useMutation } from "@tanstack/react-query";
import { cn } from "cnfast";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { uploadBrandingAsset } from "@/lib/integrations/upload";
import { MAX_BRANDING_ASSET_BYTES } from "@/schemas/integrations";
import type { BrandingAssetKind, LogoTheme } from "@/types/integrations";

const ACCEPTED_IMAGE_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/svg+xml": [".svg"],
  "image/webp": [".webp"],
};

function useBrandingUpload({
  kind,
  onChange,
  organizationId,
}: {
  kind: BrandingAssetKind;
  onChange: (url: string | null) => void;
  organizationId: string;
}) {
  return useMutation({
    mutationFn: (file: File) =>
      uploadBrandingAsset({ file, kind, organizationId }),
    onSuccess: (url) => {
      onChange(url);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

function RemoveAssetButton({
  label,
  onRemove,
  theme,
}: {
  label: string;
  onRemove: () => void;
  theme?: LogoTheme;
}) {
  return (
    <button
      aria-label={`Remove ${label}`}
      className={cn(
        "absolute top-2 right-2 flex size-5 items-center justify-center rounded-full border transition-colors",
        theme === "dark"
          ? "border-white/15 bg-white/10 text-neutral-400 hover:text-white"
          : "border-black/10 bg-black/5 text-neutral-500 hover:text-black"
      )}
      onClick={onRemove}
      type="button"
    >
      <HugeiconsIcon className="size-3" icon={Cancel01Icon} />
    </button>
  );
}

export function LogoVariantUploader({
  fallbackUrl,
  onChange,
  organizationId,
  theme,
  value,
}: {
  fallbackUrl: string | null;
  onChange: (url: string | null) => void;
  organizationId: string;
  theme: LogoTheme;
  value: string | null;
}) {
  const isDark = theme === "dark";
  const uploadMutation = useBrandingUpload({
    kind: isDark ? "logo-dark" : "logo-light",
    onChange,
    organizationId,
  });

  const surface = isDark
    ? "border-neutral-700 bg-neutral-950"
    : "border-neutral-200 bg-white";
  const labelText = isDark ? "text-neutral-400" : "text-neutral-500";
  const ctaText = isDark
    ? "text-neutral-300 hover:text-white"
    : "text-neutral-500 hover:text-neutral-900";
  const label = isDark ? "Dark" : "Light";

  return (
    <div className={cn("relative h-32 rounded-lg border", surface)}>
      <span
        className={cn(
          "pointer-events-none absolute top-2 left-2 z-10 inline-flex items-center gap-1 font-medium text-[0.6875rem] uppercase tracking-wide",
          labelText
        )}
      >
        <HugeiconsIcon
          className="size-3"
          icon={isDark ? Moon02Icon : Sun03Icon}
        />
        {label}
      </span>

      {value ? (
        <>
          <div className="flex size-full items-center justify-center p-6">
            <Image
              alt={`${label} logo`}
              className="max-h-16 w-auto object-contain"
              height={64}
              src={value}
              width={160}
            />
          </div>
          <RemoveAssetButton
            label={`${label.toLowerCase()} logo`}
            onRemove={() => onChange(null)}
            theme={theme}
          />
        </>
      ) : (
        <Dropzone
          accept={ACCEPTED_IMAGE_TYPES}
          className={cn(
            "size-full border-0 bg-transparent p-0 shadow-none transition-colors hover:bg-transparent",
            ctaText
          )}
          disabled={uploadMutation.isPending}
          maxSize={MAX_BRANDING_ASSET_BYTES}
          onDrop={(files) => {
            const file = files.at(0);
            if (file) {
              uploadMutation.mutate(file);
            }
          }}
          onError={(error) => toast.error(error.message)}
        >
          {isDark && fallbackUrl ? (
            <Image
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 m-auto max-h-14 w-auto object-contain opacity-20 grayscale"
              height={56}
              src={fallbackUrl}
              width={140}
            />
          ) : null}
          {uploadMutation.isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <span className="z-10 inline-flex items-center gap-1.5 text-xs">
              <HugeiconsIcon className="size-3.5" icon={Upload01Icon} />
              {isDark && fallbackUrl ? "Add dark variant" : "Upload"}
            </span>
          )}
        </Dropzone>
      )}
    </div>
  );
}

export function BannerUploader({
  onChange,
  organizationId,
  value,
}: {
  onChange: (url: string | null) => void;
  organizationId: string;
  value: string | null;
}) {
  const uploadMutation = useBrandingUpload({
    kind: "banner",
    onChange,
    organizationId,
  });

  if (value) {
    return (
      <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg border">
        <Image
          alt="Banner"
          className="size-full object-cover"
          fill
          src={value}
        />
        <RemoveAssetButton label="banner" onRemove={() => onChange(null)} />
      </div>
    );
  }

  return (
    <Dropzone
      accept={ACCEPTED_IMAGE_TYPES}
      className="aspect-[3/1] w-full border-dashed"
      disabled={uploadMutation.isPending}
      maxSize={MAX_BRANDING_ASSET_BYTES}
      onDrop={(files) => {
        const file = files.at(0);
        if (file) {
          uploadMutation.mutate(file);
        }
      }}
      onError={(error) => toast.error(error.message)}
    >
      {uploadMutation.isPending ? (
        <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <span className="flex flex-col items-center gap-1 text-muted-foreground">
          <HugeiconsIcon className="size-4" icon={Upload01Icon} />
          <span className="text-sm">Upload banner</span>
          <span className="text-xs">Wide images work best, around 3:1</span>
        </span>
      )}
    </Dropzone>
  );
}
