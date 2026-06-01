"use client";

import { useEffect } from "react";

function selectView(viewName: string) {
  const mobileNav = document.querySelector<HTMLSelectElement>(".mobile-nav");
  if (mobileNav) {
    mobileNav.value = viewName;
    mobileNav.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  const navButton = Array.from(document.querySelectorAll<HTMLButtonElement>(".nav button")).find(
    (button) => button.textContent?.trim() === viewName,
  );
  navButton?.click();
}

function openEstimate(customerName: string) {
  selectView("Control Room");
  window.setTimeout(() => {
    const controlSelect = Array.from(document.querySelectorAll<HTMLSelectElement>("select")).find((select) =>
      Array.from(select.options).some((option) => option.textContent?.trim() === customerName),
    );
    if (!controlSelect) return;
    const option = Array.from(controlSelect.options).find((item) => item.textContent?.trim() === customerName);
    if (!option) return;
    controlSelect.value = option.value;
    controlSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }, 120);
}

function enhanceDashboardRows() {
  const rows = document.querySelectorAll<HTMLElement>(".preference-row");
  rows.forEach((row) => {
    if (row.dataset.openEstimateReady === "true") return;
    const customer = row.querySelector("strong")?.textContent?.trim();
    if (!customer) return;
    row.dataset.openEstimateReady = "true";
    row.classList.add("dashboard-hot-row");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button small dashboard-open-button";
    button.textContent = "Open estimate";
    button.addEventListener("click", () => openEstimate(customer));
    row.appendChild(button);
  });
}

export function DashboardOpenEstimates() {
  useEffect(() => {
    enhanceDashboardRows();
    const observer = new MutationObserver(() => enhanceDashboardRows());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <style>{`
      .card.section:has(.dashboard-hot-row) > h3 {
        font-size: 0;
        margin: 0 0 8px;
      }
      .card.section:has(.dashboard-hot-row) > h3::before {
        content: "Most important estimates to contact";
        display: block;
        color: var(--foreground);
        font-size: 1.2rem;
        font-weight: 900;
      }
      .card.section:has(.dashboard-hot-row) > h3::after {
        content: "Sorted by next follow-up due, then highest value.";
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: .9rem;
        font-weight: 500;
      }
      .dashboard-hot-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
      }
      .dashboard-hot-row > strong {
        grid-column: 2;
        grid-row: 1;
      }
      .dashboard-open-button {
        grid-column: 1 / -1;
        justify-self: start;
        margin-top: 10px;
      }
      @media (max-width: 520px) {
        .dashboard-hot-row {
          grid-template-columns: 1fr;
        }
        .dashboard-hot-row > strong {
          grid-column: 1;
          grid-row: auto;
        }
        .dashboard-open-button {
          width: 100%;
        }
      }
    `}</style>
  );
}
