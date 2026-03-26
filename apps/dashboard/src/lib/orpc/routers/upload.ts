import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@notra/db/drizzle";
import { members } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { authorizedProcedure } from "@/lib/orpc/base";
import { getFileExtension } from "@/lib/upload/mime";
import { getR2Config } from "@/lib/upload/r2";
import { uploadSchema, validateUpload } from "@/schemas/upload";
import { badRequest, forbidden, unauthorized } from "../utils/errors";

const TRAILING_SLASH_REGEX = /\/$/;

export const uploadRouter = {
  createPresignedUpload: authorizedProcedure
    .input(uploadSchema)
    .handler(async ({ context, input }) => {
      const orgId = context.session?.activeOrganizationId;

      if ((input.type === "logo" || input.type === "content") && !orgId) {
        throw unauthorized("Active organization required for this upload type");
      }

      if ((input.type === "logo" || input.type === "content") && orgId) {
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
      }

      validateUpload({
        fileSize: input.fileSize,
        fileType: input.fileType,
        type: input.type,
      });

      const id = nanoid();
      const extension = getFileExtension(input.fileType);
      const userId = context.user.id;

      let key: string;

      switch (input.type) {
        case "avatar":
          key = `user/${userId}/avatar/${id}.${extension}`;
          break;
        case "logo":
          key = `organization/${orgId}/logo/${id}.${extension}`;
          break;
        case "content":
          key = `organization/${orgId}/content/${id}.${extension}`;
          break;
        default:
          throw badRequest("Unsupported upload type");
      }

      const { client: r2Client, bucketName, publicUrl } = getR2Config();
      const presignedUrl = await getSignedUrl(
        r2Client,
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          ContentLength: input.fileSize,
          ContentType: input.fileType,
        }),
        { expiresIn: 3600 }
      );

      const baseUrl = publicUrl.replace(TRAILING_SLASH_REGEX, "");

      return {
        key,
        publicUrl: `${baseUrl}/${key}`,
        url: presignedUrl,
      };
    }),
};
