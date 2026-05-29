// ============ records.jsx — full table with search/filter + slip viewer ============
function SlipModal({ rec, onClose }) {
  if (!rec) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
          <div><div style={{ fontWeight: 700, fontSize: 16 }}>หลักฐานการจ่าย</div>
            <div className="num" style={{ fontSize: 13, color: "var(--ink-3)" }}>{rec.id}</div></div>
          <button className="icon-btn ml-auto" onClick={onClose}><I.x /></button>
        </div>
        <div style={{ padding: 24, background: "var(--surface-2)" }}>
          <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "var(--sh-2)", background: "#fff", maxWidth: 260, margin: "0 auto" }}>
            <ReceiptSVG hue={rec.hue} className="rcpt" />
            <div style={{ aspectRatio: "1/1.25" }}></div>
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

function RecordsTable({ records, goCreate }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState({ k: "date", dir: -1 });
  const [slip, setSlip] = useState(null);
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
                      <ReceiptSVG hue={r.hue} className="rcpt" />
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
                  <td className="ta-r" style={{ width: 48 }}>
                    <button className="icon-btn" onClick={() => setSlip(r)}><I.eye /></button>
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
        {/* pagination */}
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
    </div>
  );
}

Object.assign(window, { RecordsTable, SlipModal });
