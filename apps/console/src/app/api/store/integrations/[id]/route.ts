import { NextResponse } from "next/server";
import { STORE_CACHE_CONTROL_HEADER } from "@/constants/store";
import { getPublicStoreIntegration } from "@/lib/store/public-integrations";
import { storeIntegrationIdParamSchema } from "@/schemas/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsed = storeIntegrationIdParamSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid integration ID" },
      { status: 400 }
    );
  }

  try {
    const integration = await getPublicStoreIntegration(parsed.data.id);
    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { integration },
      { headers: { "Cache-Control": STORE_CACHE_CONTROL_HEADER } }
    );
  } catch (error) {
    console.error("[Store] Failed to load integration", error);
    return NextResponse.json(
      { error: "Could not load integration" },
      { status: 500 }
    );
  }
}
