import { NextResponse } from "next/server";
import { buildAppSummary } from "@/lib/cloud-summary";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, configured: false }, { status: 200 });
  }

  try {
    const body = (await request.json()) as {
      testerId?: string;
      appData?: { estimates?: unknown[] };
    };

    if (!body.testerId || !body.appData) {
      return NextResponse.json(
        { ok: false, message: "testerId and appData are required" },
        { status: 400 },
      );
    }

    await supabaseRest("bidback_testers", {
      method: "PATCH",
      query: `id=eq.${encodeURIComponent(body.testerId)}`,
      prefer: "return=minimal",
      body: {
        app_data: body.appData,
        app_summary: buildAppSummary(body.appData),
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({ ok: true, configured: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 },
    );
  }
}
