import axios from "axios";
import type {
  UploadFileProps,
  UploadFileResponse,
  UploadPresignedResponse,
  UploadType,
} from "@/types/lib/upload/client";

async function getPresignedUrl(
  file: File,
  type: UploadType
): Promise<UploadPresignedResponse> {
  const response = await axios.post("/api/upload", {
    type,
    fileType: file.type,
    fileSize: file.size,
  });

  if (response.status !== 200) {
    throw new Error("Failed to get presigned URL.");
  }

  return response.data;
}

async function uploadToR2(presignedUrl: string, file: File) {
  const response = await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  return response.data;
}

export async function uploadFile({
  file,
  type,
}: UploadFileProps): Promise<UploadFileResponse> {
  try {
    const response = await getPresignedUrl(file, type);

    const { url: presignedUrl, key, publicUrl } = response;

    await uploadToR2(presignedUrl, file);

    return { url: publicUrl, key };
  } catch (error) {
    console.error("Upload failed:", error);

    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("An unexpected error occurred during upload.");
  }
}
