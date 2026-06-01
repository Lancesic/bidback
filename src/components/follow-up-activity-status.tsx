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

const APP_KEY = "bidback-v3";
const LEGACY_APP_KEY = "bidback-v2";

function readAppData() {
  for (const key of [APP_KEY, LEGACY_APP_KEY]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as AppData;
      if (Array.isArray(parsed.estimates)) return parsed;
    } catch {
      // Try the next key.
    }
  }
  return null;
}

function formatDate(value?: string) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
  } catch {
    return value;
  }
}

function statusText(followUp: FollowUp) {
  if (followUp.status === "Sent") return `Sent ${formatDate(followUp.sentDate || followUp.dueDate)}`;
  if (followUp.status === "Skipped") return `Skipped ${formatDate(followUp.dueDate)}`;
  if (followUp.status === "Snoozed") return `Snoozed to ${formatDate(followUp.dueDate)}`;
  return `Due ${formatDate(followUp.dueDate)}`;
}

function enhanceControlRoomCards() {
  const data = readAppData();
  if (!data?.estimates) return;

  document.querySelectorAll<HTMLElement>(".follow-card").forEach((card) => {
    const name = card.querySelector("h3")?.textContent?.trim();
    if (!name) return;

    const estimate = data.estimates?.find((item) => item.customerName === name);
    if (!estimate?.followUps?.length) return;

    let block = card.querySelector<HTMLElement>(".bidback-followup-history");
    if (!block) {
      block = document.createElement("div");
      block.className = "bidback-followup-history";
      const notes = Array.from(card.querySelectorAll<HTMLElement>("p.muted")).find((item) => item.textContent?.trim() === estimate.customerName || item.textContent?.trim() === "");
      const actions = card.querySelector(".actions");
      card.insertBefore(block, actions || null);
    }

    const sentCount = estimate.followUps.filter((item) => item.status === "Sent").length;
    const current = estimate.followUps.find((item) => item.status === "Due");
    block.innerHTML = `
      <div class="bidback-history-title">Follow-up activity</div>
      <div class="bidback-history-summary">${sentCount ? `${sentCount} stage${sentCount === 1 ? "" : "s"} sent` : "No stages sent yet"}${current ? ` · Next: ${current.stage}` : " · Sequence complete"}</div>
      <div class="bidback-history-steps">
        ${estimate.followUps.map((item) => `<span class="bidback-history-pill ${String(item.status || "Due").toLowerCase()}"><b>${item.stage || "Follow-up"}</b>${statusText(item)}</span>`).join("")}
      </div>
    `;

    const nextStage = estimate.followUps.find((item) => item.status === "Due")?.stage;
    const markButton = Array.from(card.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.includes("Mark stage sent"));
    if (markButton && nextStage) markButton.textContent = `Mark ${nextStage} sent`;
  });
}

export function FollowUpActivityStatus() {
  useEffect(() => {
    enhanceControlRoomCards();
    const observer = new MutationObserver(() => enhanceControlRoomCards());
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(enhanceControlRoomCards, 700);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return (
    <style>{`
      .bidback-followup-history {
        border: 1px solid rgba(31,107,79,.2);
        border-radius: 8px;
        background: #f7fbf8;
        padding: 12px;
        margin: 12px 0;
      }
      .bidback-history-title {
        color: var(--primary-dark);
        font-size: .78rem;
        font-weight: 950;
        letter-spacing: .07em;
        text-transform: uppercase;
      }
      .bidback-history-summary {
        margin-top: 4px;
        color: var(--foreground);
        font-weight: 850;
      }
      .bidback-history-steps {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .bidback-history-pill {
        display: grid;
        gap: 2px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: white;
        color: var(--muted);
        min-width: 92px;
        padding: 8px 9px;
        font-size: .78rem;
        line-height: 1.2;
      }
      .bidback-history-pill b {
        color: var(--foreground);
        font-size: .82rem;
      }
      .bidback-history-pill.sent {
        border-color: rgba(31,107,79,.34);
        background: #eaf6ef;
        color: var(--primary-dark);
      }
      .bidback-history-pill.sent b {
        color: var(--primary-dark);
      }
      .bidback-history-pill.skipped,
      .bidback-history-pill.snoozed {
        background: #f8f5ee;
      }
      @media (max-width: 520px) {
        .bidback-history-steps {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .bidback-history-pill {
          min-width: 0;
        }
      }
    `}</style>
  );
}
