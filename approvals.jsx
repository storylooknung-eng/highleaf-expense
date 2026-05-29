// ============ approvals.jsx — Approve / Reject queue ============
function ApproveCard({ rec, onAct, index }) {
  const [exiting, setExiting] = useState(null); // 'approved' | 'rejected'
  const act = decision => {
    setExiting(decision);
    setTimeout(() => onAct(rec.id, decision), 360);
  };
  const Icon = CATS[rec.cat].icon;
  return (
    <div className="card" style={{
      overflow: "hidden", animation: `cardUp .5s ${index * 60}ms both`,
      transition: "transform .36s cubic-bezier(.4,0,.2,1), opacity .36s",
      transform: exiting === "approved" ? "translateX(40px)" : exiting === "rejected" ? "translateX(-40px)" : "none",
      opacity: exiting ? 0 : 1,
      boxShadow: exiting === "approved" ? "0 0 0 2px var(--green)" : exiting === "rejected" ? "0 0 0 2px var(--red)" : undefined,
    }}>
      <div className="flex" style={{ gap: 0 }}>
        {/* slip */}
        <div style={{ width: 96, flex: "none", background: "var(--surface-2)", borderRight: "1px solid var(--line)", cursor: "pointer" }}>
          <ReceiptSVG hue={rec.hue} className="rcpt" />
        </div>
        {/* body */}
        <div style={{ flex: 1, minWidth: 0, padding: "16px 18px" }}>
          <div className="flex items-center gap-12" style={{ marginBottom: 12 }}>
            <Avatar name={rec.person} size={38} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{rec.person}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{rec.dept} · {rec.id}</div>
            </div>
            <div className="ml-auto" style={{ textAlign: "right" }}>
              <div className="num amount" style={{ fontSize: 22, color: "var(--brand)" }}>{THB(rec.amount)}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{thDate(rec.date, true)}</div>
            </div>
          </div>
          <div className="flex items-center wrap gap-8" style={{ marginBottom: 14 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500,
              padding: "4px 11px", borderRadius: 9, background: CATS[rec.cat].color + "14", color: CATS[rec.cat].color }}>
              <Icon style={{ width: 15, height: 15 }} />{CATS[rec.cat].name}
            </span>
            <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{rec.note}</span>
          </div>
          <div className="flex gap-8">
            <button className="btn-primary" style={{ flex: 1, justifyContent: "center", height: 42 }} onClick={() => act("approved")}>
              <I.check />อนุมัติ
            </button>
            <button onClick={() => act("rejected")} style={{
              flex: 1, justifyContent: "center", height: 42, borderRadius: 13, fontWeight: 600, fontSize: 14,
              display: "inline-flex", alignItems: "center", gap: 8, background: "var(--red-bg)", color: "var(--red)",
              transition: ".2s", border: "1px solid transparent",
            }} onMouseDown={e => e.currentTarget.style.transform = "scale(.98)"}
              onMouseUp={e => e.currentTarget.style.transform = "none"}>
              <I.x />ไม่อนุมัติ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Approvals({ records, onAct }) {
  const toast = useToast();
  const pending = records.filter(r => r.status === "pending");
  const totalPending = pending.reduce((s, r) => s + r.amount, 0);

  const handle = (id, decision) => {
    onAct(id, decision);
    toast(decision === "approved" ? "อนุมัติรายการเรียบร้อย" : "ปฏิเสธรายการแล้ว", decision === "approved" ? "ok" : "warn");
  };

  const recent = records.filter(r => r.status !== "pending").slice(0, 5);

  return (
    <div className="page">
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 18 }} className="appr-grid">
        <div>
          <div className="flex items-center" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>รอการอนุมัติ</h2>
            <span className="badge b-amber" style={{ marginLeft: 10 }}><span className="bd"></span>{pending.length} รายการ</span>
          </div>
          {pending.length === 0 ? (
            <div className="card empty">
              <div className="ei" style={{ background: "var(--green-bg)", color: "var(--green)" }}><I.check2 /></div>
              <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 15 }}>ไม่มีรายการค้างอนุมัติ</div>
              <div style={{ fontSize: 13.5, marginTop: 4 }}>ทุกรายการได้รับการตรวจสอบเรียบร้อยแล้ว 🎉</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))", gap: 16 }}>
              {pending.map((r, i) => <ApproveCard key={r.id} rec={r} onAct={handle} index={i} />)}
            </div>
          )}
        </div>

        {/* side summary */}
        <div className="col gap-16">
          <div className="card card-pad" style={{ background: "var(--leaf-grad)", color: "#fff", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -30, top: -30, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,.08)" }}></div>
            <div style={{ fontSize: 13.5, opacity: .82 }}>มูลค่ารออนุมัติ</div>
            <div className="num" style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>{THB(totalPending)}</div>
            <div style={{ fontSize: 13, opacity: .82, marginTop: 2 }}>{pending.length} รายการ</div>
          </div>
          <div className="card card-pad">
            <div className="section-head"><h2 style={{ fontSize: 15.5 }}>ตรวจสอบล่าสุด</h2></div>
            <div className="col" style={{ gap: 14 }}>
              {recent.length === 0 && <div style={{ fontSize: 13, color: "var(--ink-3)" }}>ยังไม่มีประวัติ</div>}
              {recent.map(r => (
                <div className="flex items-center gap-12" key={r.id}>
                  <Avatar name={r.person} size={32} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.person}</div>
                    <div className="num" style={{ fontSize: 12, color: "var(--ink-3)" }}>{THB(r.amount)}</div>
                  </div>
                  <Badge status={r.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:880px){.appr-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

Object.assign(window, { Approvals });
