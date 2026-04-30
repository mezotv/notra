import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { purgeOrganizationChatData } from "@notra/ai/chat/history";
import { db } from "@notra/db/drizzle";
import { chatAttachments } from "@notra/db/schema";
import { inArray } from "drizzle-orm";
import { log } from "@/lib/evlog";
import { getR2Config } from "./r2";

const TRAILING_SLASH_REGEX = /\/$/;

const MAX_KEYS_PER_DELETE = 1000;

async function deleteObjectsByPrefix(prefix: string) {
  let totalDeleted = 0;
  let continuationToken: string | undefined;
  const { client: r2, bucketName } = getR2Config();

  do {
    const listResult = await r2.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    const contents = listResult.Contents ?? [];
    const keys = contents
      .map((obj) => obj.Key)
      .filter((key): key is string => key != null);

    if (keys.length > 0) {
      const chunks: string[][] = [];
      for (let i = 0; i < keys.length; i += MAX_KEYS_PER_DELETE) {
        chunks.push(keys.slice(i, i + MAX_KEYS_PER_DELETE));
      }

      for (const chunk of chunks) {
        await r2.send(
          new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: chunk.map((Key) => ({ Key })),
              Quiet: true,
            },
          })
        );
        totalDeleted += chunk.length;
      }
    }

    continuationToken = listResult.NextContinuationToken;
  } while (continuationToken);

  return totalDeleted;
}

export async function deleteUserFiles(userId: string) {
  const prefix = `user/${userId}/`;
  try {
    const deleted = await deleteObjectsByPrefix(prefix);
    if (deleted > 0) {
      log.info({ event: "upload.cleanup.user", userId, deleted });
    }
    return deleted;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error({
      event: "upload.cleanup.user.failed",
      userId,
      error: message,
    });
    throw error;
  }
}

function extractKeyFromPublicUrl(
  url: string,
  publicUrl: string
): string | null {
  const normalizedPublicUrl = publicUrl.replace(TRAILING_SLASH_REGEX, "");
  const prefix = `${normalizedPublicUrl}/`;
  if (!url.startsWith(prefix)) {
    return null;
  }
  return url.slice(prefix.length);
}

async function deleteR2Keys(keys: string[]) {
  if (keys.length === 0) {
    return 0;
  }
  const { client: r2, bucketName } = getR2Config();
  let totalDeleted = 0;
  for (let i = 0; i < keys.length; i += MAX_KEYS_PER_DELETE) {
    const chunk = keys.slice(i, i + MAX_KEYS_PER_DELETE);
    await r2.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
    totalDeleted += chunk.length;
  }
  return totalDeleted;
}

export async function deleteOrganizationChatFiles(organizationId: string) {
  try {
    const { fileUrls } = await purgeOrganizationChatData(organizationId);
    const { publicUrl } = getR2Config();
    const keys = Array.from(
      new Set(
        fileUrls
          .map((url) => extractKeyFromPublicUrl(url, publicUrl))
          .filter((key): key is string => key !== null)
      )
    );
    const deleted = await deleteR2Keys(keys);

    // Remove DB rows for these keys so they don't re-surface in user
    // attachment lists with dead URLs.
    if (keys.length > 0) {
      await db
        .delete(chatAttachments)
        .where(inArray(chatAttachments.key, keys));
    }

    if (deleted > 0) {
      log.info({
        event: "upload.cleanup.org_chat",
        organizationId,
        deleted,
      });
    }
    return deleted;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error({
      event: "upload.cleanup.org_chat.failed",
      organizationId,
      error: message,
    });
    throw error;
  }
}

export async function deleteOrganizationFiles(organizationId: string) {
  const prefix = `organization/${organizationId}/`;
  try {
    const deleted = await deleteObjectsByPrefix(prefix);
    if (deleted > 0) {
      log.info({ event: "upload.cleanup.org", organizationId, deleted });
    }
    return deleted;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error({
      event: "upload.cleanup.org.failed",
      organizationId,
      error: message,
    });
    throw error;
  }
}
