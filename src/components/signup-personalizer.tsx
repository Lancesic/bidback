"use client";

import { useEffect } from "react";

const TESTER_KEY = "bidback-tester-v1";
const APP_KEY = "bidback-v2";
const PENDING_KEY = "bidback-pending-personalization-v2";
const DONE_KEY = "bidback-personalized-profile-v2";

const trades = ["General Contractor", "HVAC", "Roofing", "Painting", "Landscaping", "Remodeling", "Plumbing", "Electrical", "Other"];

type TesterProfile = { id?: string; name?: string; email?: string; phone?: string };
type PendingProfile = TesterProfile & { companyName?: string; defaultTrade?: string; version?: string };
type FollowUpState = { stage?: string; status?: string; messageContent?: string; [key: string]: unknown };
type EstimateState = { customerName?: string; jobType?: string; status?: string; followUps?: FollowUpState[]; [key: string]: unknown };
type SettingsState = { companyName?: string; contractorName?: string; phone?: string; email?: string; defaultTrade?: string; schedule?: string; templates?: Record<string, string>; [key: string]: unknown };
type AppState = { estimates?: EstimateState[]; settings?: SettingsState; [key: string]: unknown };

const templates: Record<string, string> = {
  "Day 1": "Hi {customer}, this is {contractor} with {company}. I'm checking that you received the estimate for your {job}. If you have questions or want to adjust the scope, call or text me at {phone}.",
  "Day 3": "Hi {customer}, this is {contractor} with {company}. I wanted to check in on your {job} estimate. Is this still something you want to move forward with, or is there anything you want me to clarify?",
  "Day 7": "Hi {customer}, this is {contractor}. Quick reminder on your {job} estimate from {company}. The goal is to keep the project clear, priced, and easy to move forward with. Want me to help you decide the next step?",
  "Day 14": "Hi {customer}, no pressure at all. Should I keep your {job} estimate open, make changes to it, or close it out for now? You can reach me at {phone}.",
  "Day 30": "Hi {customer}, this is {contractor} with {company}. I'm closing the loop on your {job} estimate for now. If this project comes back up, call or text me at {phone} and I will be glad to help.",
  "Too expensive objection": "I understand, {customer}. If the {job} estimate feels higher than expected, I can look at the scope and see if there is a simpler option that still solves the main problem. This is {contractor} with {company}; you can reach me at {phone}.",
  "Getting other quotes objection": "That makes sense, {customer}. When you compare quotes for {job}, make sure the scope, materials, cleanup, and warranty are lined up clearly. If you want, I can walk you through what is included in the {company} estimate.",
  "Still thinking objection": "Totally fair, {customer}. What are you still deciding on for the {job}: timing, budget, scope, or something else? This is {contractor}, and I am happy to help make the next step clear.",
  "Waiting on spouse/partner": "No problem, {customer}. If it helps, I can send a short summary of the {job} scope, price, and next steps so it is easy to review together. This is {contractor} with {company}.",
  "Insurance delay": "Understood, {customer}. If insurance needs details from the {job} estimate, send them my way and I can help point out the scope and pricing. This is {contractor} with {company}, {phone}.",
  "Old estimate win-back": "Hi {customer}, this is {contractor} with {company}. I am circling back on your older {job} estimate. Is this project still on your list? If so, I can refresh the price and timing.",
  "Voicemail script": "Hi {customer}, this is {contractor} with {company}. I am following up on the estimate for your {job}. You can call or text me back at {phone}. Thanks."
};

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function profileKey(profile: PendingProfile) {
  return [profile.name, profile.email, profile.phone, profile.companyName, profile.defaultTrade].filter(Boolean).join("|").toLowerCase();
}

function fillTemplate(template: string, estimate: Pick<EstimateState, "customerName" | "jobType">, settings: SettingsState) {
  return template
    .replaceAll("{customer}", estimate.customerName || "Customer")
    .replaceAll("{job}", estimate.jobType || "project")
    .replaceAll("{contractor}", settings.contractorName || "your contractor")
    .replaceAll("{company}", settings.companyName || "your company")
    .replaceAll("{phone}", settings.phone || "your phone number");
}

