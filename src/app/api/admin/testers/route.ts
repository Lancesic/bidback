import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase-rest";

type TesterRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  app_summary?: Record<string, unknown> | null;
  app_data?: Record<string, unknown> | null;
  first_seen_at?: string;
  last_seen_at?: string;
  created_at?: string;
};

type FeedbackRow = {
  id: string;
  tester_id?: string | null;
  comments: string;
  feedback_package?: Record<string, unknown> | null;
  created_at?: string;
};

function isAuthorized(request: Request) {
  const ownerKey = process.env.BIDBACK_OWNER_KEY || process.env.OWNER_DASHBOARD_KEY;
  if (!ownerKey) return false;
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const urlKey = new URL(request.url).searchParams.get("key") || "";
  return bearer === ownerKey || urlKey === ownerKey;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Owner dashboard is locked. Add BIDBACK_OWNER_KEY in Vercel, then enter that key on the owner page.",
      },
      { status: 401 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, message: "Supabase is not configured." },
      { status: 200 },
    );
  }

  try {
    const testers = await supabaseRest<TesterRow[]>("bidback_testers", {
      query:
        "select=id,name,email,phone,app_summary,app_data,first_seen_at,last_seen_at,created_at&order=last_seen_at.desc&limit=200",
    });
    const feedback = await supabaseRest<FeedbackRow[]>("bidback_feedback", {
      query:
        "select=id,tester_id,comments,feedback_package,created_at&order=created_at.desc&limit=200",
    });

    return NextResponse.json({ ok: true, testers, feedback });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Owner dashboard failed to load.",
      },
      { status: 500 },
    );
  }
}
