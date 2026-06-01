"use client";

import { useEffect } from "react";

const TESTER_KEY = "bidback-tester-v1";
const APP_KEY = "bidback-v2";

type TesterProfile = {
  name?: string;
  email?: string;
  phone?: string;
};

type AppState = {
  estimates?: Array<{
    followUps?: Array<{
      status?: string;
      messageContent?: string;
    }>;
  }>;
  settings?: {
    companyName?: string;
    contractorName?: string;
    phone?: string;
    email?: string;
    defaultTrade?: string;
    schedule?: string;
    templates?: Record<string, string>;
  };
};

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function shouldReplaceName(current?: string) {
  return !current || current === "Lance" || current === "BidBack";
}

export function SignupSettingsBridge() {
  useEffect(() => {
    let checks = 0;
    const interval = window.setInterval(() => {
      checks += 1;
      const tester = readJson<TesterProfile>(TESTER_KEY);
      const app = readJson<AppState>(APP_KEY);

      if (!tester?.name || !app) {
        if (checks > 24) window.clearInterval(interval);
        return;
      }

      const settings = app.settings || {};
      const nextSettings = {
        ...settings,
        contractorName: shouldReplaceName(settings.contractorName) ? tester.name : settings.contractorName,
        phone: settings.phone || tester.phone || "",
        email: settings.email || tester.email || "",
      };

      const changed =
        nextSettings.contractorName !== settings.contractorName ||
        nextSettings.phone !== settings.phone ||
        nextSettings.email !== settings.email;

      if (changed) {
        window.localStorage.setItem(APP_KEY, JSON.stringify({ ...app, settings: nextSettings }));
        window.dispatchEvent(new Event("bidback-settings-autofilled"));
      }

      if (changed || checks > 24) window.clearInterval(interval);
    }, 500);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
