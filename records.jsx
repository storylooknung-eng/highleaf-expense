// ============ records.jsx — slip viewer, edit modal, full table ============

function SlipModal({ rec, onClose }) {
  if (!rec) return null;
  const slipImg = localStorage.getItem("slip_" + rec.id);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
          <div><div style={{ fontWeight: 700, fontSize: 16 }}>หลักฐานการจ่าย</div>
            <div className="num" style={{ fontSize: 13, color: "var(--ink-3)" }}>{rec.id}</div></div>
          <button className="icon-btn ml-auto" onClick={onClose}><I.x /></button>
        </div>
        <div style={{ padding: 24, background: "var(--surface-2)" }}>
          <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "var(--sh-2)", background: "#fff", maxWidth: 280, margin: "0 auto" }}>
            {slipImg
              ? <img src={slipImg} style={{ width: "100%", display: "block", maxHeight: 400, objectFit: "contain" }} />
              : <>
                  <ReceiptSVG hue={rec.hue} className="rcpt" />
                  <div style={{ padding: "10px 14px", background: "var(--brand-50)", textAlign: "center", fontSize: 12.5, color: "var(--brand)" }}>
                    ตัวอย่างสลิป (ไม่มีไฟล์แนบ)
                  </div>
                </>
            }
          </div>
        </div>
        <div style={{ padding: "18px 24px" }} className="col gap-12">
          <PreviewRow k="ผู้เบิก" v={rec.person} />
          <PreviewRow k="หมวดหมู่" v={<CatChip cat={rec.cat} />} />
          <PreviewRow k="จำนวนเงิน" v={<span className="num" style={{ fontWeight: 700 }}>{THB(rec.amount)}</span>} />
          <PreviewRow k="สถานะ" v={<Badge status={rec.status} />} />
        </div>
      </div>
    </div>
  );
}

