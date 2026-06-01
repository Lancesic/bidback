export function BidBackPolish() {
  return (
    <style>{`
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
      @media (max-width: 520px) {
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
      }
    `}</style>
  );
}
