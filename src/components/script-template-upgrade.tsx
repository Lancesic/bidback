"use client";

import { useEffect } from "react";

type StoredFollowUp = {
  stage?: string;
  status?: string;
  messageContent?: string;
  [key: string]: unknown;
};

type StoredEstimate = {
  customerName?: string;
  jobType?: string;
  status?: string;
  followUps?: StoredFollowUp[];
  [key: string]: unknown;
};

type StoredSettings = {
  companyName?: string;
  contractorName?: string;
  phone?: string;
  templates?: Record<string, string>;
  [key: string]: unknown;
};

type StoredApp = {
  settings?: StoredSettings;
  estimates?: StoredEstimate[];
  [key: string]: unknown;
};

const STORAGE_KEY = "bidback-v2";
const UPGRADE_KEY = "bidback-script-template-upgrade-v1";

const upgradedTemplates: Record<string, string> = {
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

const olderDefaults = new Set([
  "Hi {customer}, this is {contractor} with {company}. Just confirming you received the estimate for your {job}. Happy to answer any questions.",
  "Hi {customer}, checking in on the {job} estimate. Is this still something you would like to move forward with?",
  "Hi {customer}, quick reminder that the estimate includes the scope we discussed for {job}. I can help you compare options if useful.",
  "Hi {customer}, no pressure. Should I keep this estimate open, make changes, or close it out for now?",
  "Hi {customer}, I am closing the loop on the {job} estimate. If this comes back up, I would be glad to help.",
  "Hi Customer, just checking in. Happy to answer questions or update the estimate if needed."
]);

function fillTemplate(template: string, estimate: StoredEstimate, settings: StoredSettings) {
  return template
    .replaceAll("{customer}", estimate.customerName || "Customer")
    .replaceAll("{job}", estimate.jobType || "project")
    .replaceAll("{contractor}", settings.contractorName || "your contractor")
    .replaceAll("{company}", settings.companyName || "your company")
    .replaceAll("{phone}", settings.phone || "your phone number");
}

function shouldReplaceTemplate(title: string, current?: string) {
  if (!current) return true;
  if (olderDefaults.has(current)) return true;
  if (!(title in upgradedTemplates)) return false;
  return current.trim() === "Hi Customer, just checking in. Happy to answer questions or update the estimate if needed.";
}

export function ScriptTemplateUpgrade() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const stored = raw ? (JSON.parse(raw) as StoredApp) : {};
      const settings: StoredSettings = stored.settings || {};
      const templates = { ...(settings.templates || {}) };
      let changed = false;

      Object.entries(upgradedTemplates).forEach(([title, template]) => {
        if (shouldReplaceTemplate(title, templates[title])) {
          templates[title] = template;
          changed = true;
        }
      });

      const nextSettings: StoredSettings = { ...settings, templates };
      const estimates = Array.isArray(stored.estimates)
        ? stored.estimates.map((estimate) => {
            if (estimate.status !== "Pending" || !Array.isArray(estimate.followUps)) return estimate;
            let estimateChanged = false;
            const followUps = estimate.followUps.map((followUp) => {
              if (followUp.status !== "Due" || !followUp.stage) return followUp;
              const template = templates[followUp.stage];
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
        : stored.estimates;

      if (!changed) return;

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, settings: nextSettings, estimates }));

      if (sessionStorage.getItem(UPGRADE_KEY) !== "done") {
        sessionStorage.setItem(UPGRADE_KEY, "done");
        window.location.reload();
      }
    } catch {
      // Keep the app usable even if old local data is malformed.
    }
  }, []);

  return null;
}
