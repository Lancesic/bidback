export function SettingsPolish() {
  return (
    <style>{`
      .topbar:has(+ .form-grid + .script-grid) h2::after {
        content: "Make BidBack sound like your business.";
        display: block;
        margin-top: 6px;
        color: var(--muted);
        font-size: .98rem;
        font-weight: 500;
      }
      .topbar:has(+ .form-grid + .script-grid) .button.primary {
        font-size: 0;
      }
      .topbar:has(+ .form-grid + .script-grid) .button.primary::before {
        content: "Update open follow-ups";
        font-size: .95rem;
      }
      .topbar:has(+ .form-grid + .script-grid) + .form-grid {
        position: relative;
        padding-top: 62px;
      }
      .topbar:has(+ .form-grid + .script-grid) + .form-grid::before {
        content: "Business identity";
        position: absolute;
        top: 18px;
        left: 18px;
        color: var(--primary-dark);
        font-size: .8rem;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .topbar:has(+ .form-grid + .script-grid) + .form-grid::after {
        content: "These details can be used inside scripts with {contractor}, {company}, and {phone}.";
        grid-column: 1 / -1;
        border: 1px solid rgba(31,107,79,.2);
        border-radius: 8px;
        background: #f3faf6;
        color: var(--primary-dark);
        padding: 12px;
        font-size: .9rem;
        font-weight: 750;
      }
      .topbar:has(+ .form-grid + .script-grid) + .form-grid label:nth-of-type(5)::before {
        content: "Follow-up schedule";
        display: block;
        margin: 2px 0 4px;
        color: var(--primary-dark);
        font-size: .8rem;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .topbar:has(+ .form-grid + .script-grid) + .form-grid label:nth-of-type(6) input {
        font-weight: 800;
      }
      .topbar:has(+ .form-grid + .script-grid) + .form-grid label:nth-of-type(6)::after {
        content: "Use comma-separated days, like 1, 3, 7, 14, 30.";
        color: var(--muted);
        font-size: .78rem;
        font-weight: 600;
      }
      .topbar:has(+ .form-grid + .script-grid) + .form-grid + .script-grid {
        position: relative;
        padding-top: 64px;
      }
      .topbar:has(+ .form-grid + .script-grid) + .form-grid + .script-grid::before {
        content: "Message templates";
        position: absolute;
        top: 18px;
        left: 18px;
        color: var(--primary-dark);
        font-size: .8rem;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .topbar:has(+ .form-grid + .script-grid) + .form-grid + .script-grid::after {
        content: "Use {customer}, {job}, {contractor}, {company}, and {phone}.";
        position: absolute;
        top: 38px;
        left: 18px;
        right: 18px;
        color: var(--muted);
        font-size: .86rem;
        font-weight: 650;
      }
      .topbar:has(+ .form-grid + .script-grid) + .form-grid + .script-grid .script-card {
        padding: 14px;
      }
      .topbar:has(+ .form-grid + .script-grid) + .form-grid + .script-grid .script-card > span {
        color: var(--foreground);
        font-size: 1rem;
        font-weight: 900;
      }
      .topbar:has(+ .form-grid + .script-grid) + .form-grid + .script-grid textarea {
        min-height: 150px;
        line-height: 1.45;
      }
      @media (max-width: 520px) {
        .topbar:has(+ .form-grid + .script-grid) + .form-grid,
        .topbar:has(+ .form-grid + .script-grid) + .form-grid + .script-grid {
          padding-top: 58px;
        }
        .topbar:has(+ .form-grid + .script-grid) .button.primary {
          width: 100%;
        }
      }
    `}</style>
  );
}
