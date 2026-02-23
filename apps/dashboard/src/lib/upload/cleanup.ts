import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { R2_BUCKET_NAME, r2 } from "./r2";

const MAX_KEYS_PER_DELETE = 1000;

async function deleteObjectsByPrefix(prefix: string) {
  let totalDeleted = 0;
  let continuationToken: string | undefined;

  do {
    const listResult = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
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
            Bucket: R2_BUCKET_NAME,
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
      console.log(
        `[Upload Cleanup] Deleted ${deleted} files for user ${userId}`
      );
    }
    return deleted;
  } catch (error) {
    console.error(
      `[Upload Cleanup] Failed to delete files for user ${userId}:`,
      error
    );
    throw error;
  }
}

export async function deleteOrganizationFiles(organizationId: string) {
  const prefix = `organization/${organizationId}/`;
  try {
    const deleted = await deleteObjectsByPrefix(prefix);
    if (deleted > 0) {
      console.log(
        `[Upload Cleanup] Deleted ${deleted} files for organization ${organizationId}`
      );
    }
    return deleted;
  } catch (error) {
    console.error(
      `[Upload Cleanup] Failed to delete files for organization ${organizationId}:`,
      error
    );
    throw error;
  }
}
