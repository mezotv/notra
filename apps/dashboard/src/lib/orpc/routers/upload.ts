import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@notra/db/drizzle";
import { members } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { SVG_MIME_TYPE } from "@/constants/upload";
import { authorizedProcedure } from "@/lib/orpc/base";
import { getR2Config } from "@/lib/upload/r2";
import { SvgSanitizationError, sanitizeSvg } from "@/lib/upload/sanitize-svg";
import {
  createPresignedUpload,
  deleteChatUpload,
  recordChatAttachment,
} from "@/lib/upload/server";
import {
  deleteChatUploadSchema,
  recordChatAttachmentSchema,
  uploadSchema,
  uploadSvgSchema,
} from "@/schemas/upload";
import { badRequest, forbidden, unauthorized } from "../utils/errors";

const TRAILING_SLASH_REGEX = /\/$/;

export const uploadRouter = {
  createPresignedUpload: authorizedProcedure
    .input(uploadSchema)
    .handler(async ({ context, input }) => {
      return createPresignedUpload({
        fileSize: input.fileSize,
        fileType: input.fileType,
        headers: context.headers,
        type: input.type,
      });
    }),
  deleteChatUpload: authorizedProcedure
    .input(deleteChatUploadSchema)
    .handler(async ({ context, input }) => {
      return deleteChatUpload({
        headers: context.headers,
        key: input.key,
      });
    }),
  recordChatAttachment: authorizedProcedure
    .input(recordChatAttachmentSchema)
    .handler(async ({ context, input }) => {
      return recordChatAttachment({
        headers: context.headers,
        key: input.key,
        filename: input.filename,
        mediaType: input.mediaType,
        size: input.size,
      });
    }),
  uploadSvg: authorizedProcedure
    .input(uploadSvgSchema)
    .handler(async ({ context, input }) => {
      const orgId = context.session?.activeOrganizationId;

      if (!orgId) {
        throw unauthorized("Active organization required for SVG upload");
      }

      const membership = await db.query.members.findFirst({
        where: and(
          eq(members.userId, context.user.id),
          eq(members.organizationId, orgId)
        ),
        columns: { id: true },
      });

      if (!membership) {
        throw forbidden("You do not have access to this organization");
      }

      let sanitized: string;
      try {
        sanitized = await sanitizeSvg(input.svg);
      } catch (error) {
        if (error instanceof SvgSanitizationError) {
          throw badRequest(error.message);
        }
        throw error;
      }

      const id = nanoid();
      const key =
        input.type === "brand_asset"
          ? `organization/${orgId}/brand-assets/${id}.svg`
          : `organization/${orgId}/content/${id}.svg`;

      const { client: r2Client, bucketName, publicUrl } = getR2Config();

      await r2Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: sanitized,
          ContentType: SVG_MIME_TYPE,
          ContentDisposition:
            input.type === "brand_asset" ? "inline" : "attachment",
          CacheControl: "no-store",
        })
      );

      const baseUrl = publicUrl.replace(TRAILING_SLASH_REGEX, "");

      return {
        key,
        publicUrl: `${baseUrl}/${key}`,
      };
    }),
};
