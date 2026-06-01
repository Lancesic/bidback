"use client";

import { useEffect, useMemo, useState } from "react";

type SavedEstimate = {
  status?: string;
};

type SavedApp = {
  estimates?: SavedEstimate[];
};

const APP_KEY = "bidback-v3";
const SNOOZE_KEY = "bidback-feedback-25-active-snoozed-until";
const ACTIVE_LIMIT = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

function readSavedApp(): SavedApp | null {
  try {
    const raw = window.localStorage.getItem(APP_KEY);
    return raw ? (JSON.parse(raw) as SavedApp) : null;
  } catch {
    return null;
  }
}

function activeEstimateCount() {
  const saved = readSavedApp();
  return (saved?.estimates || []).filter((estimate) => estimate.status === "Pending").length;
}

function isSnoozed() {
  const until = Number(window.localStorage.getItem(SNOOZE_KEY) || 0);
  return Number.isFinite(until) && until > Date.now();
}

export function ActiveEstimateFeedbackPrompt() {
  const [activeCount, setActiveCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function refresh() {
      setActiveCount(activeEstimateCount());
      setDismissed(isSnoozed());
    }

    refresh();
    const interval = window.setInterval(refresh, 1500);
    window.addEventListener("storage", refresh);
    window.addEventListener("click", refresh, true);
    window.addEventListener("change", refresh, true);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("click", refresh, true);
      window.removeEventListener("change", refresh, true);
    };
  }, []);

  const shouldShow = activeCount >= ACTIVE_LIMIT && !dismissed;

  const message = useMemo(() => {
    if (activeCount === ACTIVE_LIMIT) return "You just hit 25 active estimates. That is the perfect time to send feedback.";
    return `You have ${activeCount} active estimates. Please send feedback so BidBack can get better for real contractor volume.`;
  }, [activeCount]);

  if (!shouldShow) return null;

  function sendFeedback() {
    const button = document.querySelector<HTMLButtonElement>(".feedback-fab");
    button?.click();
  }

  function remindTomorrow() {
    window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + DAY_MS));
    setDismissed(true);
  }

  return (
    <div className="active-feedback-card" role="dialog" aria-live="polite" aria-label="Please send BidBack feedback">
      <div>
        <strong>Please send feedback</strong>
        <p>{message}</p>
      </div>
      <div className="active-feedback-actions">
        <button type="button" onClick={sendFeedback}>Send feedback now</button>
        <button type="button" onClick={remindTomorrow}>Remind me tomorrow</button>
      </div>
      <style>{`
        .active-feedback-card{
          position:fixed;
          left:50%;
          bottom:18px;
          transform:translateX(-50%);
          z-index:60;
          width:min(calc(100vw - 24px),520px);
          border:1px solid #d7dfd2;
          border-radius:8px;
          background:#fff;
          color:#17211b;
          box-shadow:0 18px 50px rgba(23,33,27,.18);
          padding:14px;
          display:grid;
          gap:12px;
        }
        .active-feedback-card strong{display:block;font-size:1.05rem;margin-bottom:4px}
        .active-feedback-card p{margin:0;color:#5f6f65;line-height:1.35}
        .active-feedback-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .active-feedback-actions button{
          min-height:44px;
          border-radius:8px;
          border:1px solid #d7dfd2;
          background:#fff;
          color:#17211b;
          font-weight:850;
          padding:10px 12px;
        }
        .active-feedback-actions button:first-child{background:#1f6b4f;border-color:#1f6b4f;color:#fff}
        @media(max-width:520px){
          .active-feedback-card{bottom:10px;padding:12px}
          .active-feedback-actions{grid-template-columns:1fr}
        }
      `}</style>
    </div>
  );
}
