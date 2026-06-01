import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, configured: false }, { status: 200 });
  }

  try {
    const body = (await request.json()) as {
      testerId?: string;
      comments?: string;
      package?: unknown;
    };

    await supabaseRest("bidback_feedback", {
      method: "POST",
      prefer: "return=minimal",
      body: {
        tester_id: body.testerId || null,
        comments: body.comments || "",
        feedback_package: body.package || {},
      },
    });

    return NextResponse.json({ ok: true, configured: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message: error instanceof Error ? error.message : "Feedback failed",
      },
      { status: 500 },
    );
  }
}
