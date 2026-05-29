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

function AddUserModal({ onClose, onAdd }) {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [dept, setDept]   = useState("");
  const [role, setRole]   = useState("staff");
  const valid = name.trim() && email.includes("@") && dept.trim();
  const submit = e => {
    e.preventDefault();
    if (!valid) return;
    onAdd({ name: name.trim(), email: email.trim(), dept: dept.trim(), role, active: true });
    onClose();
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>เพิ่มผู้ใช้งานใหม่</div>
          <button className="icon-btn ml-auto" onClick={onClose}><I.x /></button>
        </div>
        <form onSubmit={submit} style={{ padding: 24 }} className="col gap-8">
          <div className="field">
            <label>ชื่อ-นามสกุล <span className="req">*</span></label>
            <input className="inp" placeholder="เช่น สมชาย ใจดี" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label>อีเมล <span className="req">*</span></label>
            <input className="inp" type="email" placeholder="name@highleaf.co.th" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>แผนก <span className="req">*</span></label>
            <input className="inp" placeholder="เช่น การตลาด, ปฏิบัติการ" value={dept} onChange={e => setDept(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 24 }}>
            <label>สิทธิ์การใช้งาน</label>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              {Object.entries(ROLES).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setRole(k)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, fontWeight: 600, fontSize: 13.5,
                  border: "1.6px solid " + (role === k ? "var(--brand)" : "var(--line)"),
                  background: role === k ? "var(--brand-50)" : "var(--surface)",
                  color: role === k ? "var(--brand)" : "var(--ink-2)", transition: ".18s"
                }}>{v.th}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-12">
            <button type="submit" className="btn-primary" disabled={!valid} style={{ opacity: valid ? 1 : .5 }}>
              <I.user />เพิ่มผู้ใช้งาน
            </button>
            <button type="button" className="btn-ghost" onClick={onClose}>ยกเลิก</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Settings() {
  const toast = useToast();
  const [tab, setTab] = useState("users");
  const [toggles, setToggles] = useState({ autoApprove: false, dailyReport: true, slipRequired: true, lineNotify: true });
  const [limit, setLimit] = useState("5000");
  const [showAddUser, setShowAddUser] = useState(false);
  const tog = k => setToggles(t => ({ ...t, [k]: !t[k] }));

  const [users, setUsers] = useState([
    { name: "ฟร้อง", dept: "การตลาด", role: "admin", email: "storylooknung@gmail.com", active: true },
    ...PEOPLE.map((p, i) => ({
      ...p, role: i === 0 || i === 1 ? "approver" : "staff",
      email: ["siri","thanakorn","paweena","anucha","kittipong","napat","weeraphat"][i] + "@highleaf.co.th",
      active: i !== 6,
    }))
  ]);

  const addUser = u => {
    setUsers(prev => [...prev, u]);
    toast("เพิ่มผู้ใช้งาน " + u.name + " แล้ว", "ok");
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
            <div><h2 style={{ fontSize: 16, fontWeight: 700 }}>สมาชิกทีม</h2>
              <span className="sub" style={{ fontSize: 13, color: "var(--ink-3)" }}>{users.length} คน</span></div>
            <button className="btn-primary ml-auto" onClick={() => setShowAddUser(true)}><I.plus />เพิ่มผู้ใช้งาน</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>ชื่อ</th><th className="hide-sm">อีเมล</th><th>แผนก</th><th>สิทธิ์</th><th className="ta-r">สถานะ</th></tr></thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.email} style={{ animation: `cardUp .4s ${i * 25}ms both` }}>
                    <td><div className="who"><Avatar name={u.name} /><div className="nm">{u.name}</div></div></td>
                    <td className="hide-sm num" style={{ color: "var(--ink-2)", fontSize: 13 }}>{u.email}</td>
                    <td style={{ color: "var(--ink-2)", fontSize: 13.5 }}>{u.dept}</td>
                    <td><span className={"badge " + ROLES[u.role].cls}><span className="bd"></span>{ROLES[u.role].th}</span></td>
                    <td className="ta-r">
                      <span style={{ fontSize: 13, fontWeight: 600, color: u.active ? "var(--green)" : "var(--ink-3)" }}>
                        {u.active ? "● ใช้งาน" : "○ ปิดใช้งาน"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} onAdd={addUser} />}
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
