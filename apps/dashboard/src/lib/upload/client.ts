import axios from "axios";
import { SVG_MIME_TYPE } from "@/constants/upload";
import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  UploadFileProps,
  UploadFileResponse,
  UploadPresignedResponse,
  UploadType,
} from "@/types/upload/client";

async function getPresignedUrl(
  file: File,
  type: UploadType
): Promise<UploadPresignedResponse> {
  return dashboardOrpc.upload.createPresignedUpload.call({
    type,
    fileType: file.type,
    fileSize: file.size,
  });
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

async function uploadSvgThroughServer(file: File): Promise<UploadFileResponse> {
  const svg = await file.text();
  const { key, publicUrl } = await dashboardOrpc.upload.uploadSvg.call({
    type: "content",
    svg,
  });
  return { url: publicUrl, key };
}

export async function uploadFile({
  file,
  type,
}: UploadFileProps): Promise<UploadFileResponse> {
  try {
    if (type === "content" && file.type === SVG_MIME_TYPE) {
      return await uploadSvgThroughServer(file);
    }

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
