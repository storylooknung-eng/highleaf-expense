// ============ app.jsx — shell, nav, auth, central state ============
const NAV = [
  { k: "dashboard", label: "ภาพรวม", icon: I.grid },
  { k: "create",    label: "สร้างรายการเบิก", icon: I.receipt },
  { k: "records",   label: "รายการทั้งหมด", icon: I.list },
  { k: "approvals", label: "อนุมัติรายการ", icon: I.check2, badgeKey: "pending" },
  { k: "settings",  label: "ตั้งค่า", icon: I.gear },
];
const TITLES = {
  dashboard: ["ภาพรวมระบบเบิกเงิน",   "สรุปยอดและแนวโน้มค่าใช้จ่าย"],
  create:    ["สร้างรายการเบิกเงิน",   "กรอกข้อมูลและแนบหลักฐานการจ่าย"],
  records:   ["รายการเบิกทั้งหมด",     "ค้นหา กรอง และตรวจสอบรายการ"],
  approvals: ["อนุมัติรายการ",         "ตรวจสอบและอนุมัติคำขอเบิก"],
  settings:  ["ตั้งค่าระบบ",           "จัดการผู้ใช้งานและนโยบายบริษัท"],
};
const ROLE_LABEL = { admin: "ผู้ดูแลระบบ", approver: "ผู้อนุมัติ", staff: "พนักงาน" };

function LoadingScreen({ msg = "กำลังโหลดข้อมูล…", sub = "เชื่อมต่อ Supabase" }) {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh", background: "var(--bg)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 52, height: 52,
          border: "3px solid var(--brand-100)", borderTopColor: "var(--brand)",
          borderRadius: "50%", margin: "0 auto 18px", animation: "spin .75s linear infinite",
        }}></div>
        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{msg}</div>
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>{sub}</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function App() {
  // ─── Auth state ───
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── App state ───
  const [route, setRoute]   = useState("dashboard");
  const [period, setPeriod] = useState("month");
  const [records, setRecords] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const canManage = isManager(profile);
  const pendingCount = records.filter(r => r.status === "pending").length;
  const visibleNav = NAV.filter(n => {
    if (n.k === "approvals") return canManage;
    if (n.k === "settings") return profile?.role === "admin";
    return true;
  });

  // ─── Auth listener ───
  useEffect(() => {
    // ตรวจ session ที่มีอยู่ก่อน
    window.db.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user);
      } else {
        setAuthLoading(false);
      }
    });

    // ฟัง auth state change (login / logout)
    const { data: { subscription } } = window.db.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setRecords([]);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async authUser => {
    const uid = authUser?.id;
    const { data, error } = await window.db.from("user_profiles").select("*").eq("id", uid).maybeSingle();
    if (error) console.error("[Profile]", error.message);
    if (data && data.active === false) {
      await window.db.auth.signOut();
      setAuthLoading(false);
      return;
    }
    if (!data && uid) {
      const fallbackName =
        authUser?.user_metadata?.full_name ||
        authUser?.user_metadata?.name ||
        authUser?.email?.split("@")?.[0] ||
        "ผู้ใช้งาน";
      const payload = {
        id: uid,
        email: authUser?.email || "",
        name: fallbackName,
        dept: "",
        role: "staff",
        active: true,
      };
      const { data: created, error: createErr } = await window.db
        .from("user_profiles")
        .insert(payload)
        .select("*")
        .single();
      if (createErr) {
        console.error("[Profile create]", createErr.message);
        setProfile(payload);
      } else {
        setProfile(created);
      }
      setAuthLoading(false);
      return;
    }
    setProfile(data || null);
    setAuthLoading(false);
  };

  // ─── โหลด expenses เมื่อ login แล้ว ───
  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    let q = window.db.from("expenses")
      .select("*")
      .order("created_at", { ascending: false });
    q
      .then(({ data, error }) => {
        if (error) console.error("[Supabase]", error.message);
        setRecords(data || []);
        setDataLoading(false);
      });
  }, [user]);

  const go = r => { setRoute(r); setNavOpen(false); window.scrollTo({ top: 0 }); };

  const logout = async () => {
    await window.db.auth.signOut();
    // auth state change จะ reset state ให้เอง
  };

  // ─── CRUD ───
  const addRecord = async rec => {
    const { data, error } = await window.db.from("expenses").insert(rec).select().single();
    if (!error && data) setRecords(rs => [data, ...rs]);
    return { error };
  };

  const actOn = async (id, decision) => {
    const updates = { status: decision, approved_by_id: profile?.id || null, approved_by: profile?.name || null, approved_at: new Date().toISOString() };
    const { error } = await window.db.from("expenses").update(updates).eq("id", id);
    if (!error) setRecords(rs => rs.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const editRecord = async (id, updates) => {
    const { error } = await window.db.from("expenses").update(updates).eq("id", id);
    if (!error) setRecords(rs => rs.map(r => r.id === id ? { ...r, ...updates } : r));
    return { error };
  };

  // ─── Render guards ───
  if (authLoading) return <LoadingScreen msg="กำลังตรวจสอบสิทธิ์…" sub="Supabase Auth" />;
  if (!user)       return <AuthPage />;
  if (dataLoading) return <LoadingScreen />;

  const [t1, t2] = TITLES[route];
  const av = (profile?.name || "?").replace(/^(นาย|นางสาว|นาง|คุณ)\s*/, "").trim().charAt(0);
  const roleLabel = ROLE_LABEL[profile?.role] || "พนักงาน";

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
          {visibleNav.map(n => (
            <button key={n.k} className={"nav-item" + (route === n.k ? " active" : "")} onClick={() => go(n.k)}>
              <n.icon /><span>{n.label}</span>
              {n.badgeKey === "pending" && pendingCount > 0 && <span className="badge-n">{pendingCount}</span>}
            </button>
          ))}
        </nav>

        <div className="sb-user">
          <span className="av">{av}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="nm">{profile?.name || user.email}</div>
            <div className="rl">{roleLabel}{profile?.dept ? " · " + profile.dept : ""}</div>
          </div>
          <button className="icon-btn" style={{ color: "rgba(255,255,255,.7)" }}
            title="ออกจากระบบ" onClick={logout}><I.logout /></button>
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
          {route === "create"    && <ExpenseForm onSubmit={addRecord} goList={() => go("records")} profile={profile} />}
          {route === "records"   && <RecordsTable records={records} goCreate={() => go("create")} onEdit={editRecord} profile={profile} />}
          {route === "approvals" && canManage && <Approvals records={records} onAct={actOn} />}
          {route === "settings"  && profile?.role === "admin" && <Settings profile={profile} />}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ToastProvider><App /></ToastProvider>
);
