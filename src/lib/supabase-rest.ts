const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

type SupabaseRequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  query?: string;
  body?: unknown;
  prefer?: string;
};

export async function supabaseRest<T>(
  table: string,
  options: SupabaseRequestOptions = {},
) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase is not configured");
  }

  const query = options.query ? `?${options.query}` : "";
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase request failed: ${response.status}`);
  }

  if (response.status === 204) return null as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
