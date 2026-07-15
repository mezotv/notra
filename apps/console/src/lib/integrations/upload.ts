import {
  brandingUploadErrorSchema,
  brandingUploadSuccessSchema,
} from "@/schemas/integrations";
import type { BrandingAssetKind } from "@/types/integrations";

const FALLBACK_UPLOAD_ERROR = "Could not upload the image. Try again.";

export async function uploadBrandingAsset(params: {
  file: File;
  kind: BrandingAssetKind;
  organizationId: string;
}): Promise<string> {
  const formData = new FormData();
  formData.set("organizationId", params.organizationId);
  formData.set("kind", params.kind);
  formData.set("file", params.file);

  const response = await fetch("/api/uploads/branding", {
    method: "POST",
    body: formData,
  }).catch(() => {
    throw new Error(FALLBACK_UPLOAD_ERROR);
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = brandingUploadErrorSchema.safeParse(payload);
    throw new Error(
      parsedError.success ? parsedError.data.error : FALLBACK_UPLOAD_ERROR
    );
  }

  const parsed = brandingUploadSuccessSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(FALLBACK_UPLOAD_ERROR);
  }

  return parsed.data.url;
}
