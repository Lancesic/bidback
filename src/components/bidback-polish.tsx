export function BidBackPolish() {
  return (
    <style>{`
      .estimate-card > p:not(.muted) {
        margin: 12px 0 0;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: #fbfcfa;
        padding: 10px 12px;
        color: var(--foreground);
        line-height: 1.4;
      }
      .estimate-card > p:not(.muted)::before {
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
      @media (max-width: 520px) {
        .estimate-card > p:not(.muted) {
          font-size: .95rem;
        }
        .estimate-card .actions .button {
          flex: 1 1 auto;
        }
      }
    `}</style>
  );
}
