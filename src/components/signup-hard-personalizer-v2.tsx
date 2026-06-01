"use client";

import { useEffect } from "react";

const TESTER_KEY = "bidback-tester-v1";
const APP_KEY = "bidback-v2";
const PENDING_KEY = "bidback-pending-personalization-v3";
const DONE_KEY = "bidback-hard-personalized-v2";

const trades = ["General Contractor", "HVAC", "Roofing", "Painting", "Landscaping", "Remodeling", "Plumbing", "Electrical", "Other"];

type TesterProfile = { id?: string; name?: string; email?: string; phone?: string };
type SignupProfile = TesterProfile & { companyName?: string; defaultTrade?: string; version?: string };
type FollowUpState = { stage?: string; status?: string; messageContent?: string; [key: string]: unknown };
type EstimateState = { customerName?: string; jobType?: string; status?: string; followUps?: FollowUpState[]; [key: string]: unknown };
type SettingsState = { companyName?: string; contractorName?: string; phone?: string; email?: string; defaultTrade?: string; templates?: Record<string, string>; [key: string]: unknown };
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

function profileKey(profile: SignupProfile) {
  return [profile.name, profile.email, profile.phone, profile.companyName, profile.defaultTrade].filter(Boolean).join("|").toLowerCase();
}

function activeProfile() {
  const pending = readJson<SignupProfile>(PENDING_KEY) || readJson<SignupProfile>("bidback-pending-personalization-v2");
  if (pending?.name) return pending;
  const tester = readJson<TesterProfile>(TESTER_KEY);
  return tester?.name ? tester : null;
}

function fill(template: string, estimate: EstimateState, settings: SettingsState) {
  return template
    .replaceAll("{customer}", estimate.customerName || "Customer")
    .replaceAll("{job}", estimate.jobType || "project")
    .replaceAll("{contractor}", settings.contractorName || "your contractor")
    .replaceAll("{company}", settings.companyName || "your company")
    .replaceAll("{phone}", settings.phone || "your phone number");
}

function personalizeValue(value: string, profile: SignupProfile) {
  let app: AppState;
  try {
    app = value ? (JSON.parse(value) as AppState) : {};
  } catch {
    return value;
  }

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
            return template ? { ...followUp, messageContent: fill(template, estimate, nextSettings) } : followUp;
          }),
        };
      })
    : app.estimates;

  return JSON.stringify({ ...app, settings: nextSettings, estimates });
}

function savePendingFromForm(form: HTMLFormElement) {
  const data = new FormData(form);
  const profile: SignupProfile = {
    name: String(data.get("name") || "").trim(),
    email: String(data.get("email") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    companyName: String(data.get("companyName") || "").trim(),
    defaultTrade: String(data.get("defaultTrade") || "").trim(),
    version: String(Date.now()),
  };
  if (!profile.name) return;
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(profile));
  window.sessionStorage.removeItem(DONE_KEY);
}

function upsertSignupFields() {
  const form = document.querySelector<HTMLFormElement>(".tester-modal");
  if (!form) return;

  if (!form.querySelector('[name="companyName"]')) {
    const firstField = form.querySelector(".field");
    const company = document.createElement("label");
    company.className = "field bidback-company-field";
    company.innerHTML = '<span>Company name</span><input name="companyName" required autocomplete="organization" />';
    form.insertBefore(company, firstField || null);
  }

  if (!form.querySelector('[name="defaultTrade"]')) {
    const phone = form.querySelector<HTMLInputElement>('[name="phone"]');
    const trade = document.createElement("label");
    trade.className = "field bidback-trade-field";
    trade.innerHTML = `<span>Main trade</span><select name="defaultTrade">${trades.map((item) => `<option>${item}</option>`).join("")}</select>`;
    const phoneField = phone?.closest(".field");
    if (phoneField?.parentElement) phoneField.parentElement.insertBefore(trade, phoneField.nextSibling);
  }

  if (form.dataset.bidbackPersonalizer !== "wired") {
    form.dataset.bidbackPersonalizer = "wired";
    form.addEventListener("submit", () => savePendingFromForm(form), true);
  }
}

function forcePersonalizedReload() {
  const profile = activeProfile();
  if (!profile?.name) return;
  const raw = window.localStorage.getItem(APP_KEY) || "{}";
  const personalized = personalizeValue(raw, profile);
  if (personalized !== raw) window.localStorage.setItem(APP_KEY, personalized);

  const key = profileKey(profile);
  if (window.sessionStorage.getItem(DONE_KEY) !== key) {
    window.sessionStorage.setItem(DONE_KEY, key);
    window.setTimeout(() => window.location.reload(), 400);
  }
}

export function SignupHardPersonalizerV2() {
  useEffect(() => {
    const storagePrototype = Object.getPrototypeOf(window.localStorage) as Storage;
    const originalSetItem = storagePrototype.setItem;
    let patched = false;

    try {
      storagePrototype.setItem = function setItem(key: string, value: string) {
        if (key === APP_KEY) {
          const profile = activeProfile();
          if (profile?.name) return originalSetItem.call(this, key, personalizeValue(String(value), profile));
        }
        return originalSetItem.call(this, key, value);
      };
      patched = true;
    } catch {
      patched = false;
    }

    let checks = 0;
    const interval = window.setInterval(() => {
      checks += 1;
      upsertSignupFields();
      forcePersonalizedReload();
      if (checks > 150) window.clearInterval(interval);
    }, 150);

    return () => {
      if (patched) {
        try {
          storagePrototype.setItem = originalSetItem;
        } catch {
          // Nothing else to clean up.
        }
      }
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
