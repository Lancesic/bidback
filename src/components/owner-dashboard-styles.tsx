export function OwnerDashboardStyles() {
  return (
    <style>{`
      .owner-shell{min-height:100vh;padding:28px;background:linear-gradient(180deg,rgba(31,107,79,.08),transparent 320px),var(--background)}
      .owner-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin:0 auto 20px;max-width:1220px}
      .owner-eyebrow{margin:0 0 6px;color:var(--primary);font-weight:850;text-transform:uppercase;letter-spacing:.08em;font-size:.78rem}
      .owner-hero h1{margin:0;font-size:clamp(2rem,5vw,3.8rem);line-height:.98}.owner-hero p{margin:10px 0 0;color:var(--muted)}
      .owner-key-form{display:flex;gap:10px;min-width:min(100%,440px)}.owner-key-form input{min-height:46px}
      .owner-key-form button,.owner-toolbar button,.owner-detail-head a{border:1px solid var(--primary);border-radius:8px;background:var(--primary);color:#fff;padding:10px 14px;font-weight:800;text-decoration:none}
      .owner-alert{max-width:1220px;margin:0 auto 18px;border:1px solid #f0c9c4;border-radius:8px;background:#fff6f4;color:var(--danger);padding:14px;font-weight:750}
      .owner-metrics{max-width:1220px;margin:0 auto 16px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
      .owner-metrics div,.owner-summary-grid div{border:1px solid var(--border);border-radius:8px;background:var(--panel);padding:14px}
      .owner-metrics span,.owner-summary-grid span{display:block;color:var(--muted);font-size:.78rem;font-weight:800}.owner-metrics strong,.owner-summary-grid strong{display:block;margin-top:7px;font-size:1.45rem}
      .owner-toolbar{max-width:1220px;margin:0 auto 16px;display:flex;gap:10px;justify-content:flex-end}.owner-toolbar button{background:var(--panel);border-color:var(--border);color:var(--foreground)}
      .owner-layout{max-width:1220px;margin:0 auto;display:grid;grid-template-columns:360px minmax(0,1fr);gap:14px}.owner-panel{border:1px solid var(--border);border-radius:8px;background:rgba(255,255,255,.86);padding:16px;box-shadow:0 12px 30px rgba(23,33,27,.06)}
      .owner-panel h2,.owner-panel h3{margin:0 0 12px}.owner-list{display:grid;gap:8px;max-height:70vh;overflow:auto}.owner-list button{display:grid;gap:3px;border:1px solid var(--border);border-radius:8px;background:#fff;color:var(--foreground);padding:12px;text-align:left}.owner-list button.active{border-color:var(--primary);box-shadow:inset 4px 0 0 var(--primary)}
      .owner-list span,.owner-list small,.owner-muted{color:var(--muted)}.owner-detail-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:14px}.owner-detail-head h2{margin:0}.owner-detail-head p{margin:3px 0;color:var(--muted)}
      .owner-summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:18px}.owner-feedback-list{display:grid;gap:10px;margin-bottom:18px}.owner-feedback-list article{border:1px solid var(--border);border-radius:8px;background:#fff;padding:12px}.owner-feedback-list time{color:var(--muted);font-size:.78rem;font-weight:800}.owner-feedback-list p{margin:7px 0 0}
      .owner-detail pre{max-height:360px;overflow:auto;border:1px solid var(--border);border-radius:8px;background:#101612;color:#eaf2ed;padding:14px;font-size:.78rem;white-space:pre-wrap}
      @media(max-width:820px){.owner-shell{padding:14px}.owner-hero,.owner-key-form,.owner-detail-head{display:grid}.owner-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.owner-layout{grid-template-columns:1fr}.owner-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.owner-list{max-height:none}}
      @media(max-width:430px){.owner-metrics,.owner-summary-grid{grid-template-columns:1fr}}
    `}</style>
  );
}
