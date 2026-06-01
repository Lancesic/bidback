import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase-rest";

type TesterRow = {
  id: string;
};

function explain(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("rls")) {
    return "Vercel is probably using the Supabase anon/public key. Replace SUPABASE_SERVICE_ROLE_KEY with the service_role / secret service key, then redeploy.";
  }
  if (lower.includes("invalid api key") || lower.includes("jwt") || lower.includes("signature")) {
    return "The Supabase key in Vercel is invalid or pasted incorrectly. Re-copy the service_role / secret service key from Supabase and redeploy.";
  }
  if (lower.includes("relation") && lower.includes("does not exist")) {
    return "The database tables are missing in the Supabase project connected to Vercel. Run the BidBack SQL in this exact Supabase project.";
  }
  if (lower.includes("failed to fetch") || lower.includes("fetch failed")) {
    return "Vercel cannot reach Supabase. Check that SUPABASE_URL is exactly the project URL and redeploy.";
  }
  return "The database rejected the request. Copy this page or screenshot it so we can fix the exact cause.";
}

export async function GET() {
  const hasUrl = Boolean(process.env.SUPABASE_URL);
  const hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: false,
      step: "environment",
      hasSupabaseUrl: hasUrl,
      hasServiceRoleKey: hasKey,
      problem: "Supabase environment variables are missing in Vercel Production.",
      fix: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then redeploy.",
    });
  }

  try {
    const rows = await supabaseRest<TesterRow[]>("bidback_testers", {
      query: "select=id&limit=1",
    });

    return NextResponse.json({
      ok: true,
      step: "database",
      message: "BidBack can reach Supabase and read the tester table.",
      testerRowsVisible: rows.length,
      next: "Open /?fresh=1, sign up once, then refresh Supabase bidback_testers.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({
      ok: false,
      step: "database",
      problem: message,
      likelyFix: explain(message),
    });
  }
}
