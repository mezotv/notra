import { jsonResponse } from "@/utils/http";

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export function GET() {
  return jsonResponse(
    {
      error: "temporarily_unavailable",
      error_description:
        "Automatic OAuth authorization is not enabled yet. Create a Notra API key in the dashboard and use it as a bearer credential.",
      auth: "/auth.md",
    },
    { status: 503 }
  );
}
