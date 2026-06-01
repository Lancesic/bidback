"use client";

import { useLayoutEffect } from "react";

const keysToClear = [
  "bidback-v2",
  "bidback-tester-v1",
  "bidback-pending-personalization-v2",
  "bidback-pending-personalization-v3",
  "bidback-signup-extras-v1",
];

const sessionKeysToClear = [
  "bidback-personalized-profile-v2",
  "bidback-hard-personalized-v1",
  "bidback-script-template-upgrade-v1",
  "bidback-script-template-upgrade-v2",
];

export function FreshStartCleaner() {
  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fresh") !== "1") return;

    keysToClear.forEach((key) => window.localStorage.removeItem(key));
    sessionKeysToClear.forEach((key) => window.sessionStorage.removeItem(key));
  }, []);

  return null;
}