function EditModal({ rec, onClose, onSave }) {
  const toast = useToast();
  const [date, setDate]     = useState(rec.date);
  const [person, setPerson] = useState(rec.person);
  const [dept, setDept]     = useState(rec.dept || "");
  const [amount, setAmount] = useState(String(rec.amount));
  const [cat, setCat]       = useState(rec.cat);
  const [note, setNote]     = useState(rec.note || "");
  const [saving, setSaving] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { toast("กรุณากรอกจำนวนเงิน", "warn"); return; }
    setSaving(true);
    const { error } = await onSave(rec.id, { date, person, dept, amount: Number(amount), cat, note });
    setSaving(false);
    if (error) { toast("เกิดข้อผิดพลาด: " + error.message, "warn"); return; }
    toast("แก้ไขรายการ " + rec.id + " แล้ว", "ok");
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
          <div><div style={{ fontWeight: 700, fontSize: 16 }}>แก้ไขรายการ</div>
            <div className="num" style={{ fontSize: 13, color: "var(--ink-3)" }}>{rec.id}</div></div>
          <button className="icon-btn ml-auto" onClick={onClose}><I.x /></button>
        </div>
        <form onSubmit={submit} style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>วันที่</label>
              <input type="date" className="inp" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label>จำนวนเงิน <span className="req">*</span></label>
              <div className="inp-money">
                <span className="cur">฿</span>
                <input className="inp" value={amount} inputMode="decimal"
                  onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
              </div>
            </div>
            <div className="field">
              <label>ชื่อผู้เบิก</label>
              <input className="inp" value={person} onChange={e => setPerson(e.target.value)} />
            </div>
            <div className="field">
              <label>แผนก</label>
              <input className="inp" value={dept} onChange={e => setDept(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>หมวดหมู่</label>
            <select className="sel" value={cat} onChange={e => setCat(e.target.value)}>
              {CAT_KEYS.map(k => <option key={k} value={k}>{CATS[k].name}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 24 }}>
            <label>รายละเอียด / หมายเหตุ</label>
            <textarea className="inp" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="flex gap-12">
            <button type="submit" className="btn-primary" disabled={saving}
              style={{ opacity: saving ? .7 : 1 }}>
              {saving
                ? <span style={{ width:18,height:18,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block" }}></span>
                : <I.check />}
              {saving ? "กำลังบันทึก…" : "บันทึกการแก้ไข"}
            </button>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>ยกเลิก</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecordsTable({ records, goCreate, onEdit }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState({ k: "date", dir: -1 });
  const [slip, setSlip] = useState(null);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const PER = 9;

  const filtered = useMemo(() => {
    let r = records.filter(x => {
      if (cat !== "all" && x.cat !== cat) return false;
      if (status !== "all" && x.status !== status) return false;
      if (q && !(x.person.includes(q) || x.note.includes(q) || x.id.toLowerCase().includes(q.toLowerCase()) || x.dept.includes(q))) return false;
      return true;
    });
    r = [...r].sort((a, b) => {
      let av = a[sort.k], bv = b[sort.k];
      if (sort.k === "amount") return (av - bv) * sort.dir;
      return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
    });
    return r;
  }, [records, q, cat, status, sort]);

  useEffect(() => setPage(1), [q, cat, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const shown = filtered.slice((page - 1) * PER, page * PER);
  const total = filtered.reduce((s, r) => s + r.amount, 0);

  const th = (k, label, right) => (
    <th onClick={() => setSort(s => ({ k, dir: s.k === k ? -s.dir : -1 }))}
      style={{ cursor: "pointer", textAlign: right ? "right" : "left", userSelect: "none" }}>
      {label}{sort.k === k && <span style={{ marginLeft: 4 }}>{sort.dir === -1 ? "↓" : "↑"}</span>}
    </th>
  );

  return (
    <div className="page">
      {/* filter bar */}
      <div className="card card-pad" style={{ marginBottom: 18, padding: 18 }}>
        <div className="flex items-center wrap gap-12">
          <div className="tb-search" style={{ margin: 0 }}>
            <I.search />
            <input placeholder="ค้นหา ชื่อ, รหัส, รายละเอียด…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="flex gap-8 wrap">
            <button className={"pill" + (cat === "all" ? " on" : "")} onClick={() => setCat("all")}>ทุกหมวด</button>
            {CAT_KEYS.map(k => (
              <button key={k} className={"pill" + (cat === k ? " on" : "")} onClick={() => setCat(k)}>
                <CatChip cat={k} dotOnly />{CATS[k].name}
              </button>
            ))}
          </div>
          <div className="seg ml-auto">
            {[["all","ทั้งหมด"],["pending","รออนุมัติ"],["approved","อนุมัติ"],["rejected","ไม่อนุมัติ"]].map(([k, l]) => (
              <button key={k} className={status === k ? "on" : ""} onClick={() => setStatus(k)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* summary strip */}
      <div className="flex items-center wrap gap-16" style={{ marginBottom: 16, padding: "0 4px" }}>
        <span style={{ fontSize: 14, color: "var(--ink-2)" }}>พบ <b className="num">{filtered.length}</b> รายการ</span>
        <span style={{ fontSize: 14, color: "var(--ink-2)" }}>รวมมูลค่า <b className="num" style={{ color: "var(--brand)" }}>{THB(total)}</b></span>
        <button className="btn-ghost ml-auto" onClick={() => {}}><I.download />ส่งออก Excel</button>
        <button className="btn-primary" onClick={goCreate}><I.plus />สร้างรายการ</button>
      </div>

      {/* table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>สลิป</th>
                {th("id", "รหัส")}
                {th("person", "ผู้เบิก")}
                <th className="hide-sm">หมวดหมู่</th>
                {th("date", "วันที่")}
                {th("amount", "จำนวนเงิน", true)}
                <th className="ta-r">สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={r.id} style={{ animation: `cardUp .4s ${i * 30}ms both` }}>
                  <td style={{ width: 54 }}>
                    <div className="slip-thumb" onClick={() => setSlip(r)} style={{ cursor: "pointer" }}>
                      {localStorage.getItem("slip_" + r.id)
                        ? <img src={localStorage.getItem("slip_" + r.id)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <ReceiptSVG hue={r.hue} className="rcpt" />}
                    </div>
                  </td>
                  <td><span className="num" style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>{r.id}</span></td>
                  <td>
                    <div className="who"><Avatar name={r.person} />
                      <div><div className="nm">{r.person}</div><div className="dp">{r.dept} · {r.note}</div></div>
                    </div>
                  </td>
                  <td className="hide-sm"><CatChip cat={r.cat} /></td>
                  <td style={{ color: "var(--ink-2)", fontSize: 13.5, whiteSpace: "nowrap" }}>{thDate(r.date, true)}</td>
                  <td className="ta-r"><span className="amount num">{THB(r.amount)}</span></td>
                  <td className="ta-r"><Badge status={r.status} /></td>
                  <td className="ta-r" style={{ width: 80 }}>
                    <div className="flex" style={{ justifyContent: "flex-end", gap: 4 }}>
                      <button className="icon-btn" onClick={() => setSlip(r)} title="ดูสลิป"><I.eye /></button>
                      {onEdit && <button className="icon-btn" onClick={() => setEditing(r)} title="แก้ไข"><I.edit /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty">
            <div className="ei"><I.search /></div>
            <div style={{ fontWeight: 600, color: "var(--ink)" }}>ไม่พบรายการที่ตรงกับเงื่อนไข</div>
            <div style={{ fontSize: 13.5, marginTop: 4 }}>ลองปรับคำค้นหาหรือตัวกรองใหม่</div>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center" style={{ padding: "14px 18px", borderTop: "1px solid var(--line)", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--ink-3)" }}>หน้า {page} จาก {pages}</span>
            <div className="flex gap-8 ml-auto">
              <button className="icon-btn" style={{ border: "1px solid var(--line)" }} disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}><I.chevron style={{ transform: "rotate(180deg)" }} /></button>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} className={"pill" + (p === page ? " on" : "")} style={{ minWidth: 38, justifyContent: "center" }} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="icon-btn" style={{ border: "1px solid var(--line)" }} disabled={page === pages}
                onClick={() => setPage(p => Math.min(pages, p + 1))}><I.chevron /></button>
            </div>
          </div>
        )}
      </div>

      <SlipModal rec={slip} onClose={() => setSlip(null)} />
      {editing && <EditModal rec={editing} onClose={() => setEditing(null)} onSave={onEdit} />}
    </div>
  );
}

Object.assign(window, { RecordsTable, SlipModal });
