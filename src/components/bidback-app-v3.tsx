"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Status = "Pending" | "Won" | "Lost" | "Closed";
type FollowUpStatus = "Due" | "Sent" | "Skipped" | "Snoozed";
type Stage = "Day 1" | "Day 3" | "Day 7" | "Day 14" | "Day 30";

type Tester = {
  id?: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  defaultTrade: string;
};

type Settings = {
  companyName: string;
  contractorName: string;
  phone: string;
  email: string;
  defaultTrade: string;
  schedule: string;
  templates: Record<string, string>;
};

type FollowUp = {
  id: string;
  stage: Stage;
  dueDate: string;
  status: FollowUpStatus;
  sentDate?: string;
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
  status: Status;
  notes: string;
  followUps: FollowUp[];
  createdAt: string;
  updatedAt: string;
};

type EstimateForm = {
  customerName: string;
  phone: string;
  email: string;
  tradeType: string;
  jobType: string;
  estimateAmount: string;
  estimateSentDate: string;
  notes: string;
};

const APP_KEY = "bidback-v3";
const LEGACY_APP_KEY = "bidback-v2";
const TESTER_KEY = "bidback-tester-v1";
const TALLY_FEEDBACK_URL = process.env.NEXT_PUBLIC_TALLY_FEEDBACK_URL || "";
const FEEDBACK_EMAIL = "lancebradleyadcock@gmail.com";

const trades = ["General Contractor", "HVAC", "Roofing", "Painting", "Landscaping", "Remodeling", "Plumbing", "Electrical", "Other"];
const stages: Stage[] = ["Day 1", "Day 3", "Day 7", "Day 14", "Day 30"];

