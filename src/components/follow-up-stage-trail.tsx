"use client";

import { useEffect } from "react";

type FollowUp = {
  stage?: string;
  dueDate?: string;
  status?: string;
  sentDate?: string;
};

type Estimate = {
  customerName?: string;
  followUps?: FollowUp[];
};

type AppData = {
  estimates?: Estimate[];
};

const APP_KEYS = ["bidback-v3", "bidback-v2"];

function readAppData() {
  for (const key of APP_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as AppData;
      if (Array.isArray(parsed.estimates)) return parsed;
    } catch {
      // Try the next stored app version.
    }
  }
  return null;
}

function shortDate(value?: string) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
  } catch {
    return value;
  }
}

function describe(followUp: FollowUp) {
  if (followUp.status === "Sent") return `Sent ${shortDate(followUp.sentDate || followUp.dueDate)}`;
  if (followUp.status === "Skipped") return "Skipped";
  if (followUp.status === "Snoozed") return `Snoozed ${shortDate(followUp.dueDate)}`;
  return `Due ${shortDate(followUp.dueDate)}`;
}

function renderTrail(followUps: FollowUp[]) {
  const sentCount = followUps.filter((item) => item.status === "Sent").length;
  const current = followUps.find((item) => item.status === "Due");
  const summary = current
    ? `${sentCount ? `${sentCount} sent` : "Nothing sent yet"} · Current: ${current.stage}`
    : `${sentCount} sent · Sequence complete`;

  return `
    <div class="bidback-stage-trail-label">Follow-up trail</div>
    <div class="bidback-stage-trail-summary">${summary}</div>
    <div class="bidback-stage-trail-pills">
      ${followUps.map((item) => `<span class="bidback-stage-pill ${String(item.status || "Due").toLowerCase()}"><b>${item.stage || "Stage"}</b><small>${describe(item)}</small></span>`).join("")}
    </div>
  `;
}

function updateTrails() {
  const data = readAppData();
  if (!data?.estimates) return;

  document.querySelectorAll<HTMLElement>(".follow-card").forEach((card) => {
    const customerName = card.querySelector("h3")?.textContent?.trim();
    if (!customerName) return;

    const estimate = data.estimates?.find((item) => item.customerName === customerName);
    if (!estimate?.followUps?.length) return;

    let trail = card.querySelector<HTMLElement>(".bidback-stage-trail");
    if (!trail) {
      trail = document.createElement("div");
      trail.className = "bidback-stage-trail";
      const statusLine = card.querySelector("p:has(.badge)") || card.querySelector("p");
      statusLine?.insertAdjacentElement("afterend", trail);
    }

    const nextHtml = renderTrail(estimate.followUps);
    if (trail.innerHTML !== nextHtml) trail.innerHTML = nextHtml;

    const current = estimate.followUps.find((item) => item.status === "Due");
    const markButton = Array.from(card.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.includes("Mark") && button.textContent?.includes("sent"));
    if (markButton && current?.stage && markButton.textContent !== `Mark ${current.stage} sent`) {
      markButton.textContent = `Mark ${current.stage} sent`;
    }
  });
}

export function FollowUpStageTrail() {
  useEffect(() => {
    updateTrails();
    const interval = window.setInterval(updateTrails, 1200);
    const refresh = () => window.setTimeout(updateTrails, 80);
    document.addEventListener("click", refresh, true);
    document.addEventListener("change", refresh, true);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("click", refresh, true);
      document.removeEventListener("change", refresh, true);
    };
  }, []);

  return (
    <style>{`
      .bidback-stage-trail {
        border: 1px solid rgba(31,107,79,.2);
        border-radius: 8px;
        background: #f7fbf8;
        margin: 10px 0 12px;
        padding: 10px;
      }
      .bidback-stage-trail-label {
        color: var(--primary-dark);
        font-size: .72rem;
        font-weight: 950;
        letter-spacing: .07em;
        text-transform: uppercase;
      }
      .bidback-stage-trail-summary {
        margin-top: 3px;
        color: var(--foreground);
        font-size: .9rem;
        font-weight: 850;
      }
      .bidback-stage-trail-pills {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 6px;
        margin-top: 9px;
      }
      .bidback-stage-pill {
        display: grid;
        gap: 2px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: white;
        padding: 7px 6px;
        min-width: 0;
      }
      .bidback-stage-pill b {
        color: var(--foreground);
        font-size: .78rem;
        line-height: 1.05;
        white-space: nowrap;
      }
      .bidback-stage-pill small {
        color: var(--muted);
        font-size: .66rem;
        line-height: 1.1;
      }
      .bidback-stage-pill.sent {
        border-color: rgba(31,107,79,.35);
        background: #e5f3eb;
      }
      .bidback-stage-pill.sent b,
      .bidback-stage-pill.sent small {
        color: var(--primary-dark);
      }
      .bidback-stage-pill.skipped,
      .bidback-stage-pill.snoozed {
        background: #faf7ef;
      }
      @media (max-width: 520px) {
        .bidback-stage-trail-pills {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
    `}</style>
  );
}
