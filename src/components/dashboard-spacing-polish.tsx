export function DashboardSpacingPolish() {
  return (
    <style>{`
      .card.section:has(.dashboard-hot-row) {
        padding: 16px;
      }
      .card.section:has(.dashboard-hot-row) > h3 {
        margin: 0 0 14px !important;
      }
      .card.section:has(.dashboard-hot-row) > h3::before {
        line-height: 1.15;
      }
      .card.section:has(.dashboard-hot-row) > h3::after {
        margin-top: 7px !important;
        line-height: 1.35;
      }
      .card.section:has(.dashboard-hot-row) .panel-list {
        padding: 0;
        gap: 12px;
      }
      .dashboard-hot-row {
        align-items: start;
        gap: 10px 14px;
        padding: 16px;
      }
      .dashboard-hot-row > div {
        display: grid;
        gap: 5px;
      }
      .dashboard-hot-row > div strong {
        font-size: 1.05rem;
        line-height: 1.15;
      }
      .dashboard-hot-row > div p {
        margin: 0;
        line-height: 1.3;
      }
      .dashboard-hot-row > strong {
        align-self: center;
        font-size: 1.02rem;
      }
      .dashboard-open-button {
        justify-self: stretch;
        margin-top: 4px;
        min-height: 46px;
      }
      @media (max-width: 520px) {
        .card.section:has(.dashboard-hot-row) {
          padding: 14px;
        }
        .dashboard-hot-row {
          padding: 14px;
        }
      }
    `}</style>
  );
}
