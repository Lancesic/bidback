export function ControlRoomPolish() {
  return (
    <style>{`
      .topbar:has(+ .panel-list.card.section) {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
      }
      .topbar:has(+ .panel-list.card.section) h2::after {
        content: "Daily action queue";
        display: inline-flex;
        margin-left: 10px;
        border-radius: 999px;
        background: #e7f0eb;
        color: var(--primary-dark);
        padding: 5px 10px;
        vertical-align: middle;
        font-size: .78rem;
        font-weight: 900;
      }
      .topbar:has(+ .panel-list.card.section) p {
        font-size: 1rem;
        color: var(--foreground);
        font-weight: 650;
      }
      .topbar:has(+ .panel-list.card.section) p::after {
        content: " Start with overdue. Copy the script. Mark the stage sent.";
        color: var(--muted);
        font-weight: 500;
      }
      .topbar:has(+ .panel-list.card.section) .actions select {
        min-height: 46px;
        border-color: rgba(31,107,79,.32);
        font-weight: 800;
      }
      .panel-list.card.section:has(.follow-card) {
        padding: 10px;
        gap: 10px;
        border: 0;
        background: transparent;
        box-shadow: none;
      }
      .follow-card {
        position: relative;
        overflow: hidden;
        border-color: rgba(31,107,79,.2);
      }
      .follow-card::before {
        content: "Next action";
        display: block;
        margin: -2px 0 10px;
        color: var(--primary-dark);
        font-size: .76rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      .follow-card:has(p .muted)::after {
        content: "";
        position: absolute;
        inset: 0 auto 0 0;
        width: 5px;
        background: var(--primary);
      }
      .follow-card:has(p .muted) .badge.pending {
        font-weight: 950;
      }
      .follow-card .follow-head h3 {
        font-size: 1.3rem;
      }
      .follow-card .follow-head strong {
        font-size: 1.15rem;
      }
      .follow-card .action-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .follow-card .action-grid .button {
        min-height: 48px;
        font-size: 1rem;
        font-weight: 900;
      }
      .follow-card .action-grid .button:nth-child(2) {
        border-color: var(--primary);
        background: var(--primary);
        color: #fff;
      }
      .follow-card h4::after {
        content: " ready to copy/paste";
        color: var(--muted);
        font-weight: 600;
      }
      .follow-card .stage-actions {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .follow-card .stage-actions .primary {
        grid-column: 1 / -1;
        min-height: 48px;
        font-size: 1rem;
      }
      @media (max-width: 520px) {
        .topbar:has(+ .panel-list.card.section) h2::after {
          display: flex;
          width: max-content;
          margin: 8px 0 0;
        }
        .panel-list.card.section:has(.follow-card) {
          padding: 0;
        }
        .follow-card .action-grid,
        .follow-card .stage-actions {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .follow-card .action-grid .button,
        .follow-card .stage-actions .button {
          padding-left: 6px;
          padding-right: 6px;
        }
      }
    `}</style>
  );
}
