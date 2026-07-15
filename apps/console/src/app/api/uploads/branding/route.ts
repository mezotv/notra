import { uploadIntegrationBrandingAsset } from "@notra/ai/utils/image-assets";
import { ORPCError } from "@orpc/server";
import { NextResponse } from "next/server";
import {
  assertAuthenticated,
  assertOrganizationAccess,
} from "@/lib/auth/organization";
import { matchesDeclaredImageType } from "@/lib/integrations/validate-image";
import {
  assertRateLimit,
  BRANDING_UPLOAD_RATE_LIMIT,
} from "@/lib/orpc/utils/rate-limit";
import {
  BRANDING_ASSET_CONTENT_TYPES,
  brandingUploadRequestSchema,
  MAX_BRANDING_UPLOAD_REQUEST_BYTES,
} from "@/schemas/integrations";

function errorResponse(error: unknown) {
  if (error instanceof ORPCError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  console.error("[Branding] Upload request failed", error);
  return NextResponse.json(
    { error: "Could not upload the image. Try again." },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = Number(contentLengthHeader);
  if (
    !contentLengthHeader ||
    !Number.isFinite(contentLength) ||
    contentLength <= 0 ||
    contentLength > MAX_BRANDING_UPLOAD_REQUEST_BYTES
  ) {
    return NextResponse.json(
      { error: "Images must be 4MB or smaller" },
      { status: 413 }
    );
  }

  try {
    await assertAuthenticated({ headers: request.headers });
  } catch (error) {
    return errorResponse(error);
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
    await assertRateLimit({
      key: `branding-upload:${organizationId}`,
      message: "Too many uploads. Wait a minute and try again.",
      ...BRANDING_UPLOAD_RATE_LIMIT,
    });
  } catch (error) {
    return errorResponse(error);
  }

  const body = Buffer.from(await file.arrayBuffer());
  if (!matchesDeclaredImageType(body, file.type)) {
    return NextResponse.json(
      { error: "The file content does not match its image type" },
      { status: 400 }
    );
  }

  try {
    const url = await uploadIntegrationBrandingAsset({
      organizationId,
      kind,
      body,
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
