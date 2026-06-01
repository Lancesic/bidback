"use client";

import { useEffect } from "react";

type Settings = {
  companyName?: string;
  contractorName?: string;
  phone?: string;
  defaultTrade?: string;
  templates?: Record<string, string>;
};

type FollowUp = {
  id: string;
  stage: string;
  dueDate: string;
  status: string;
  messageContent: string;
};

type Estimate = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  tradeType: string;
  jobType: string;
  estimateAmount: number;
  estimateSentDate: string;
  status: string;
  notes: string;
  followUps: FollowUp[];
  createdAt: string;
  updatedAt: string;
};

type AppData = {
  estimates?: Estimate[];
  settings?: Settings;
};

const APP_KEY = "bidback-v3";

const fallbackTemplates: Record<string, string> = {
  "Day 1": "Hi {customer}, this is {contractor} with {company}. I'm checking that you received the estimate for your {job}. If you have questions or want to adjust the scope, call or text me at {phone}.",
  "Day 3": "Hi {customer}, this is {contractor} with {company}. I wanted to check in on your {job} estimate. Is this still something you want to move forward with, or is there anything you want me to clarify?",
  "Day 7": "Hi {customer}, this is {contractor}. Quick reminder on your {job} estimate from {company}. The goal is to keep the project clear, priced, and easy to move forward with. Want me to help you decide the next step?",
  "Day 14": "Hi {customer}, no pressure at all. Should I keep your {job} estimate open, make changes to it, or close it out for now? You can reach me at {phone}.",
  "Day 30": "Hi {customer}, this is {contractor} with {company}. I'm closing the loop on your {job} estimate for now. If this project comes back up, call or text me at {phone} and I will be glad to help."
};

function readApp() {
  try {
    const raw = window.localStorage.getItem(APP_KEY);
    return raw ? (JSON.parse(raw) as AppData) : { estimates: [] };
  } catch {
    return { estimates: [] } as AppData;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fill(template: string, estimate: Pick<Estimate, "customerName" | "jobType">, settings: Settings) {
  return template
    .replaceAll("{customer}", estimate.customerName || "Customer")
    .replaceAll("{job}", estimate.jobType || "project")
    .replaceAll("{contractor}", settings.contractorName || "your contractor")
    .replaceAll("{company}", settings.companyName || "your company")
    .replaceAll("{phone}", settings.phone || "your phone number");
}

function buildFollowUps(estimate: Pick<Estimate, "customerName" | "jobType" | "estimateSentDate">, settings: Settings) {
  return [1, 3, 7, 14, 30].map((day) => {
    const stage = `Day ${day}`;
    const template = settings.templates?.[stage] || fallbackTemplates[stage] || fallbackTemplates["Day 30"];
    return {
      id: makeId("demo-fu"),
      stage,
      dueDate: addDays(estimate.estimateSentDate, day),
      status: "Due",
      messageContent: fill(template, estimate, settings),
    };
  });
}

function makeDemo(settings: Settings) {
  const now = new Date().toISOString();
  const rows: Array<[string, string, string, number, number, string, string]> = [
    ["Martha Collins", "Roofing", "roof repair", 8400, -3, "Pending", "Leak over garage. Asked about starting next week."],
    ["Dan and Priya Shah", "Remodeling", "bathroom remodel", 18750, -8, "Pending", "Comparing two layouts. Strong fit if timing works."],
    ["Oak Lane Dental", "HVAC", "unit replacement", 12600, -14, "Won", "Approved deposit. Schedule crew."],
    ["Ben Ramirez", "Painting", "exterior paint", 5200, -20, "Lost", "Went with lower bid."],
    ["Riverside HOA", "Landscaping", "seasonal cleanup", 3600, -1, "Pending", "Board votes this week."],
  ];

  return rows.map(([customerName, tradeType, jobType, estimateAmount, offset, status, notes], index) => {
    const estimate = {
      id: `demo-${Date.now()}-${index}`,
      customerName,
      phone: `(555) 200-10${index}`,
      email: `${customerName.toLowerCase().replaceAll(" ", ".")}@example.com`,
      tradeType,
      jobType,
      estimateAmount,
      estimateSentDate: addDays(today(), offset),
      status,
      notes: `[Demo] ${notes}`,
      followUps: [] as FollowUp[],
      createdAt: now,
      updatedAt: now,
    };
    estimate.followUps = buildFollowUps(estimate, settings);
    return estimate;
  });
}

function loadDemoData() {
  const app = readApp();
  const settings = app.settings || {};
  const realEstimates = (app.estimates || []).filter((estimate) => !String(estimate.id).startsWith("demo-") && !String(estimate.notes || "").startsWith("[Demo]"));
  const next = { ...app, estimates: [...makeDemo(settings), ...realEstimates] };
  window.localStorage.setItem(APP_KEY, JSON.stringify(next));
  window.location.reload();
}

function hideDemoData() {
  const app = readApp();
  const next = {
    ...app,
    estimates: (app.estimates || []).filter((estimate) => !String(estimate.id).startsWith("demo-") && !String(estimate.notes || "").startsWith("[Demo]")),
  };
  window.localStorage.setItem(APP_KEY, JSON.stringify(next));
  window.location.reload();
}

function addControls() {
  const dashboard = document.querySelector(".topbar h2");
  if (dashboard?.textContent?.trim() !== "Dashboard") return;
  if (document.querySelector(".bidback-demo-controls")) return;

  const app = readApp();
  const estimates = app.estimates || [];
  const hasDemo = estimates.some((estimate) => String(estimate.id).startsWith("demo-") || String(estimate.notes || "").startsWith("[Demo]"));

  const controls = document.createElement("div");
  controls.className = "bidback-demo-controls";
  controls.innerHTML = `
    <button type="button" class="button small">${hasDemo ? "Hide demo data" : "Load demo data"}</button>
    <span>${hasDemo ? "Demo estimates are showing." : "Need sample estimates? Load demo data."}</span>
  `;
  controls.querySelector("button")?.addEventListener("click", hasDemo ? hideDemoData : loadDemoData);
  dashboard.closest(".topbar")?.insertAdjacentElement("afterend", controls);
}

export function DemoDataControls() {
  useEffect(() => {
    addControls();
    const interval = window.setInterval(addControls, 800);
    document.addEventListener("change", addControls, true);
    document.addEventListener("click", () => window.setTimeout(addControls, 100), true);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("change", addControls, true);
    };
  }, []);

  return (
    <style>{`
      .bidback-demo-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        border: 1px solid rgba(31,107,79,.2);
        border-radius: 8px;
        background: #f7fbf8;
        color: var(--muted);
        margin: -8px 0 14px;
        padding: 10px;
        font-size: .88rem;
        font-weight: 650;
      }
      .bidback-demo-controls .button {
        flex: 0 0 auto;
      }
      @media (max-width: 520px) {
        .bidback-demo-controls {
          align-items: stretch;
          display: grid;
        }
        .bidback-demo-controls .button {
          width: 100%;
        }
      }
    `}</style>
  );
}
