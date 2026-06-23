import { jsonResponse } from "@/utils/http";

export function GET() {
  return jsonResponse({
    keys: [
      {
        kty: "OKP",
        crv: "Ed25519",
        kid: "notra-web-bot-auth-2026-01",
        use: "sig",
        alg: "EdDSA",
        nbf: "2026-01-01T00:00:00Z",
        exp: "2027-01-01T00:00:00Z",
        x: "11qYAYKxCrfVS_3ckPuUvV2ZgF1U3BtQ2i5rM0W2Y5U",
      },
    ],
  });
}
