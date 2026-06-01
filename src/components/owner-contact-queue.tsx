"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type JsonRecord = Record<string, unknown>;

type TesterRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  app_summary?: JsonRecord | null;
  app_data?: JsonRecord | null;
  last_seen_at?: string;
  created_at?: string;
};

type FeedbackRow = {
  id: string;
  tester_id?: string | null;
};

type OwnerResponse = {
  ok?: boolean;
  testers?: TesterRow[];
  feedback?: FeedbackRow[];
};

const OWNER_KEY_STORAGE = "bidback-owner-key";

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

function money(value: unknown) {
  const number = numberValue(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDate(value?: string) {
  if (!value) return "Not saved yet";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not saved yet";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(parsed);
}

function reasonList(tester: TesterRow, feedbackCount: number) {
  const pending = numberValue(tester.app_summary?.pendingEstimates);
  const open = numberValue(tester.app_summary?.openEstimateValue);
  const due = numberValue(tester.app_summary?.dueFollowUps);
  const sent = numberValue(tester.app_summary?.sentFollowUps);
  const reasons: string[] = [];

  if (pending >= 25) reasons.push("25+ active estimates");
  if (open >= 25000) reasons.push(`${money(open)} waiting`);
  if (due > 0 && sent === 0) reasons.push("Due follow-ups, none sent");
  if (feedbackCount === 0) reasons.push("No feedback yet");
  if (!reasons.length) reasons.push("High tester activity");
  return reasons;
}

function scoreTester(tester: TesterRow, feedbackCount: number) {
  const pending = numberValue(tester.app_summary?.pendingEstimates);
  const open = numberValue(tester.app_summary?.openEstimateValue);
  const due = numberValue(tester.app_summary?.dueFollowUps);
  const sent = numberValue(tester.app_summary?.sentFollowUps);
  return Math.round(open / 1000) + pending * 3 + due * 5 + (pending >= 25 ? 40 : 0) + (feedbackCount === 0 ? 12 : 0) + (due > 0 && sent === 0 ? 18 : 0);
}

export function OwnerContactQueue() {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [data, setData] = useState<OwnerResponse | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const tools = document.querySelector(".owner-tools");
      if (!tools || slot) return;
      const existing = document.querySelector<HTMLElement>(".owner-contact-queue-slot");
      if (existing) {
        setSlot(existing);
        return;
      }
      const container = document.createElement("section");
      container.className = "owner-contact-queue-slot";
      tools.parentElement?.insertBefore(container, tools);
      setSlot(container);
    }, 500);

    return () => window.clearInterval(timer);
  }, [slot]);

  useEffect(() => {
    async function load() {
      const ownerKey = window.localStorage.getItem(OWNER_KEY_STORAGE) || "";
      if (!ownerKey) return;
      try {
        const response = await fetch("/api/admin/testers", {
          headers: { Authorization: `Bearer ${ownerKey}` },
          cache: "no-store",
        });
        const json = (await response.json()) as OwnerResponse;
        if (json.ok) setData(json);
      } catch {
        // The main owner dashboard already shows connection errors.
      }
    }

    void load();
  }, []);

  const queue = useMemo(() => {
    const testers = data?.testers || [];
    const feedback = data?.feedback || [];
    const feedbackCount = new Map<string, number>();
    feedback.forEach((item) => {
      if (item.tester_id) feedbackCount.set(item.tester_id, (feedbackCount.get(item.tester_id) || 0) + 1);
    });

    return testers
      .map((tester) => {
        const count = feedbackCount.get(tester.id) || 0;
        return { tester, feedbackCount: count, score: scoreTester(tester, count), reasons: reasonList(tester, count) };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [data]);

  if (!slot || !data?.ok || !queue.length) return null;

  return createPortal(
    <div className="owner-contact-queue">
      <div className="owner-contact-queue-head">
        <div>
          <p className="owner-eyebrow">Next owner actions</p>
          <h2>Testers to contact next</h2>
          <p>Prioritized by open money, 25+ active estimates, missing feedback, and follow-up usage.</p>
        </div>
      </div>
      <div className="owner-contact-cards">
        {queue.map(({ tester, feedbackCount, reasons }) => {
          const settings = objectValue(tester.app_data?.settings);
          const name = tester.name || "Unnamed tester";
          const company = textValue(settings.companyName, "No company yet");
          const pending = numberValue(tester.app_summary?.pendingEstimates);
          const open = numberValue(tester.app_summary?.openEstimateValue);
          const subject = encodeURIComponent("Quick BidBack testing question");
          const body = encodeURIComponent(`Hey ${name}, thanks for testing BidBack. I noticed you have ${pending} active estimates and ${money(open)} sitting open in the app. What is working, what is confusing, and what would make this more useful for your business?`);

          return (
            <article className="owner-contact-card" key={tester.id}>
              <div>
                <strong>{name}</strong>
                <p>{company}</p>
                <small>Last active {formatDate(tester.last_seen_at || tester.created_at)}</small>
              </div>
              <div className="owner-contact-stats">
                <span>{money(open)} open</span>
                <span>{pending} active</span>
                <span>{feedbackCount} feedback</span>
              </div>
              <div className="owner-contact-reasons">
                {reasons.map((reason) => <span key={reason}>{reason}</span>)}
              </div>
              <div className="owner-contact-actions-row">
                <a href={`mailto:${tester.email}?subject=${subject}&body=${body}`}>Email</a>
                <a href={`tel:${tester.phone}`}>Call</a>
              </div>
            </article>
          );
        })}
      </div>
      <style>{`
        .owner-contact-queue{max-width:1240px;margin:0 auto 14px;border:1px solid var(--border);border-radius:8px;background:rgba(255,255,255,.92);padding:16px;box-shadow:0 12px 30px rgba(23,33,27,.06)}
        .owner-contact-queue-head h2{margin:0}.owner-contact-queue-head p{margin:6px 0 0;color:var(--muted)}
        .owner-contact-cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:12px}
        .owner-contact-card{border:1px solid var(--border);border-radius:8px;background:#fff;padding:12px;display:grid;gap:10px;min-width:0}
        .owner-contact-card strong{font-size:1rem}.owner-contact-card p{margin:4px 0;color:var(--muted)}.owner-contact-card small{color:var(--muted)}
        .owner-contact-stats{display:grid;gap:5px}.owner-contact-stats span{font-weight:850;color:#17211b}
        .owner-contact-reasons{display:flex;flex-wrap:wrap;gap:6px}.owner-contact-reasons span{border-radius:999px;background:#eaf4ef;color:#14563e;padding:5px 8px;font-size:.76rem;font-weight:850}
        .owner-contact-actions-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.owner-contact-actions-row a{min-height:40px;border:1px solid var(--border);border-radius:8px;display:grid;place-items:center;text-decoration:none;color:var(--foreground);font-weight:850}.owner-contact-actions-row a:first-child{background:var(--primary);border-color:var(--primary);color:#fff}
        @media(max-width:1100px){.owner-contact-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:560px){.owner-contact-queue{padding:12px}.owner-contact-cards{grid-template-columns:1fr}}
      `}</style>
    </div>,
    slot,
  );
}
