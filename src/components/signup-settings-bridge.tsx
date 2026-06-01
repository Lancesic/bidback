"use client";

import { useEffect } from "react";

const TESTER_KEY = "bidback-tester-v1";
const APP_KEY = "bidback-v2";
const EXTRAS_KEY = "bidback-signup-extras-v1";
const RELOAD_KEY = "bidback-signup-personalized-v1";

const trades = ["General Contractor", "HVAC", "Roofing", "Painting", "Landscaping", "Remodeling", "Plumbing", "Electrical", "Other"];

type TesterProfile = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
};

type SignupExtras = {
  companyName?: string;
  defaultTrade?: string;
};

type FollowUpState = {
  stage?: string;
  status?: string;
  messageContent?: string;
  [key: string]: unknown;
};

type EstimateState = {
  customerName?: string;
  jobType?: string;
  status?: string;
  followUps?: FollowUpState[];
  [key: string]: unknown;
};

type SettingsState = {
  companyName?: string;
  contractorName?: string;
  phone?: string;
  email?: string;
  defaultTrade?: string;
  schedule?: string;
  templates?: Record<string, string>;
  [key: string]: unknown;
};

type AppState = {
  estimates?: EstimateState[];
  settings?: SettingsState;
  [key: string]: unknown;
};

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

const olderDefaultValues = new Set([
  "Hi {customer}, this is {contractor} with {company}. Just confirming you received the estimate for your {job}. Happy to answer any questions.",
  "Hi {customer}, checking in on the {job} estimate. Is this still something you would like to move forward with?",
  "Hi {customer}, quick reminder that the estimate includes the scope we discussed for {job}. I can help you compare options if useful.",
  "Hi {customer}, no pressure. Should I keep this estimate open, make changes, or close it out for now?",
  "Hi {customer}, I am closing the loop on the {job} estimate. If this comes back up, I would be glad to help.",
  "Hi Customer, just checking in. Happy to answer questions or update the estimate if needed."
]);

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function shouldReplaceCompany(current?: string) {
  return !current || current === "BidBack Contracting" || current === "your company";
}

function shouldReplaceTemplate(title: string, current?: string) {
  return !current || olderDefaultValues.has(current) || current === templates[title];
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
    const extras: SignupExtras = {
      companyName: String(data.get("companyName") || "").trim(),
      defaultTrade: String(data.get("defaultTrade") || "").trim(),
    };
    window.localStorage.setItem(EXTRAS_KEY, JSON.stringify(extras));
  }, true);
}

function personalizeStoredApp(profile: TesterProfile, extras: SignupExtras) {
  const app = readJson<AppState>(APP_KEY) || {};
  const settings = app.settings || {};
  const companyName = extras.companyName || (shouldReplaceCompany(settings.companyName) ? `${profile.name}'s Company` : settings.companyName) || "";
  const nextTemplates = { ...(settings.templates || {}) };
  let changed = false;

  Object.entries(templates).forEach(([title, template]) => {
    if (shouldReplaceTemplate(title, nextTemplates[title])) {
      nextTemplates[title] = template;
      changed = true;
    }
  });

  const nextSettings: SettingsState = {
    ...settings,
    companyName,
    contractorName: profile.name || settings.contractorName || "",
    phone: profile.phone || settings.phone || "",
    email: profile.email || settings.email || "",
    defaultTrade: extras.defaultTrade || settings.defaultTrade || "Remodeling",
    templates: nextTemplates,
  };

  changed = changed || JSON.stringify(nextSettings) !== JSON.stringify(settings);

  const estimates = Array.isArray(app.estimates)
    ? app.estimates.map((estimate) => {
        if (estimate.status !== "Pending" || !Array.isArray(estimate.followUps)) return estimate;
        let estimateChanged = false;
        const followUps = estimate.followUps.map((followUp) => {
          if (followUp.status !== "Due" || !followUp.stage) return followUp;
          const template = nextTemplates[followUp.stage];
          if (!template) return followUp;
          const messageContent = fillTemplate(template, estimate, nextSettings);
          if (messageContent === followUp.messageContent) return followUp;
          estimateChanged = true;
          return { ...followUp, messageContent };
        });
        if (!estimateChanged) return estimate;
        changed = true;
        return { ...estimate, followUps };
      })
    : app.estimates;

  if (!changed) return false;
  window.localStorage.setItem(APP_KEY, JSON.stringify({ ...app, settings: nextSettings, estimates }));
  window.dispatchEvent(new Event("bidback-settings-autofilled"));
  return true;
}

function personalizeVisibleScriptLibrary() {
  const app = readJson<AppState>(APP_KEY);
  const settings = app?.settings;
  if (!settings) return;

  document.querySelectorAll<HTMLElement>(".script-card").forEach((card) => {
    const title = card.querySelector("h3")?.textContent?.trim();
    const box = card.querySelector<HTMLElement>(".script-box");
    if (!title || !box) return;
    const template = settings.templates?.[title] || templates[title];
    if (!template) return;
    const personalized = fillTemplate(template, { customerName: "Customer", jobType: "project" }, settings);
    if (box.textContent !== personalized) box.textContent = personalized;
  });
}

export function SignupSettingsBridge() {
  useEffect(() => {
    let checks = 0;
    const interval = window.setInterval(() => {
      checks += 1;
      upsertSignupFields();
      personalizeVisibleScriptLibrary();

      const tester = readJson<TesterProfile>(TESTER_KEY);
      const extras = readJson<SignupExtras>(EXTRAS_KEY) || {};
      if (tester?.name) {
        const changed = personalizeStoredApp(tester, extras);
        if (changed && sessionStorage.getItem(RELOAD_KEY) !== tester.email) {
          sessionStorage.setItem(RELOAD_KEY, tester.email || "done");
          window.setTimeout(() => window.location.reload(), 350);
        }
      }

      if (checks > 80) window.clearInterval(interval);
    }, 250);

    const copyHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      const card = target?.closest(".script-card");
      if (!button || !card || !button.textContent?.toLowerCase().includes("copy")) return;
      const text = card.querySelector(".script-box")?.textContent || "";
      if (!text) return;
      event.preventDefault();
      event.stopPropagation();
      void navigator.clipboard?.writeText(text);
    };

    document.addEventListener("click", copyHandler, true);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("click", copyHandler, true);
    };
  }, []);

  return null;
}
