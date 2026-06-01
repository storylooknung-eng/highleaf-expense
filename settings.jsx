// ============ settings.jsx — users & company settings ============
const ROLES = {
  admin:    { th: "ผู้ดูแลระบบ", cls: "b-green" },
  approver: { th: "ผู้อนุมัติ",   cls: "b-amber" },
  staff:    { th: "พนักงาน",      cls: "b-red" },
};
function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 46, height: 27, borderRadius: 20, background: on ? "var(--brand)" : "var(--line)",
      position: "relative", transition: ".22s", flex: "none",
    }}>
      <span style={{
        position: "absolute", top: 3, left: on ? 22 : 3, width: 21, height: 21, borderRadius: "50%",
        background: "#fff", transition: ".22s cubic-bezier(.4,0,.2,1)", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
      }}></span>
    </button>
  );
}

function InviteModal({ onClose }) {
  const url = window.location.origin + window.location.pathname;
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>เชิญผู้ใช้งานใหม่</div>
          <button className="icon-btn ml-auto" onClick={onClose}><I.x /></button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ background: "var(--brand-50)", borderRadius: 14, padding: 18, marginBottom: 20, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 8 }}>แชร์ลิงค์นี้ให้พนักงานสมัครสมาชิกด้วยตัวเอง</div>
            <div className="num" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--brand)", wordBreak: "break-all" }}>{url}</div>
          </div>
          <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginBottom: 20, lineHeight: 1.7 }}>
            <b>ขั้นตอน:</b><br />
            1. ส่ง URL ด้านบนให้พนักงาน<br />
            2. พนักงานกด <b>สมัครสมาชิก</b> กรอกชื่อ แผนก และรหัสผ่าน<br />
            3. หลังสมัครแล้วจะปรากฏในตาราง — admin เปลี่ยนสิทธิ์ได้
          </div>
          <div className="flex gap-12">
            <button className="btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={copy}>
              {copied ? <><I.check />คัดลอกแล้ว!</> : <><I.upload style={{ transform: "rotate(90deg)" }} />คัดลอก URL</>}
            </button>
            <button className="btn-ghost" onClick={onClose}>ปิด</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Settings({ profile, appSettings, setAppSettings }) {
  const toast = useToast();
  const [tab, setTab] = useState("users");
  const [toggles, setTogglesRaw] = useState({
    autoApprove:  appSettings?.autoApprove  ?? false,
    dailyReport:  appSettings?.dailyReport  ?? true,
    slipRequired: appSettings?.slipRequired ?? true,
    lineNotify:   appSettings?.lineNotify   ?? true,
  });
  const [limit, setLimitRaw] = useState(String(appSettings?.autoApproveLimit ?? 5000));
  const [showInvite, setShowInvite] = useState(false);

  const tog = k => {
    const next = { ...toggles, [k]: !toggles[k] };
    setTogglesRaw(next);
    setAppSettings?.(s => ({ ...s, [k]: next[k] }));
  };
  const setLimit = v => {
    setLimitRaw(v);
    setAppSettings?.(s => ({ ...s, autoApproveLimit: Number(v) || 0 }));
  };

  // โหลดจาก user_profiles จริง
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    window.db.from("user_profiles")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("[Settings]", error.message);
        setUsers(data || []);
        setLoadingUsers(false);
      });
  }, []);

  // Soft-delete: ตั้ง active=false (ไม่ลบข้อมูลจริง เพื่อความปลอดภัย)
  const deleteUser = async u => {
    if (u.role === "admin") { toast("ไม่สามารถปิดใช้งานผู้ดูแลระบบได้", "warn"); return; }
    const { error } = await window.db.from("user_profiles").update({ active: false }).eq("id", u.id);
    if (error) { toast("เกิดข้อผิดพลาด: " + error.message, "warn"); return; }
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: false } : x));
    toast("ปิดใช้งาน " + u.name + " แล้ว", "warn");
  };

  // เปลี่ยน role ใน DB
  const changeRole = async (u, newRole) => {
    if (u.id === profile?.id && newRole !== "admin") { toast("ไม่สามารถลดสิทธิ์ตัวเองได้", "warn"); return; }
    const { error } = await window.db.from("user_profiles").update({ role: newRole }).eq("id", u.id);
    if (error) { toast("เกิดข้อผิดพลาด: " + error.message, "warn"); return; }
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
    toast("เปลี่ยนสิทธิ์ " + u.name + " เป็น " + ROLES[newRole].th, "ok");
  };

  return (
    <div className="page" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div className="seg" style={{ marginBottom: 20 }}>
        {[["users","ผู้ใช้งาน"],["company","ข้อมูลบริษัท"],["prefs","การตั้งค่าระบบ"]].map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "users" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="flex items-center card-pad" style={{ padding: 18, borderBottom: "1px solid var(--line)" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>สมาชิกทีม</h2>
              <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{loadingUsers ? "กำลังโหลด…" : users.length + " คน"}</span>
            </div>
            {profile?.role === "admin" && (
              <button className="btn-primary ml-auto" onClick={() => setShowInvite(true)}><I.plus />เพิ่มผู้ใช้งาน</button>
            )}
          </div>
          <div style={{ overflowX: "auto" }}>
            {loadingUsers ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>กำลังโหลดรายชื่อ…</div>
            ) : users.length === 0 ? (
              <div className="empty"><div className="ei"><I.user /></div><div>ยังไม่มีผู้ใช้งาน</div></div>
            ) : (
              <table className="tbl">
                <thead><tr><th>ชื่อ</th><th className="hide-sm">อีเมล</th><th>แผนก</th><th>สิทธิ์</th><th className="ta-r">สถานะ</th><th></th></tr></thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{ animation: `cardUp .4s ${i * 25}ms both`, opacity: u.active ? 1 : .5 }}>
                      <td><div className="who"><Avatar name={u.name || "?"} /><div className="nm">{u.name || "(ไม่มีชื่อ)"}</div></div></td>
                      <td className="hide-sm num" style={{ color: "var(--ink-2)", fontSize: 13 }}>{u.email || "—"}</td>
                      <td style={{ color: "var(--ink-2)", fontSize: 13.5 }}>{u.dept || "—"}</td>
                      <td>
                        {profile?.role === "admin" && u.id !== profile?.id ? (
                          <select className="sel" value={u.role}
                            style={{ height: 34, fontSize: 13, padding: "0 10px", width: "auto", minWidth: 120 }}
                            onChange={e => changeRole(u, e.target.value)}>
                            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.th}</option>)}
                          </select>
                        ) : (
                          <span className={"badge " + ROLES[u.role]?.cls}><span className="bd"></span>{ROLES[u.role]?.th}</span>
                        )}
                      </td>
                      <td className="ta-r">
                        <span style={{ fontSize: 13, fontWeight: 600, color: u.active ? "var(--green)" : "var(--ink-3)" }}>
                          {u.active ? "● ใช้งาน" : "○ ปิดใช้งาน"}
                        </span>
                      </td>
                      <td className="ta-r" style={{ width: 44 }}>
                        {profile?.role === "admin" && u.role !== "admin" && u.active && (
                          <button className="icon-btn" title="ปิดใช้งาน" style={{ color: "var(--red)" }} onClick={() => deleteUser(u)}>
                            <I.trash />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "company" && (
        <div className="card card-pad" style={{ padding: 28 }}>
          <div className="flex items-center gap-16" style={{ marginBottom: 26, paddingBottom: 22, borderBottom: "1px solid var(--line)" }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: "var(--brand-50)", display: "grid", placeItems: "center", flex: "none" }}>
              <img src="assets/logo-mark.png" alt="" style={{ width: 52, height: 52, objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 19 }}>บริษัท ไฮลีฟ โกบอล จำกัด</div>
              <div style={{ color: "var(--ink-3)", fontSize: 13.5 }}>HIGHLEAF Global CO., LTD</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div className="field"><label>ชื่อบริษัท</label><input className="inp" defaultValue="บริษัท ไฮลีฟ โกบอล จำกัด" /></div>
            <div className="field"><label>เลขประจำตัวผู้เสียภาษี</label><input className="inp num" defaultValue="0105566012345" /></div>
            <div className="field"><label>อีเมลฝ่ายการเงิน</label><input className="inp num" defaultValue="finance@highleaf.co.th" /></div>
            <div className="field"><label>เบอร์โทรศัพท์</label><input className="inp num" defaultValue="02-123-4567" /></div>
            <div className="field" style={{ gridColumn: "1/3" }}><label>ที่อยู่</label>
              <textarea className="inp" defaultValue="123 อาคารกรีนทาวเวอร์ ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110"></textarea></div>
          </div>
          <button className="btn-primary" onClick={() => toast("บันทึกข้อมูลบริษัทแล้ว")}><I.check />บันทึกการเปลี่ยนแปลง</button>
        </div>
      )}

      {tab === "prefs" && (
        <div className="col gap-16">
          <div className="card card-pad">
            <div className="section-head"><h2 style={{ fontSize: 16 }}>นโยบายการเบิกจ่าย</h2></div>
            <div className="col" style={{ gap: 4 }}>
              <PrefRow title="ต้องแนบสลิป/ใบเสร็จทุกครั้ง" desc="ไม่อนุญาตให้ส่งรายการที่ไม่มีหลักฐาน" on={toggles.slipRequired} onClick={() => tog("slipRequired")} />
              <PrefRow title="อนุมัติอัตโนมัติสำหรับยอดต่ำ" desc="รายการต่ำกว่าวงเงินที่กำหนดจะอนุมัติทันที" on={toggles.autoApprove} onClick={() => tog("autoApprove")} />
              <div className="flex items-center" style={{ padding: "14px 4px", borderTop: "1px solid var(--line-2)" }}>
                <div><div style={{ fontWeight: 600, fontSize: 14.5 }}>วงเงินอนุมัติอัตโนมัติ</div>
                  <div style={{ fontSize: 13, color: "var(--ink-3)" }}>รายการที่ต่ำกว่าจำนวนนี้</div></div>
                <div className="inp-money ml-auto" style={{ width: 160 }}>
                  <span className="cur">฿</span>
                  <input className="inp" value={limit} onChange={e => setLimit(e.target.value.replace(/[^0-9]/g, ""))} disabled={!toggles.autoApprove}
                    style={{ opacity: toggles.autoApprove ? 1 : .5 }} />
                </div>
              </div>
            </div>
          </div>
          <div className="card card-pad">
            <div className="section-head"><h2 style={{ fontSize: 16 }}>การแจ้งเตือน</h2></div>
            <div className="col" style={{ gap: 4 }}>
              <PrefRow title="ส่งสรุปประจำวัน" desc="อีเมลสรุปยอดเบิกทุกสิ้นวันให้ฝ่ายการเงิน" on={toggles.dailyReport} onClick={() => tog("dailyReport")} />
              <PrefRow title="แจ้งเตือนผ่าน LINE" desc="ส่งข้อความเมื่อมีรายการรออนุมัติใหม่" on={toggles.lineNotify} onClick={() => tog("lineNotify")} />
            </div>
          </div>
        </div>
      )}

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}
function PrefRow({ title, desc, on, onClick }) {
  return (
    <div className="flex items-center" style={{ padding: "14px 4px", borderTop: "1px solid var(--line-2)" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{desc}</div>
      </div>
      <Toggle on={on} onClick={onClick} />
    </div>
  );
}

Object.assign(window, { Settings });
