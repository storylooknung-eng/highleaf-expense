// ============ app.jsx — shell, nav, central state (Supabase) ============
const NAV = [
  { k: "dashboard", label: "ภาพรวม", icon: I.grid },
  { k: "create",    label: "สร้างรายการเบิก", icon: I.receipt },
  { k: "records",   label: "รายการทั้งหมด", icon: I.list },
  { k: "approvals", label: "อนุมัติรายการ", icon: I.check2, badgeKey: "pending" },
  { k: "settings",  label: "ตั้งค่า", icon: I.gear },
];
const TITLES = {
  dashboard: ["ภาพรวมระบบเบิกเงิน", "สรุปยอดและแนวโน้มค่าใช้จ่าย"],
  create:    ["สร้างรายการเบิกเงิน", "กรอกข้อมูลและแนบหลักฐานการจ่าย"],
  records:   ["รายการเบิกทั้งหมด", "ค้นหา กรอง และตรวจสอบรายการ"],
  approvals: ["อนุมัติรายการ", "ตรวจสอบและอนุมัติคำขอเบิก"],
  settings:  ["ตั้งค่าระบบ", "จัดการผู้ใช้งานและนโยบายบริษัท"],
};

function LoadingScreen() {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh", background: "var(--bg)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 52, height: 52,
          border: "3px solid var(--brand-100)", borderTopColor: "var(--brand)",
          borderRadius: "50%", margin: "0 auto 18px",
          animation: "spin .75s linear infinite"
        }}></div>
        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>กำลังโหลดข้อมูล…</div>
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>เชื่อมต่อ Supabase</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function App() {
  const [route, setRoute] = useState("dashboard");
  const [period, setPeriod] = useState("month");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const pendingCount = records.filter(r => r.status === "pending").length;

  useEffect(() => {
    window.db.from("expenses")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("[Supabase]", error.message);
        setRecords(data || []);
        setLoading(false);
      });
  }, []);

  const go = r => { setRoute(r); setNavOpen(false); window.scrollTo({ top: 0 }); };

  const addRecord = async rec => {
    const { data, error } = await window.db.from("expenses").insert(rec).select().single();
    if (!error && data) setRecords(rs => [data, ...rs]);
    return { error };
  };

  const actOn = async (id, decision) => {
    const { error } = await window.db.from("expenses").update({ status: decision }).eq("id", id);
    if (!error) setRecords(rs => rs.map(r => r.id === id ? { ...r, status: decision } : r));
  };

  if (loading) return <LoadingScreen />;

  const [t1, t2] = TITLES[route];

  return (
    <div className={"app" + (navOpen ? " nav-open" : "")}>
      <div className="scrim" onClick={() => setNavOpen(false)}></div>

      <aside className="sidebar">
        <img src="assets/logo-mark.png" className="sb-leaf" alt="" />
        <div className="sb-brand">
          <span className="mark"><img src="assets/logo-mark.png" alt="HIGHLEAF" /></span>
          <div><div className="name">ไฮลีฟ โกบอล</div><div className="sub">HIGHLEAF GLOBAL</div></div>
        </div>

        <div className="nav-label">เมนูหลัก</div>
        <nav>
          {NAV.map(n => (
            <button key={n.k} className={"nav-item" + (route === n.k ? " active" : "")} onClick={() => go(n.k)}>
              <n.icon /><span>{n.label}</span>
              {n.badgeKey === "pending" && pendingCount > 0 && <span className="badge-n">{pendingCount}</span>}
            </button>
          ))}
        </nav>

        <div className="sb-user">
          <span className="av">ป</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="nm">ปวีณา รัตนชัย</div>
            <div className="rl">ผู้ดูแลระบบ · การเงิน</div>
          </div>
          <button className="icon-btn" style={{ color: "rgba(255,255,255,.7)" }} title="ออกจากระบบ"><I.logout /></button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="tb-icon mobile-top" onClick={() => setNavOpen(true)}><I.menu /></button>
          <div className="tb-title">
            <h1>{t1}</h1>
            <p className="hide-sm">{t2}</p>
          </div>
          <div className="tb-search">
            <I.search />
            <input placeholder="ค้นหารายการ…" onFocus={() => route !== "records" && go("records")} />
          </div>
          <button className="tb-icon" title="การแจ้งเตือน"><I.bell /><span className="dot"></span></button>
          <button className="tb-icon hide-sm" onClick={() => go("settings")} title="ตั้งค่า"><I.gear /></button>
        </header>

        <div className="content">
          {route === "dashboard" && <Dashboard records={records} period={period} setPeriod={setPeriod} goCreate={() => go("create")} />}
          {route === "create" && <ExpenseForm onSubmit={addRecord} goList={() => go("records")} />}
          {route === "records" && <RecordsTable records={records} goCreate={() => go("create")} />}
          {route === "approvals" && <Approvals records={records} onAct={actOn} />}
          {route === "settings" && <Settings />}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ToastProvider><App /></ToastProvider>
);
