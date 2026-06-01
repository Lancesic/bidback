"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type JsonRecord = Record<string, unknown>;

type TesterRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  app_summary?: JsonRecord | null;
  app_data?: JsonRecord | null;
  first_seen_at?: string;
  last_seen_at?: string;
  created_at?: string;
};

type FeedbackRow = {
  id: string;
  tester_id?: string | null;
  comments: string;
  feedback_package?: JsonRecord | null;
  created_at?: string;
};

type EstimateSnapshot = {
  id?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  tradeType?: string;
  jobType?: string;
  estimateAmount?: number | string;
  estimateSentDate?: string;
  status?: string;
  notes?: string;
  followUps?: Array<{
    stage?: string;
    dueDate?: string;
    sentDate?: string;
    status?: string;
  }>;
};

type OwnerResponse = {
  ok?: boolean;
  message?: string;
  testers?: TesterRow[];
  feedback?: FeedbackRow[];
};

type SortMode = "recent" | "name" | "open" | "feedback";

const OWNER_KEY_STORAGE = "bidback-owner-key";

function formatDate(value?: string) {
  if (!value) return "Not saved yet";
  const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Not saved yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function money(value: unknown) {
  const number = typeof value === "number" ? value : Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(number) ? number : 0);
}

function numberValue(value: unknown) {
  const number = typeof value === "number" ? value : Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function textValue(value: unknown, fallback = "-") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function objectValue(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function arrayValue<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv(fileName: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = fileName;
  link.click();
}

function exportTesters(testers: TesterRow[]) {
  downloadCsv(`bidback-testers-${new Date().toISOString().slice(0, 10)}.csv`, [
    [
      "Name",
      "Email",
      "Phone",
      "First seen",
      "Last seen",
      "Total estimates",
      "Pending estimates",
      "Open estimate value",
      "Won estimate value",
      "Lost estimate value",
      "Follow-ups due",
      "Follow-ups sent",
    ],
    ...testers.map((tester) => [
      tester.name,
      tester.email,
      tester.phone,
      tester.first_seen_at || tester.created_at || "",
      tester.last_seen_at || "",
      tester.app_summary?.totalEstimates || "",
      tester.app_summary?.pendingEstimates || "",
      tester.app_summary?.openEstimateValue || "",
      tester.app_summary?.wonEstimateValue || "",
      tester.app_summary?.lostEstimateValue || "",
      tester.app_summary?.dueFollowUps || "",
      tester.app_summary?.sentFollowUps || "",
    ]),
  ]);
}

function exportFeedback(feedback: FeedbackRow[], testers: TesterRow[]) {
  const testerById = new Map(testers.map((tester) => [tester.id, tester]));
  downloadCsv(`bidback-feedback-${new Date().toISOString().slice(0, 10)}.csv`, [
    ["Date", "Tester", "Email", "Phone", "Comments"],
    ...feedback.map((item) => {
      const tester = item.tester_id ? testerById.get(item.tester_id) : undefined;
      return [item.created_at || "", tester?.name || "Unknown", tester?.email || "", tester?.phone || "", item.comments || ""];
    }),
  ]);
}

function recentCount(testers: TesterRow[]) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return testers.filter((tester) => {
    const value = tester.first_seen_at || tester.created_at || tester.last_seen_at;
    return value ? new Date(value).getTime() >= weekAgo : false;
  }).length;
}

function nextFollowUpLabel(estimate: EstimateSnapshot) {
  const due = arrayValue<NonNullable<EstimateSnapshot["followUps"]>[number]>(estimate.followUps)
    .filter((followUp) => followUp.status === "Due")
    .sort((a, b) => String(a.dueDate || "9999").localeCompare(String(b.dueDate || "9999")))[0];
  if (!due) return "No open follow-up";
  return `${due.stage || "Follow-up"} due ${formatDate(due.dueDate)}`;
}

export function OwnerDashboard() {
  const [ownerKey, setOwnerKey] = useState("");
  const [data, setData] = useState<OwnerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

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

  const feedbackByTester = useMemo(() => {
    const map = new Map<string, number>();
    feedback.forEach((item) => {
      if (item.tester_id) map.set(item.tester_id, (map.get(item.tester_id) || 0) + 1);
    });
    return map;
  }, [feedback]);

  const filteredTesters = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = testers.filter((tester) => {
      const settings = objectValue(tester.app_data?.settings);
      const haystack = [tester.name, tester.email, tester.phone, settings.companyName, settings.defaultTrade]
        .join(" ")
        .toLowerCase();
      return !needle || haystack.includes(needle);
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      if (sortMode === "open") return numberValue(b.app_summary?.openEstimateValue) - numberValue(a.app_summary?.openEstimateValue);
      if (sortMode === "feedback") return (feedbackByTester.get(b.id) || 0) - (feedbackByTester.get(a.id) || 0);
      return new Date(b.last_seen_at || b.created_at || 0).getTime() - new Date(a.last_seen_at || a.created_at || 0).getTime();
    });
  }, [feedbackByTester, query, sortMode, testers]);

  const selected = testers.find((tester) => tester.id === selectedId) || filteredTesters[0] || testers[0];
  const selectedSettings = objectValue(selected?.app_data?.settings);
  const selectedEstimates = useMemo(() => arrayValue<EstimateSnapshot>(selected?.app_data?.estimates), [selected?.app_data]);
  const selectedFeedback = useMemo(
    () => feedback.filter((item) => item.tester_id === selected?.id),
    [feedback, selected?.id],
  );
  const sentActivity = useMemo(() => {
    return selectedEstimates
      .flatMap((estimate) => arrayValue<NonNullable<EstimateSnapshot["followUps"]>[number]>(estimate.followUps).map((followUp) => ({ estimate, followUp })))
      .filter((item) => item.followUp.status === "Sent")
      .sort((a, b) => String(b.followUp.sentDate || "").localeCompare(String(a.followUp.sentDate || "")))
      .slice(0, 6);
  }, [selectedEstimates]);

  const totals = useMemo(() => {
    return testers.reduce(
      (summary, tester) => {
        summary.open += numberValue(tester.app_summary?.openEstimateValue);
        summary.won += numberValue(tester.app_summary?.wonEstimateValue);
        summary.lost += numberValue(tester.app_summary?.lostEstimateValue);
        summary.estimates += numberValue(tester.app_summary?.totalEstimates);
        summary.due += numberValue(tester.app_summary?.dueFollowUps);
        summary.sent += numberValue(tester.app_summary?.sentFollowUps);
        return summary;
      },
      { open: 0, won: 0, lost: 0, estimates: 0, due: 0, sent: 0 },
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
          <button disabled={loading}>{loading ? "Loading..." : "Open"}</button>
        </form>
      </section>

      {data?.ok === false && <div className="owner-alert">{data.message}</div>}

      {data?.ok && (
        <>
          <section className="owner-metrics" aria-label="Owner metrics">
            <div className="owner-card-wide"><span>People testing BidBack</span><strong>{testers.length}</strong><small>{recentCount(testers)} new in the last 7 days</small></div>
            <div><span>Money waiting in tester apps</span><strong>{money(totals.open)}</strong><small>{totals.estimates} estimates created</small></div>
            <div><span>Follow-ups due</span><strong>{totals.due}</strong><small>{totals.sent} marked sent</small></div>
            <div><span>Won value</span><strong>{money(totals.won)}</strong><small>Across all testers</small></div>
            <div className="owner-loss-card"><span>Lost value</span><strong>{money(totals.lost)}</strong><small>Deals they could not recover</small></div>
            <div><span>Feedback messages</span><strong>{feedback.length}</strong><small>From the feedback button</small></div>
          </section>

          <section className="owner-tools" aria-label="Owner tools">
            <label>
              Search testers
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, phone, company..." />
            </label>
            <label>
              Sort by
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
                <option value="recent">Recently active</option>
                <option value="open">Most open money</option>
                <option value="feedback">Most feedback</option>
                <option value="name">Name</option>
              </select>
            </label>
            <button onClick={() => void load(ownerKey)}>Refresh</button>
            <button onClick={() => exportTesters(testers)}>Export testers</button>
            <button onClick={() => exportFeedback(feedback, testers)}>Export feedback</button>
          </section>

          <section className="owner-layout">
            <div className="owner-panel">
              <h2>Testers</h2>
              <p className="owner-muted">Click a tester to inspect their app snapshot.</p>
              <div className="owner-list">
                {filteredTesters.map((tester) => {
                  const settings = objectValue(tester.app_data?.settings);
                  return (
                    <button
                      className={tester.id === selected?.id ? "active" : ""}
                      key={tester.id}
                      onClick={() => setSelectedId(tester.id)}
                    >
                      <strong>{tester.name || "Unnamed tester"}</strong>
                      <span>{tester.email}</span>
                      <small>{textValue(settings.companyName, "No company yet")} - {money(tester.app_summary?.openEstimateValue)} open</small>
                      <small>Last active {formatDate(tester.last_seen_at)}</small>
                    </button>
                  );
                })}
                {!filteredTesters.length && <p className="owner-empty">No testers match that search.</p>}
              </div>
            </div>

            <div className="owner-panel owner-detail">
              {selected ? (
                <>
                  <div className="owner-detail-head">
                    <div>
                      <p className="owner-eyebrow">Tester profile</p>
                      <h2>{selected.name || "Unnamed tester"}</h2>
                      <p>{selected.email}</p>
                      <p>{selected.phone}</p>
                    </div>
                    <div className="owner-contact-actions">
                      <a href={`mailto:${selected.email}`}>Email</a>
                      <a href={`tel:${selected.phone}`}>Call</a>
                    </div>
                  </div>

                  <div className="owner-business-card">
                    <div><span>Company</span><strong>{textValue(selectedSettings.companyName, "Not entered")}</strong></div>
                    <div><span>Contractor</span><strong>{textValue(selectedSettings.contractorName || selected.name, "Not entered")}</strong></div>
                    <div><span>Main trade</span><strong>{textValue(selectedSettings.defaultTrade, "Not entered")}</strong></div>
                    <div><span>Business phone</span><strong>{textValue(selectedSettings.phone || selected.phone, "Not entered")}</strong></div>
                  </div>

                  <div className="owner-summary-grid">
                    <div><span>Estimates</span><strong>{numberValue(selected.app_summary?.totalEstimates)}</strong></div>
                    <div><span>Pending</span><strong>{numberValue(selected.app_summary?.pendingEstimates)}</strong></div>
                    <div><span>Open value</span><strong>{money(selected.app_summary?.openEstimateValue)}</strong></div>
                    <div><span>Won value</span><strong>{money(selected.app_summary?.wonEstimateValue)}</strong></div>
                    <div><span>Lost value</span><strong>{money(selected.app_summary?.lostEstimateValue)}</strong></div>
                    <div><span>Sent follow-ups</span><strong>{numberValue(selected.app_summary?.sentFollowUps)}</strong></div>
                  </div>

                  <h3>Estimates in this tester&apos;s app</h3>
                  {selectedEstimates.length ? (
                    <div className="owner-estimate-list">
                      {selectedEstimates.map((estimate, index) => (
                        <article key={estimate.id || `${estimate.customerName}-${index}`}>
                          <div className="owner-estimate-head">
                            <div>
                              <strong>{textValue(estimate.customerName, "Unnamed customer")}</strong>
                              <p>{textValue(estimate.tradeType, "Trade")} - {textValue(estimate.jobType, "Job")}</p>
                            </div>
                            <div className="owner-estimate-money">
                              <strong>{money(estimate.estimateAmount)}</strong>
                              <span className={`owner-status ${String(estimate.status || "pending").toLowerCase()}`}>{textValue(estimate.status, "Pending")}</span>
                            </div>
                          </div>
                          <div className="owner-estimate-meta">
                            <span>Sent {formatDate(estimate.estimateSentDate)}</span>
                            <span>{nextFollowUpLabel(estimate)}</span>
                          </div>
                          {estimate.notes && <p className="owner-note">{estimate.notes}</p>}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="owner-empty">This tester has not added estimates yet.</p>
                  )}

                  <h3>Follow-up activity</h3>
                  {sentActivity.length ? (
                    <div className="owner-activity-list">
                      {sentActivity.map(({ estimate, followUp }, index) => (
                        <article key={`${estimate.id || estimate.customerName}-${followUp.stage}-${index}`}>
                          <strong>{followUp.stage} sent</strong>
                          <span>{textValue(estimate.customerName, "Customer")} - {formatDate(followUp.sentDate)}</span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="owner-empty">No follow-ups have been marked sent yet.</p>
                  )}

                  <h3>Feedback from this tester</h3>
                  {selectedFeedback.length ? (
                    <div className="owner-feedback-list">
                      {selectedFeedback.map((item) => (
                        <article key={item.id}>
                          <time>{formatDate(item.created_at)}</time>
                          <p>{item.comments || "No comment entered."}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="owner-empty">No feedback from this tester yet.</p>
                  )}
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
