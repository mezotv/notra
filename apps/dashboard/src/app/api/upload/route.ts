import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getFileExtension } from "@/lib/upload/mime";
import { R2_BUCKET_NAME, R2_PUBLIC_URL, r2 } from "@/lib/upload/r2";
import { uploadSchema, validateUpload } from "@/schemas/upload";

const TRAILING_SLASH_REGEX = /\/$/;

export async function POST(request: Request) {
  const sessionData = await getServerSession({
    headers: request.headers,
  });

  if (!sessionData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsedBody = uploadSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { type, fileType, fileSize } = parsedBody.data;

  if (
    (type === "logo" || type === "content") &&
    !sessionData.session?.activeOrganizationId
  ) {
    return NextResponse.json(
      { error: "Active organization required for this upload type" },
      { status: 401 }
    );
  }

  try {
    validateUpload({ type, fileType, fileSize });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid file type";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const id = nanoid();
  const extension = getFileExtension(fileType);
  const userId = sessionData.user.id;
  const orgId = sessionData.session?.activeOrganizationId;

  let key: string;

  switch (type) {
    case "avatar":
      key = `user/${userId}/avatar/${id}.${extension}`;
      break;
    case "logo":
      if (!orgId) {
        return NextResponse.json(
          { error: "Active organization required" },
          { status: 401 }
        );
      }
      key = `organization/${orgId}/logo/${id}.${extension}`;
      break;
    case "content":
      if (!orgId) {
        return NextResponse.json(
          { error: "Active organization required" },
          { status: 401 }
        );
      }
      key = `organization/${orgId}/content/${id}.${extension}`;
      break;
    default:
      return NextResponse.json(
        { error: "Invalid upload type" },
        { status: 400 }
      );
  }

  const presignedUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
    }),
    { expiresIn: 3600 }
  );

  const baseUrl = R2_PUBLIC_URL.replace(TRAILING_SLASH_REGEX, "");
  const publicUrl = `${baseUrl}/${key}`;

  return NextResponse.json({
    url: presignedUrl,
    key,
    publicUrl,
  });
}
