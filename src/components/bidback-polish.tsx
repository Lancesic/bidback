export function BidBackPolish() {
  return (
    <style>{`
      .topbar:has(+ .snapshot) {
        margin-bottom: 14px;
      }
      .topbar:has(+ .snapshot) h2::after {
        content: "Money is sitting in unsold estimates.";
        display: block;
        margin-top: 6px;
        color: var(--muted);
        font-size: .98rem;
        font-weight: 500;
      }
      .snapshot {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .snapshot .metric-card:nth-child(2) {
        grid-column: 1 / -1;
        border-color: rgba(31,107,79,.32);
        background: linear-gradient(135deg, rgba(31,107,79,.12), #fff 58%);
        padding: 20px;
      }
      .snapshot .metric-card:nth-child(2) .metric-label {
        font-size: .9rem;
        color: var(--primary-dark);
        font-weight: 900;
      }
      .snapshot .metric-card:nth-child(2) .metric-label::before {
        content: "Money Waiting on Follow-Up";
        font-size: 1rem;
      }
      .snapshot .metric-card:nth-child(2) .metric-label {
        font-size: 0;
      }
      .snapshot .metric-card:nth-child(2) .metric-value {
        font-size: clamp(2.25rem, 7vw, 4.2rem);
        letter-spacing: 0;
        line-height: .95;
      }
      .snapshot .metric-card:nth-child(4) {
        border-color: rgba(163,61,53,.32);
        background: #fff8f7;
      }
      .snapshot .metric-card:nth-child(4) .metric-label {
        font-size: 0;
        color: var(--danger);
        font-weight: 900;
      }
      .snapshot .metric-card:nth-child(4) .metric-label::before {
        content: "Money Already Lost";
        font-size: .9rem;
      }
      .snapshot .metric-card:nth-child(4) .metric-value {
        color: var(--danger);
      }
      .snapshot .metric-card:nth-child(1) .metric-label { font-size: 0; }
      .snapshot .metric-card:nth-child(1) .metric-label::before { content: "Follow-ups Needing Action"; font-size: .83rem; }
      .snapshot .metric-card:nth-child(3) .metric-label { font-size: 0; }
      .snapshot .metric-card:nth-child(3) .metric-label::before { content: "Revenue Won Back"; font-size: .83rem; }
      .estimate-card > p:not(.muted),
      .follow-card .stage-actions + p.muted {
        margin: 12px 0 0;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: #fbfcfa;
        padding: 10px 12px;
        color: var(--foreground);
        line-height: 1.4;
      }
      .estimate-card > p:not(.muted)::before,
      .follow-card .stage-actions + p.muted::before {
        content: "Notes";
        display: block;
        margin-bottom: 4px;
        color: var(--muted);
        font-size: .76rem;
        font-weight: 800;
      }
      .estimate-card .actions {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border);
      }
      .follow-card {
        padding: 16px;
      }
      .follow-card .follow-head {
        margin-bottom: 8px;
      }
      .follow-card > p:first-of-type {
        margin: 0 0 10px;
      }
      .follow-card .action-grid {
        margin: 8px 0 12px;
      }
      .follow-card h4 {
        margin: 10px 0 8px;
        color: var(--muted);
        font-size: .82rem;
        font-weight: 850;
      }
      .follow-card .script-box {
        min-height: 112px;
        padding: 12px 14px;
        line-height: 1.45;
      }
      .follow-card .stage-actions {
        margin-top: 12px;
      }
      .follow-card .actions {
        margin-top: 10px;
        padding-top: 0;
        border-top: 0;
      }
      .script-card {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .script-card .badge {
        align-self: flex-start;
      }
      .script-card h3 {
        margin: 0;
        color: var(--foreground);
        font-size: 1.08rem;
        font-weight: 850;
        line-height: 1.2;
      }
      .script-card .script-box {
        margin: 0;
        min-height: 120px;
        padding: 14px;
        line-height: 1.45;
      }
      .script-card .button {
        align-self: flex-start;
        margin-top: 8px;
      }
      @media (max-width: 520px) {
        .snapshot {
          grid-template-columns: 1fr;
        }
        .snapshot .metric-card:nth-child(2) {
          padding: 18px;
        }
        .estimate-card > p:not(.muted),
        .follow-card .stage-actions + p.muted {
          font-size: .95rem;
        }
        .estimate-card .actions .button,
        .follow-card .actions .button {
          flex: 1 1 auto;
        }
        .follow-card .action-grid,
        .follow-card .stage-actions {
          gap: 8px;
        }
        .script-card h3 {
          font-size: 1.05rem;
        }
      }
    `}</style>
  );
}
