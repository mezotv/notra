import { Receiver } from "@upstash/qstash";

export async function verifyQstashSignature(params: {
  request: Request;
  rawBody: string;
  url: string;
}): Promise<boolean> {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!(currentSigningKey && nextSigningKey)) {
    return false;
  }
  const signature = params.request.headers.get("upstash-signature");
  if (!signature) {
    return false;
  }
  const receiver = new Receiver({ currentSigningKey, nextSigningKey });
  try {
    return await receiver.verify({
      signature,
      body: params.rawBody,
      url: params.url,
    });
  } catch {
    return false;
  }
}