const defaultTemplates: Record<string, string> = {
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

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

function prettyDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function cleanPhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function baseSettings(profile?: Partial<Tester>): Settings {
  return {
    companyName: profile?.companyName || "BidBack Contracting",
    contractorName: profile?.name || "Lance",
    phone: profile?.phone || "",
    email: profile?.email || "",
    defaultTrade: profile?.defaultTrade || "Remodeling",
    schedule: "1,3,7,14,30",
    templates: { ...defaultTemplates },
  };
}

function blankForm(settings: Settings): EstimateForm {
  return {
    customerName: "",
    phone: "",
    email: "",
    tradeType: settings.defaultTrade,
    jobType: "",
    estimateAmount: "",
    estimateSentDate: today(),
    notes: "",
  };
}

function scheduleDays(settings: Settings) {
  const days = settings.schedule.split(",").map((item) => Number(item.trim())).filter((item) => Number.isFinite(item) && item > 0);
  return days.length ? days : [1, 3, 7, 14, 30];
}

function fill(template: string, estimate: Pick<Estimate, "customerName" | "jobType">, settings: Settings) {
  return template
    .replaceAll("{customer}", estimate.customerName || "Customer")
    .replaceAll("{job}", estimate.jobType || "project")
    .replaceAll("{contractor}", settings.contractorName || "your contractor")
    .replaceAll("{company}", settings.companyName || "your company")
    .replaceAll("{phone}", settings.phone || "your phone number");
}

function buildFollowUps(estimate: Pick<Estimate, "customerName" | "jobType" | "estimateSentDate">, settings: Settings): FollowUp[] {
  return scheduleDays(settings).map((day) => {
    const stage = `Day ${day}` as Stage;
    const template = settings.templates[stage] || defaultTemplates[stage] || defaultTemplates["Day 30"];
    return {
      id: makeId("fu"),
      stage,
      dueDate: addDays(estimate.estimateSentDate, day),
      status: "Due",
      messageContent: fill(template, estimate, settings),
    };
  });
}

function makeEstimate(input: Omit<Estimate, "followUps">, settings: Settings): Estimate {
  return { ...input, followUps: buildFollowUps(input, settings) };
}

function demoData(settings: Settings) {
  const rows: Array<[string, string, string, number, number, Status, string]> = [
    ["Martha Collins", "Roofing", "roof repair", 8400, -3, "Pending", "Leak over garage. Asked about starting next week."],
    ["Dan and Priya Shah", "Remodeling", "bathroom remodel", 18750, -8, "Pending", "Comparing two layouts. Strong fit if timing works."],
    ["Oak Lane Dental", "HVAC", "unit replacement", 12600, -14, "Won", "Approved deposit. Schedule crew."],
    ["Ben Ramirez", "Painting", "exterior paint", 5200, -20, "Lost", "Went with lower bid."],
    ["Riverside HOA", "Landscaping", "seasonal cleanup", 3600, -1, "Pending", "Board votes this week."],
  ];

  return rows.map(([customerName, tradeType, jobType, amount, offset, status, notes], index) => makeEstimate({
    id: `demo-${index}`,
    customerName,
    phone: `(555) 200-10${index}`,
    email: `${customerName.toLowerCase().replaceAll(" ", ".")}@example.com`,
    tradeType,
    jobType,
    estimateAmount: amount,
    estimateSentDate: addDays(today(), offset),
    status,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, settings));
}

function nextFollowUp(estimate: Estimate) {
  return estimate.followUps.filter((item) => item.status === "Due").sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
}

function packageData(tester: Tester | null, estimates: Estimate[], settings: Settings, comments = "") {
  const pending = estimates.filter((estimate) => estimate.status === "Pending");
  const won = estimates.filter((estimate) => estimate.status === "Won");
  const lost = estimates.filter((estimate) => estimate.status === "Lost");
  return {
    submittedAt: new Date().toISOString(),
    tester,
    comments,
    settings,
    summary: {
      total: estimates.length,
      pending: pending.length,
      won: won.length,
      lost: lost.length,
      openValue: pending.reduce((sum, item) => sum + item.estimateAmount, 0),
      wonValue: won.reduce((sum, item) => sum + item.estimateAmount, 0),
      lostValue: lost.reduce((sum, item) => sum + item.estimateAmount, 0),
      sentFollowUps: estimates.flatMap((item) => item.followUps).filter((item) => item.status === "Sent").length,
    },
    estimates,
  };
}

export function BidBackAppV3() {
  const [settings, setSettings] = useState<Settings>(() => baseSettings());
  const [estimates, setEstimates] = useState<Estimate[]>(() => demoData(baseSettings()));
  const [tester, setTester] = useState<Tester | null>(null);
  const [view, setView] = useState("Dashboard");
  const [selected, setSelected] = useState("");
  const [form, setForm] = useState<EstimateForm>(() => blankForm(baseSettings()));
  const [toast, setToast] = useState("");
  const [cloudStatus, setCloudStatus] = useState("Local save");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const views = ["Dashboard", "Estimates", "Add Estimate", "Control Room", "Scripts", "Settings"];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fresh") === "1") {
      [APP_KEY, LEGACY_APP_KEY, TESTER_KEY].forEach((key) => localStorage.removeItem(key));
      window.history.replaceState({}, "", window.location.pathname);
      const freshSettings = baseSettings();
      setSettings(freshSettings);
      setEstimates(demoData(freshSettings));
      setForm(blankForm(freshSettings));
      setTester(null);
      setCloudStatus("Ready for signup");
      return;
    }

    const saved = readJson<{ estimates?: Estimate[]; settings?: Settings }>(APP_KEY) || readJson<{ estimates?: Estimate[]; settings?: Settings }>(LEGACY_APP_KEY);
    const savedTester = readJson<Tester>(TESTER_KEY);
    if (savedTester) setTester(savedTester);
    if (saved?.settings) {
      const next = { ...baseSettings(savedTester || undefined), ...saved.settings, templates: { ...defaultTemplates, ...saved.settings.templates } };
      setSettings(next);
      setForm(blankForm(next));
      if (saved.estimates) setEstimates(saved.estimates);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(APP_KEY, JSON.stringify({ estimates, settings }));
    if (tester?.id) {
      const timer = window.setTimeout(() => syncOnline(tester, estimates, settings), 700);
      return () => window.clearTimeout(timer);
    }
  }, [estimates, settings, tester]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const metrics = useMemo(() => {
    const pending = estimates.filter((estimate) => estimate.status === "Pending");
    const won = estimates.filter((estimate) => estimate.status === "Won");
    const lost = estimates.filter((estimate) => estimate.status === "Lost");
    const wonValue = won.reduce((sum, estimate) => sum + estimate.estimateAmount, 0);
    const lostValue = lost.reduce((sum, estimate) => sum + estimate.estimateAmount, 0);
    return {
      due: pending.flatMap((estimate) => estimate.followUps).filter((followUp) => followUp.status === "Due" && followUp.dueDate <= today()).length,
      openValue: pending.reduce((sum, estimate) => sum + estimate.estimateAmount, 0),
      wonValue,
      lostValue,
      recovery: wonValue + lostValue ? Math.round((wonValue / (wonValue + lostValue)) * 100) : 0,
    };
  }, [estimates]);

  function show(message: string) {
    setToast(message);
  }

  async function copy(text: string) {
    await navigator.clipboard?.writeText(text).catch(() => undefined);
    show("Copied");
  }

  async function syncOnline(currentTester: Tester, currentEstimates: Estimate[], currentSettings: Settings) {
    try {
      setCloudStatus("Saving online...");
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testerId: currentTester.id, appData: { estimates: currentEstimates, settings: currentSettings } }),
      });
      const json = await res.json() as { ok?: boolean; configured?: boolean };
      setCloudStatus(json.ok ? "Saved online" : json.configured === false ? "Local save" : "Online save issue");
    } catch {
      setCloudStatus("Online save issue");
    }
  }

  async function saveTester(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const profile: Tester = {
      name: String(data.get("name") || "").trim(),
      companyName: String(data.get("companyName") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      defaultTrade: String(data.get("defaultTrade") || "Remodeling"),
    };

    const personalizedSettings = baseSettings(profile);
    const personalizedEstimates = estimates.map((estimate) => ({
      ...estimate,
      tradeType: estimate.id.startsWith("demo-") ? estimate.tradeType : personalizedSettings.defaultTrade,
      followUps: buildFollowUps(estimate, personalizedSettings).map((followUp) => {
        const existing = estimate.followUps.find((item) => item.stage === followUp.stage);
        return existing?.status !== "Due" ? { ...followUp, status: existing?.status || followUp.status, sentDate: existing?.sentDate } : followUp;
      }),
    }));

    setSettings(personalizedSettings);
    setEstimates(personalizedEstimates);
    setForm(blankForm(personalizedSettings));

    try {
      setCloudStatus("Creating tester...");
      const res = await fetch("/api/testers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, appData: { estimates: personalizedEstimates, settings: personalizedSettings } }),
      });
      const json = await res.json() as { ok?: boolean; configured?: boolean; tester?: Partial<Tester> };
      const savedTester = { ...profile, ...json.tester, companyName: profile.companyName, defaultTrade: profile.defaultTrade };
      localStorage.setItem(TESTER_KEY, JSON.stringify(savedTester));
      setTester(savedTester);
      setCloudStatus(json.ok ? "Saved online" : json.configured === false ? "Local save" : "Online save issue");
      show(json.ok ? "Tester account created" : "Saved on this device");
    } catch {
      localStorage.setItem(TESTER_KEY, JSON.stringify(profile));
      setTester(profile);
      setCloudStatus("Online save issue");
      show("Saved on this device");
    }
  }

  function saveEstimate(event: FormEvent) {
    event.preventDefault();
    const now = new Date().toISOString();
    const estimate = makeEstimate({
      ...form,
      id: makeId("estimate"),
      estimateAmount: Number(form.estimateAmount),
      status: "Pending",
      createdAt: now,
      updatedAt: now,
    }, settings);
    setEstimates((current) => [estimate, ...current]);
    setSelected(estimate.id);
    setView("Control Room");
    setForm(blankForm(settings));
    show("Estimate added");
  }

  function setStatus(id: string, status: Status) {
    setEstimates((current) => current.map((estimate) => estimate.id === id ? { ...estimate, status, updatedAt: new Date().toISOString() } : estimate));
    show(`Marked ${status.toLowerCase()}`);
  }

  function markStage(estimateId: string, stage: Stage, status: FollowUpStatus) {
    setEstimates((current) => current.map((estimate) => estimate.id === estimateId ? {
      ...estimate,
      followUps: estimate.followUps.map((followUp) => followUp.stage === stage && followUp.status === "Due" ? {
        ...followUp,
        status,
        sentDate: status === "Sent" ? today() : followUp.sentDate,
        dueDate: status === "Snoozed" ? addDays(followUp.dueDate, 1) : followUp.dueDate,
      } : followUp),
    } : estimate));
    show(status === "Sent" ? "Stage marked sent" : status);
  }

  function applyTemplates() {
    setEstimates((current) => current.map((estimate) => estimate.status === "Pending" ? {
      ...estimate,
      followUps: estimate.followUps.map((followUp) => followUp.status === "Due" ? {
        ...followUp,
        messageContent: fill(settings.templates[followUp.stage] || defaultTemplates[followUp.stage], estimate, settings),
      } : followUp),
    } : estimate));
    show("Templates applied");
  }

  function exportCsv() {
    const rows = [["Customer", "Phone", "Email", "Trade", "Job", "Amount", "Sent", "Status", "Notes"], ...estimates.map((estimate) => [estimate.customerName, estimate.phone, estimate.email, estimate.tradeType, estimate.jobType, String(estimate.estimateAmount), estimate.estimateSentDate, estimate.status, estimate.notes])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `bidback-estimates-${today()}.csv`;
    link.click();
  }

  async function sendFeedback(comments = "") {
    const pack = packageData(tester, estimates, settings, comments);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testerId: tester?.id, comments, package: pack }),
    }).catch(() => undefined);

    const full = JSON.stringify(pack, null, 2);
    if (TALLY_FEEDBACK_URL) {
      const url = new URL(TALLY_FEEDBACK_URL);
      url.searchParams.set("tester_name", tester?.name || "");
      url.searchParams.set("tester_email", tester?.email || "");
      url.searchParams.set("tester_phone", tester?.phone || "");
      url.searchParams.set("summary", JSON.stringify(pack.summary));
      url.searchParams.set("app_data", full.slice(0, 5000));
      window.open(url.toString(), "_blank", "noopener,noreferrer");
      show("Feedback opened");
      return;
    }

    location.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(`BidBack feedback from ${tester?.name || "tester"}`)}&body=${encodeURIComponent(full.slice(0, 12000))}`;
  }

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">BB</div><div><h1>BidBack</h1><p>Stop losing jobs after the estimate.</p></div></div><nav className="nav">{views.map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item}</button>)}</nav></aside><main className="main"><select className="mobile-nav" value={view} onChange={(event) => setView(event.target.value)}>{views.map((item) => <option key={item}>{item}</option>)}</select>{view === "Dashboard" && <Dashboard metrics={metrics} estimates={estimates} onControl={() => setView("Control Room")} onAdd={() => setView("Add Estimate")} onExport={exportCsv} />}{view === "Estimates" && <Estimates estimates={estimates} onControl={(id) => { setSelected(id); setView("Control Room"); }} onStatus={setStatus} onExport={exportCsv} />}{view === "Add Estimate" && <AddEstimate form={form} setForm={setForm} saveEstimate={saveEstimate} />}{view === "Control Room" && <ControlRoom estimates={estimates.filter((estimate) => estimate.status === "Pending")} selected={selected} setSelected={setSelected} copy={copy} markStage={markStage} setStatus={setStatus} />}{view === "Scripts" && <Scripts settings={settings} copy={copy} />}{view === "Settings" && <SettingsView settings={settings} setSettings={setSettings} applyTemplates={applyTemplates} />}</main><button className="feedback-fab" onClick={() => tester ? sendFeedback() : setFeedbackOpen(true)}>Send Feedback</button>{tester && <div className="cloud-status">{cloudStatus}</div>}{!tester && <TesterModal onSubmit={saveTester} />}{feedbackOpen && <FeedbackModal tester={tester} onClose={() => setFeedbackOpen(false)} onSend={(comments) => { void sendFeedback(comments); setFeedbackOpen(false); }} />}{toast && <div className="toast">{toast}</div>}</div>;
}

function Dashboard({ metrics, estimates, onControl, onAdd, onExport }: { metrics: { due: number; openValue: number; wonValue: number; lostValue: number; recovery: number }; estimates: Estimate[]; onControl: () => void; onAdd: () => void; onExport: () => void }) {
  const hot = estimates.filter((estimate) => estimate.status === "Pending").sort((a, b) => (nextFollowUp(a)?.dueDate || "9999").localeCompare(nextFollowUp(b)?.dueDate || "9999") || b.estimateAmount - a.estimateAmount).slice(0, 5);
  return <><Header title="Dashboard" text="See what needs attention today." actions={<><button className="button primary" onClick={onControl}>Start follow-ups</button><button className="button" onClick={onAdd}>Add estimate</button><button className="button" onClick={onExport}>Export CSV</button></>} /><div className="grid metrics snapshot"><Metric label="Follow-ups Needing Action" value={String(metrics.due)} /><Metric label="Money Waiting on Follow-Up" value={money(metrics.openValue)} /><Metric label="Revenue Won Back" value={money(metrics.wonValue)} /><Metric label="Money Already Lost" value={money(metrics.lostValue)} /><Metric label="Recovery" value={`${metrics.recovery}%`} /><Metric label="Estimates" value={String(estimates.length)} /></div><section className="card section"><h3>Most important estimates to contact</h3><div className="panel-list">{hot.map((estimate) => <div className="preference-row" key={estimate.id}><div><strong>{estimate.customerName}</strong><p className="muted">{estimate.jobType} - {nextFollowUp(estimate)?.stage || "Done"}</p></div><strong>{money(estimate.estimateAmount)}</strong></div>)}</div></section></>;
}

function Estimates({ estimates, onControl, onStatus, onExport }: { estimates: Estimate[]; onControl: (id: string) => void; onStatus: (id: string, status: Status) => void; onExport: () => void }) {
  return <><Header title="Estimates" text="Track customers and job status." actions={<button className="button" onClick={onExport}>Export CSV</button>} /><section className="estimate-cards section">{estimates.map((estimate) => <article className="card estimate-card" key={estimate.id}><div className="estimate-card-main"><h3>{estimate.customerName}</h3><span className={`badge ${estimate.status.toLowerCase()}`}>{estimate.status}</span></div><p className="muted">{estimate.tradeType} - {estimate.jobType}</p><div className="estimate-card-meta"><div><span>Amount</span>{money(estimate.estimateAmount)}</div><div><span>Next</span>{nextFollowUp(estimate)?.stage || "Done"}</div><div><span>Phone</span>{estimate.phone}</div><div><span>Email</span>{estimate.email}</div></div><p>{estimate.notes}</p><div className="actions"><button className="button small primary" onClick={() => onControl(estimate.id)}>View</button><button className="button small" onClick={() => onStatus(estimate.id, "Won")}>Won</button><button className="button small" onClick={() => onStatus(estimate.id, "Lost")}>Lost</button></div></article>)}</section></>;
}

function AddEstimate({ form, setForm, saveEstimate }: { form: EstimateForm; setForm: (value: EstimateForm | ((current: EstimateForm) => EstimateForm)) => void; saveEstimate: (event: FormEvent) => void }) {
  const fields: Array<[keyof EstimateForm, string, string]> = [["customerName", "Customer name", "text"], ["phone", "Phone", "tel"], ["email", "Email", "email"], ["jobType", "Job type", "text"], ["estimateAmount", "Estimate amount", "number"], ["estimateSentDate", "Estimate sent date", "date"]];
  return <><Header title="Add Estimate" text="BidBack builds follow-ups from the sent date." /><form className="card form-grid" onSubmit={saveEstimate}>{fields.map(([key, label, type]) => <label className="field" key={key}><span>{label}</span><input required={key !== "phone" && key !== "email"} type={type} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} /></label>)}<label className="field"><span>Trade</span><select value={form.tradeType} onChange={(event) => setForm((current) => ({ ...current, tradeType: event.target.value }))}>{trades.map((trade) => <option key={trade}>{trade}</option>)}</select></label><label className="field full"><span>Notes</span><textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label><button className="button primary">Save estimate and build follow-ups</button></form></>;
}

function ControlRoom({ estimates, selected, setSelected, copy, markStage, setStatus }: { estimates: Estimate[]; selected: string; setSelected: (id: string) => void; copy: (text: string) => void; markStage: (id: string, stage: Stage, status: FollowUpStatus) => void; setStatus: (id: string, status: Status) => void }) {
  const visible = selected ? estimates.filter((estimate) => estimate.id === selected) : estimates;
  return <><Header title="Follow-Up Control Room" text="Work the next follow-up, then mark the stage sent." actions={<select value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">All pending</option>{estimates.map((estimate) => <option value={estimate.id} key={estimate.id}>{estimate.customerName}</option>)}</select>} /><div className="panel-list card section">{visible.map((estimate) => { const next = nextFollowUp(estimate); return <article className="estimate-panel follow-card" key={estimate.id}><div className="follow-head"><div><h3>{estimate.customerName}</h3><p className="muted">{estimate.tradeType} - {estimate.jobType}</p></div><strong>{money(estimate.estimateAmount)}</strong></div><p><span className="badge pending">{next?.stage || "Complete"}</span> <span className="muted">{next ? prettyDate(next.dueDate) : "No open follow-up"}</span></p>{next && <><div className="action-grid"><a className="button small" href={`tel:${cleanPhone(estimate.phone)}`}>Call</a><a className="button small" href={`sms:${cleanPhone(estimate.phone)}?&body=${encodeURIComponent(next.messageContent)}`}>Text</a><a className="button small" href={`mailto:${estimate.email}?subject=${encodeURIComponent(`Estimate for ${estimate.jobType}`)}&body=${encodeURIComponent(next.messageContent)}`}>Email</a></div><h4>Script</h4><div className="script-box">{next.messageContent}</div><div className="stage-actions section"><button className="button small" onClick={() => copy(next.messageContent)}>Copy Script</button><button className="button small" onClick={() => markStage(estimate.id, next.stage, "Snoozed")}>Snooze</button><button className="button small" onClick={() => markStage(estimate.id, next.stage, "Skipped")}>Skip</button><button className="button small primary" onClick={() => markStage(estimate.id, next.stage, "Sent")}>Mark stage sent</button></div></>}<p className="muted">{estimate.notes}</p><div className="actions"><button className="button small" onClick={() => setStatus(estimate.id, "Won")}>Mark won</button><button className="button small" onClick={() => setStatus(estimate.id, "Lost")}>Mark lost</button></div></article>; })}</div></>;
}

function Scripts({ settings, copy }: { settings: Settings; copy: (text: string) => void }) {
  const items = [...stages, "Too expensive objection", "Getting other quotes objection", "Still thinking objection", "Waiting on spouse/partner", "Insurance delay", "Old estimate win-back", "Voicemail script"];
  return <><Header title="Script Library" text="Reusable contractor follow-up scripts." /><section className="script-grid">{items.map((title) => { const template = settings.templates[title] || defaultTemplates[title]; const text = fill(template, { customerName: "Customer", jobType: "project" } as Estimate, settings); return <article className="card script-card" key={title}><span className="badge">Script</span><h3>{title}</h3><div className="script-box">{text}</div><button className="button small section" onClick={() => copy(text)}>Copy</button></article>; })}</section></>;
}

function SettingsView({ settings, setSettings, applyTemplates }: { settings: Settings; setSettings: (value: Settings | ((current: Settings) => Settings)) => void; applyTemplates: () => void }) {
  return <><Header title="Settings" text="Customize BidBack for your business and follow-up style." actions={<button className="button primary" onClick={applyTemplates}>Apply scripts to open follow-ups</button>} /><section className="card form-grid"><label className="field"><span>Company name</span><input value={settings.companyName} onChange={(event) => setSettings((current) => ({ ...current, companyName: event.target.value }))} /></label><label className="field"><span>Contractor name</span><input value={settings.contractorName} onChange={(event) => setSettings((current) => ({ ...current, contractorName: event.target.value }))} /></label><label className="field"><span>Phone</span><input value={settings.phone} onChange={(event) => setSettings((current) => ({ ...current, phone: event.target.value }))} /></label><label className="field"><span>Email</span><input value={settings.email} onChange={(event) => setSettings((current) => ({ ...current, email: event.target.value }))} /></label><label className="field"><span>Default trade</span><select value={settings.defaultTrade} onChange={(event) => setSettings((current) => ({ ...current, defaultTrade: event.target.value }))}>{trades.map((trade) => <option key={trade}>{trade}</option>)}</select></label><label className="field"><span>Follow-up schedule days</span><input value={settings.schedule} onChange={(event) => setSettings((current) => ({ ...current, schedule: event.target.value }))} /></label></section><section className="script-grid section">{stages.map((name) => <label className="card script-card" key={name}><span>{name} message</span><textarea value={settings.templates[name] || ""} onChange={(event) => setSettings((current) => ({ ...current, templates: { ...current.templates, [name]: event.target.value } }))} /></label>)}</section></>;
}

function TesterModal({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop"><form className="card tester-modal" onSubmit={onSubmit}><div className="brand"><div className="brand-mark">BB</div><div><h1>BidBack</h1><p>Stop losing jobs after the estimate.</p></div></div><h2>Start testing</h2><p className="muted">Enter your business info once, then use the app right away.</p><label className="field"><span>Your name</span><input name="name" required autoFocus /></label><label className="field"><span>Company name</span><input name="companyName" required /></label><label className="field"><span>Email</span><input name="email" type="email" required /></label><label className="field"><span>Phone</span><input name="phone" type="tel" required /></label><label className="field"><span>Main trade</span><select name="defaultTrade">{trades.map((trade) => <option key={trade}>{trade}</option>)}</select></label><button className="button primary tester-start">Open BidBack</button></form></div>;
}

function FeedbackModal({ tester, onClose, onSend }: { tester: Tester | null; onClose: () => void; onSend: (comments: string) => void }) {
  const [comments, setComments] = useState("");
  return <div className="modal-backdrop"><form className="card tester-modal" onSubmit={(event) => { event.preventDefault(); onSend(comments); }}><h2>Send feedback</h2><p className="muted">Tell Lance what happened. BidBack also includes your test summary.</p>{tester && <div className="script-box summary-box"><strong>{tester.name}</strong><br />{tester.email}<br />{tester.phone}</div>}<label className="field"><span>Comments</span><textarea value={comments} onChange={(event) => setComments(event.target.value)} autoFocus /></label><div className="actions section"><button className="button primary">Send feedback</button><button className="button" type="button" onClick={onClose}>Cancel</button></div></form></div>;
}

function Header({ title, text, actions }: { title: string; text: string; actions?: ReactNode }) {
  return <header className="topbar"><div><h2>{title}</h2><p>{text}</p></div>{actions && <div className="actions">{actions}</div>}</header>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="card metric-card"><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div>;
}
