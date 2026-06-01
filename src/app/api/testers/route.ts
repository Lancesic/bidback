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

function explainCloudError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("permission denied") || lower.includes("row-level security") || lower.includes("rls")) {
    return "Supabase permissions are blocking BidBack. Run the permission SQL in Supabase, then redeploy or retest.";
  }
  if (lower.includes("invalid api key") || lower.includes("jwt") || lower.includes("signature")) {
    return "The Supabase key in Vercel is invalid. Replace SUPABASE_SERVICE_ROLE_KEY with the service_role / secret service key and redeploy.";
  }
  if (lower.includes("relation") && lower.includes("does not exist")) {
    return "The BidBack tables are missing in this Supabase project. Run supabase/schema.sql in this exact project.";
  }
  return "Supabase rejected the save. Screenshot this message so we can fix the exact cause.";
}

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

    const appDataToSave = body.appData ?? null;
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
    const message = error instanceof Error ? error.message : "Signup failed";
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message,
        fix: explainCloudError(message),
      },
      { status: 500 },
    );
  }
}
