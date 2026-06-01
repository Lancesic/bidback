import { NextResponse } from "next/server";
import { buildAppSummary } from "@/lib/cloud-summary";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase-rest";

type TesterRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  app_data?: { estimates?: unknown[] } | null;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, message: "Supabase is not configured" },
      { status: 200 },
    );
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      appData?: { estimates?: unknown[] };
    };
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const emailNormalized = email.toLowerCase();

    if (!name || !email || !phone || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, message: "Name, email, and phone are required" },
        { status: 400 },
      );
    }

    const existing = await supabaseRest<TesterRow[]>("bidback_testers", {
      query: `email_normalized=eq.${encodeURIComponent(emailNormalized)}&select=id,name,email,phone,app_data&limit=1`,
    });
    const existingAppData = existing[0]?.app_data ?? null;
    const appDataToSave = existingAppData ?? body.appData ?? null;

    const rows = await supabaseRest<TesterRow[]>("bidback_testers", {
      method: "POST",
      query: "on_conflict=email_normalized&select=id,name,email,phone,app_data",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        name,
        email,
        email_normalized: emailNormalized,
        phone,
        last_seen_at: new Date().toISOString(),
        app_data: appDataToSave,
        app_summary: appDataToSave ? buildAppSummary(appDataToSave) : null,
      },
    });

    const tester = rows[0];
    return NextResponse.json({
      ok: true,
      configured: true,
      tester: {
        id: tester.id,
        name: tester.name,
        email: tester.email,
        phone: tester.phone,
      },
      appData: tester.app_data ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message: error instanceof Error ? error.message : "Signup failed",
      },
      { status: 500 },
    );
  }
}
