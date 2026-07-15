import { uploadIntegrationBrandingAsset } from "@notra/ai/utils/image-assets";
import { ORPCError } from "@orpc/server";
import { NextResponse } from "next/server";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import {
  BRANDING_ASSET_CONTENT_TYPES,
  brandingUploadRequestSchema,
  MAX_BRANDING_UPLOAD_REQUEST_BYTES,
} from "@/schemas/integrations";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength > MAX_BRANDING_UPLOAD_REQUEST_BYTES) {
    return NextResponse.json(
      { error: "Images must be 4MB or smaller" },
      { status: 413 }
    );
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const parsed = brandingUploadRequestSchema.safeParse({
    organizationId: formData.get("organizationId"),
    kind: formData.get("kind"),
    file: formData.get("file"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid upload" },
      { status: 400 }
    );
  }

  const { file, kind, organizationId } = parsed.data;
  const extension = Object.hasOwn(BRANDING_ASSET_CONTENT_TYPES, file.type)
    ? BRANDING_ASSET_CONTENT_TYPES[file.type]
    : undefined;
  if (!extension) {
    return NextResponse.json(
      { error: "Use a PNG, JPG, SVG, or WebP image" },
      { status: 400 }
    );
  }

  try {
    await assertOrganizationAccess({
      headers: request.headers,
      organizationId,
    });
  } catch (error) {
    if (error instanceof ORPCError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("[Branding] Failed to verify organization access", error);
    return NextResponse.json(
      { error: "Could not upload the image. Try again." },
      { status: 500 }
    );
  }

  try {
    const url = await uploadIntegrationBrandingAsset({
      organizationId,
      kind,
      body: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
      extension,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[Branding] Failed to upload asset", error);
    return NextResponse.json(
      { error: "Could not upload the image. Try again." },
      { status: 500 }
    );
  }
}
