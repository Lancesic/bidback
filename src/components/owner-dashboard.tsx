"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type TesterRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  app_summary?: Record<string, unknown> | null;
  app_data?: { estimates?: unknown[] } | null;
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

type OwnerResponse = {
  ok?: boolean;
  message?: string;
  testers?: TesterRow[];
  feedback?: FeedbackRow[];
};

const OWNER_KEY_STORAGE = "bidback-owner-key";

function date(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function money(value: unknown) {
  const number = typeof value === "number" ? value : Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv(testers: TesterRow[]) {
  const rows = [
    ["Name", "Email", "Phone", "First seen", "Last seen", "Total estimates", "Open value", "Won value", "Lost value"],
    ...testers.map((tester) => [
      tester.name,
      tester.email,
      tester.phone,
      tester.first_seen_at || tester.created_at || "",
      tester.last_seen_at || "",
      tester.app_summary?.totalEstimates || "",
      tester.app_summary?.openEstimateValue || "",
      tester.app_summary?.wonEstimateValue || "",
      tester.app_summary?.lostEstimateValue || "",
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = `bidback-testers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}

export function OwnerDashboard() {
  const [ownerKey, setOwnerKey] = useState("");
  const [data, setData] = useState<OwnerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  async function load(key: string) {
    if (!key.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/testers", {
        headers: { Authorization: `Bearer ${key.trim()}` },
        cache: "no-store",
      });
      const json = (await response.json()) as OwnerResponse;
      setData(json);
      if (json.ok) {
        window.localStorage.setItem(OWNER_KEY_STORAGE, key.trim());
      }
    } catch {
      setData({ ok: false, message: "Could not load owner dashboard." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = window.localStorage.getItem(OWNER_KEY_STORAGE) || "";
    if (saved) {
      setOwnerKey(saved);
      void load(saved);
    }
  }, []);

  const testers = data?.testers || [];
  const feedback = data?.feedback || [];
  const selected = testers.find((tester) => tester.id === selectedId) || testers[0];
  const selectedFeedback = useMemo(
    () => feedback.filter((item) => item.tester_id === selected?.id),
    [feedback, selected?.id],
  );
  const totals = useMemo(() => {
    return testers.reduce(
      (summary, tester) => {
        summary.open += Number(tester.app_summary?.openEstimateValue || 0);
        summary.won += Number(tester.app_summary?.wonEstimateValue || 0);
        summary.estimates += Number(tester.app_summary?.totalEstimates || 0);
        return summary;
      },
      { open: 0, won: 0, estimates: 0 },
    );
  }, [testers]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void load(ownerKey);
  }

  return (
    <main className="owner-shell">
      <section className="owner-hero">
        <div>
          <p className="owner-eyebrow">BidBack Owner</p>
          <h1>Tester Dashboard</h1>
          <p>See who signed up, what they tried, and what feedback they sent.</p>
        </div>
        <form className="owner-key-form" onSubmit={submit}>
          <input
            aria-label="Owner key"
            placeholder="Owner key"
            type="password"
            value={ownerKey}
            onChange={(event) => setOwnerKey(event.target.value)}
          />
          <button>{loading ? "Loading..." : "Open"}</button>
        </form>
      </section>

      {data?.ok === false && <div className="owner-alert">{data.message}</div>}

      {data?.ok && (
        <>
          <section className="owner-metrics">
            <div><span>Testers</span><strong>{testers.length}</strong></div>
            <div><span>Feedback</span><strong>{feedback.length}</strong></div>
            <div><span>Total estimates</span><strong>{totals.estimates}</strong></div>
            <div><span>Open value</span><strong>{money(totals.open)}</strong></div>
            <div><span>Won value</span><strong>{money(totals.won)}</strong></div>
          </section>

          <div className="owner-toolbar">
            <button onClick={() => void load(ownerKey)}>Refresh</button>
            <button onClick={() => downloadCsv(testers)}>Export testers CSV</button>
          </div>

          <section className="owner-layout">
            <div className="owner-panel">
              <h2>Testers</h2>
              <div className="owner-list">
                {testers.map((tester) => (
                  <button
                    className={tester.id === selected?.id ? "active" : ""}
                    key={tester.id}
                    onClick={() => setSelectedId(tester.id)}
                  >
                    <strong>{tester.name}</strong>
                    <span>{tester.email}</span>
                    <small>Last seen {date(tester.last_seen_at)}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="owner-panel owner-detail">
              {selected ? (
                <>
                  <div className="owner-detail-head">
                    <div>
                      <h2>{selected.name}</h2>
                      <p>{selected.email}</p>
                      <p>{selected.phone}</p>
                    </div>
                    <a href={`mailto:${selected.email}`}>Email tester</a>
                  </div>

                  <div className="owner-summary-grid">
                    <div><span>Estimates</span><strong>{String(selected.app_summary?.totalEstimates || 0)}</strong></div>
                    <div><span>Pending</span><strong>{String(selected.app_summary?.pendingEstimates || 0)}</strong></div>
                    <div><span>Open</span><strong>{money(selected.app_summary?.openEstimateValue)}</strong></div>
                    <div><span>Won</span><strong>{money(selected.app_summary?.wonEstimateValue)}</strong></div>
                    <div><span>Lost</span><strong>{money(selected.app_summary?.lostEstimateValue)}</strong></div>
                    <div><span>Follow-ups sent</span><strong>{String(selected.app_summary?.sentFollowUps || 0)}</strong></div>
                  </div>

                  <h3>Feedback from this tester</h3>
                  {selectedFeedback.length ? (
                    <div className="owner-feedback-list">
                      {selectedFeedback.map((item) => (
                        <article key={item.id}>
                          <time>{date(item.created_at)}</time>
                          <p>{item.comments || "No comment entered."}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="owner-muted">No feedback from this tester yet.</p>
                  )}

                  <h3>Raw app data</h3>
                  <pre>{JSON.stringify(selected.app_data || {}, null, 2)}</pre>
                </>
              ) : (
                <p>No testers yet.</p>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
