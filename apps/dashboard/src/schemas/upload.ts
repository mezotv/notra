import z from "zod";
import type { UploadType } from "@/types/lib/upload/client";
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_RASTER_MIME_TYPES,
  type AllowedMimeType,
  type AllowedRasterMimeType,
  MAX_AVATAR_FILE_SIZE,
  MAX_CONTENT_FILE_SIZE,
  MAX_LOGO_FILE_SIZE,
} from "@/utils/constants";

export const uploadAvatarSchema = z.object({
  type: z.literal("avatar"),
  fileType: z.coerce.string().nonempty(),
  fileSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_AVATAR_FILE_SIZE, {
      message: `Avatar image must be less than ${MAX_AVATAR_FILE_SIZE / 1024 / 1024}MB`,
    }),
});

export const uploadLogoSchema = z.object({
  type: z.literal("logo"),
  fileType: z.coerce.string().nonempty(),
  fileSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_LOGO_FILE_SIZE, {
      message: `Logo image must be less than ${MAX_LOGO_FILE_SIZE / 1024 / 1024}MB`,
    }),
});

export const uploadMediaSchema = z.object({
  type: z.literal("content"),
  fileType: z.coerce.string().nonempty(),
  fileSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_CONTENT_FILE_SIZE, {
      message: `Content file must be less than ${MAX_CONTENT_FILE_SIZE / 1024 / 1024}MB`,
    }),
});

export const uploadSchema = z.union([
  uploadAvatarSchema,
  uploadLogoSchema,
  uploadMediaSchema,
]);

const maxSizeByType = {
  avatar: MAX_AVATAR_FILE_SIZE,
  logo: MAX_LOGO_FILE_SIZE,
  content: MAX_CONTENT_FILE_SIZE,
};

export const DeleteSchema = z.object({
  mediaIds: z.array(z.string()).min(1).max(100),
});

export function validateUpload({
  type,
  fileType,
  fileSize,
}: {
  type: UploadType;
  fileType: string;
  fileSize: number;
}) {
  const maxSize = maxSizeByType[type];
  if (fileSize > maxSize) {
    throw new Error(
      `File size exceeds the maximum limit of ${maxSize / 1024 / 1024}MB for ${type}.`
    );
  }

  switch (type) {
    case "avatar":
    case "logo":
      if (
        !ALLOWED_RASTER_MIME_TYPES.includes(fileType as AllowedRasterMimeType)
      ) {
        throw new Error(
          `File type ${fileType} is not allowed for ${type}. Allowed raster types: ${ALLOWED_RASTER_MIME_TYPES.join(", ")}`
        );
      }
      break;
    case "content":
      if (!ALLOWED_MIME_TYPES.includes(fileType as AllowedMimeType)) {
        throw new Error(
          `File type ${fileType} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
        );
      }
      break;
    default:
      throw new Error("Invalid upload type.");
  }
}