function upsertSignupFields() {
  const form = document.querySelector<HTMLFormElement>(".tester-modal");
  if (!form || form.querySelector('[name="companyName"]')) return;

  const firstField = form.querySelector(".field");
  const company = document.createElement("label");
  company.className = "field bidback-company-field";
  company.innerHTML = '<span>Company name</span><input name="companyName" required autocomplete="organization" />';
  form.insertBefore(company, firstField || null);

  const phone = form.querySelector<HTMLInputElement>('[name="phone"]');
  const trade = document.createElement("label");
  trade.className = "field bidback-trade-field";
  trade.innerHTML = `<span>Main trade</span><select name="defaultTrade">${trades.map((item) => `<option>${item}</option>`).join("")}</select>`;
  const phoneField = phone?.closest(".field");
  if (phoneField?.parentElement) phoneField.parentElement.insertBefore(trade, phoneField.nextSibling);

  form.addEventListener("submit", () => {
    const data = new FormData(form);
    const pending: PendingProfile = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      companyName: String(data.get("companyName") || "").trim(),
      defaultTrade: String(data.get("defaultTrade") || "").trim(),
      version: String(Date.now()),
    };
    writeJson(PENDING_KEY, pending);
    window.sessionStorage.removeItem(DONE_KEY);
  }, true);
}

function personalizeApp(profile: PendingProfile) {
  const app = readJson<AppState>(APP_KEY) || {};
  const settings = app.settings || {};
  const nextSettings: SettingsState = {
    ...settings,
    companyName: profile.companyName || settings.companyName || `${profile.name || "Your"} Company`,
    contractorName: profile.name || settings.contractorName || "",
    phone: profile.phone || settings.phone || "",
    email: profile.email || settings.email || "",
    defaultTrade: profile.defaultTrade || settings.defaultTrade || "Remodeling",
    templates: { ...(settings.templates || {}), ...templates },
  };

  const estimates = Array.isArray(app.estimates)
    ? app.estimates.map((estimate) => {
        if (estimate.status !== "Pending" || !Array.isArray(estimate.followUps)) return estimate;
        return {
          ...estimate,
          followUps: estimate.followUps.map((followUp) => {
            if (followUp.status !== "Due" || !followUp.stage) return followUp;
            const template = nextSettings.templates?.[followUp.stage];
            if (!template) return followUp;
            return { ...followUp, messageContent: fillTemplate(template, estimate, nextSettings) };
          }),
        };
      })
    : app.estimates;

  const nextApp = { ...app, settings: nextSettings, estimates };
  writeJson(APP_KEY, nextApp);
  window.dispatchEvent(new Event("bidback-settings-autofilled"));
  return nextApp;
}

async function syncPersonalizedApp(app: AppState) {
  const tester = readJson<TesterProfile>(TESTER_KEY);
  if (!tester?.id) return;
  await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testerId: tester.id, appData: { estimates: app.estimates || [], settings: app.settings || {} } }),
  }).catch(() => undefined);
}

function personalizeVisibleScripts() {
  const settings = readJson<AppState>(APP_KEY)?.settings;
  if (!settings) return;
  document.querySelectorAll<HTMLElement>(".script-card").forEach((card) => {
    const title = card.querySelector("h3")?.textContent?.trim();
    const box = card.querySelector<HTMLElement>(".script-box");
    if (!title || !box) return;
    const template = settings.templates?.[title] || templates[title];
    if (!template) return;
    box.textContent = fillTemplate(template, { customerName: "Customer", jobType: "project" }, settings);
  });
}

export function SignupPersonalizer() {
  useEffect(() => {
    let checks = 0;
    const interval = window.setInterval(() => {
      checks += 1;
      upsertSignupFields();
      personalizeVisibleScripts();

      const tester = readJson<TesterProfile>(TESTER_KEY);
      const pending = readJson<PendingProfile>(PENDING_KEY);
      const profile = pending || (tester?.name ? tester : null);

      if (profile?.name) {
        const key = profileKey(profile);
        const alreadyDone = window.sessionStorage.getItem(DONE_KEY) === key;
        const app = personalizeApp(profile);
        if (!alreadyDone) {
          window.sessionStorage.setItem(DONE_KEY, key);
          void syncPersonalizedApp(app);
          window.setTimeout(() => window.location.reload(), 500);
        } else if (pending) {
          window.localStorage.removeItem(PENDING_KEY);
        }
      }

      if (checks > 120) window.clearInterval(interval);
    }, 200);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
