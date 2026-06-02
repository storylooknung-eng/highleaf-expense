// ============ wallet.jsx — กระเป๋าเงิน / ตัดบิล ============

const BILL_CATS = [
  { k: "promote",  label: "ค่าโปรโมทไลฟ์"      },
  { k: "ads",      label: "ค่าโฆษณา"            },
  { k: "shipping", label: "ค่าขนส่ง"            },
  { k: "stock",    label: "ซื้อสต็อกสินค้า"     },
  { k: "salary",   label: "ค่าจ้าง/ค่าแรง"      },
  { k: "other",    label: "อื่นๆ"               },
];

/* ---------- Mini slip upload (optional) ---------- */
function SlipUpload({ file, setFile }) {
  const inputRef  = useRef(null);
  const cameraRef = useRef(null);

  const pick = f => {
    if (!f || f.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = e => setFile({ fileObj: f, name: f.name, dataUrl: e.target.result });
    reader.readAsDataURL(f);
  };

  if (file) return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12,
      border: "1.5px solid var(--brand-100)", background: "var(--brand-50)" }}>
      {file.dataUrl && file.fileObj?.type?.startsWith("image/")
        ? <img src={file.dataUrl} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }} />
        : <ReceiptSVG hue={140} style={{ width: 48, height: 48 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
        <div style={{ fontSize: 12, color: "var(--brand)" }}>แนบแล้ว</div>
      </div>
      <button type="button" className="icon-btn" onClick={() => setFile(null)}><I.x /></button>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <button type="button" onClick={() => inputRef.current.click()}
        style={{ flex: 1, minWidth: 140, padding: "10px 16px", borderRadius: 12,
          border: "1.5px dashed var(--line)", background: "var(--surface)",
          fontSize: 13.5, fontWeight: 600, color: "var(--ink-3)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
        <I.upload style={{ width: 16, height: 16 }} />แนบสลิป (ไม่บังคับ)
      </button>
      <button type="button" onClick={() => cameraRef.current.click()}
        style={{ padding: "10px 16px", borderRadius: 12,
          border: "1.5px solid var(--brand-100)", background: "var(--brand-50)",
          fontSize: 13.5, fontWeight: 600, color: "var(--brand)",
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        📷 ถ่ายรูป
      </button>
      <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display: "none" }}
        onChange={e => pick(e.target.files[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
        onChange={e => pick(e.target.files[0])} />
    </div>
  );
}

/* ---------- Balance card ---------- */
function WalletBalanceCard({ balance, credit, debit, run, name }) {
  const n = useCountUp(balance, 1100, run);
  const safe = balance >= 0;
  return (
    <div className="card card-pad" style={{
      background: safe ? "var(--leaf-grad)" : "linear-gradient(135deg,#BF4530 0%,#8B2F20 100%)",
      color: "#fff", position: "relative", overflow: "hidden", marginBottom: 18
    }}>
      <div style={{ position: "absolute", right: -50, top: -50, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.07)" }}></div>
      <div style={{ position: "absolute", right: 60, bottom: -60, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.05)" }}></div>
      {name && <div style={{ fontSize: 13, opacity: .75, marginBottom: 4 }}>{name}</div>}
      <div style={{ fontSize: 13, opacity: .82, marginBottom: 6 }}>ยอดคงเหลือในกระเป๋าเงิน</div>
      <div className="num" style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-.5px", marginBottom: 18 }}>
        <span style={{ fontSize: 22, verticalAlign: "middle", opacity: .85 }}>฿</span>
        {Math.round(n).toLocaleString("en-US")}
      </div>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, opacity: .72 }}>รับเข้าทั้งหมด</div>
          <div className="num" style={{ fontSize: 16, fontWeight: 600 }}>+{THB(credit)}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: .72 }}>ตัดบิลทั้งหมด</div>
          <div className="num" style={{ fontSize: 16, fontWeight: 600 }}>-{THB(debit)}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Bill form ---------- */
function BillForm({ userId, onSuccess }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [form, setForm] = useState({ amount: "", description: "", cat: "promote" });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { toast("กรุณาระบุจำนวนเงินที่ถูกต้อง", "warn"); return; }
    if (!form.description.trim()) { toast("กรุณาระบุรายละเอียด", "warn"); return; }
    setSaving(true);

    const catLabel = BILL_CATS.find(c => c.k === form.cat)?.label || form.cat;
    const txId = "BILL-" + Date.now().toString().slice(-8);

    // อัปโหลด slip ถ้ามี
    let slip_path = null, slip_url = null;
    if (slipFile?.fileObj) {
      const ext  = slipFile.fileObj.name.split(".").pop() || "jpg";
      const path = userId + "/bill-" + txId + "." + ext.toLowerCase();
      const { error: upErr } = await window.db.storage
        .from("slips").upload(path, slipFile.fileObj, { upsert: true });
      if (!upErr) {
        slip_path = path;
      } else {
        console.warn("[Storage] slip upload failed:", upErr.message);
      }
      if (slipFile.dataUrl) {
        try { localStorage.setItem("slip_bill_" + txId, slipFile.dataUrl); } catch (_) {}
      }
    }

    const { error } = await window.db.from("wallet_transactions").insert({
      user_id: userId,
      type: "debit",
      amount: amt,
      description: `[${catLabel}] ${form.description.trim()}`,
      slip_path,
      slip_url,
    });

    setSaving(false);
    if (error) { toast("เกิดข้อผิดพลาด: " + error.message, "warn"); return; }
    toast("ตัดบิลสำเร็จ ฿" + amt.toLocaleString("en-US"));
    setForm({ amount: "", description: "", cat: "promote" });
    setSlipFile(null);
    onSuccess();
  };

  return (
    <div className="card card-pad" style={{ marginBottom: 18 }}>
      <div className="section-head" style={{ marginBottom: 18 }}>
        <div>
          <h2>ตัดบิล</h2>
          <span className="sub">หักยอดเงินออกจากกระเป๋าเพื่อชำระค่าใช้จ่าย</span>
        </div>
      </div>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="bill-form-grid">
          <div className="field">
            <label className="lbl">หมวดหมู่</label>
            <select className="inp" value={form.cat} onChange={e => set("cat", e.target.value)}>
              {BILL_CATS.map(c => <option key={c.k} value={c.k}>{c.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="lbl">จำนวนเงิน (บาท)</label>
            <input className="inp num" type="number" min="1" step="0.01" placeholder="0.00"
              value={form.amount} onChange={e => set("amount", e.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label className="lbl">รายละเอียด</label>
          <input className="inp" placeholder="เช่น ค่าโปรโมทไลฟ์ วันที่ 1 มิ.ย." maxLength={200}
            value={form.description} onChange={e => set("description", e.target.value)} required />
        </div>
        <div className="field">
          <label className="lbl">แนบสลิป</label>
          <SlipUpload file={slipFile} setFile={setSlipFile} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "กำลังบันทึก…" : <><I.scissors />ตัดบิล</>}
          </button>
        </div>
      </form>
      <style>{`@media(max-width:600px){.bill-form-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

/* ---------- Slip viewer ---------- */
function BillSlip({ tx }) {
  const [url, setUrl] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!tx.slip_path && !tx.slip_url) return;
    if (tx.slip_url) { setUrl(tx.slip_url); return; }
    const local = localStorage.getItem("slip_bill_" + tx.id);
    if (local) { setUrl(local); return; }
    if (tx.slip_path) {
      window.db.storage.from("slips").createSignedUrl(tx.slip_path, 3600)
        .then(({ data }) => { if (data?.signedUrl) setUrl(data.signedUrl); });
    }
  }, [tx.id]);

  if (!tx.slip_path && !tx.slip_url) return null;
  return (
    <>
      <button type="button" className="icon-btn" title="ดูสลิป" style={{ color: "var(--brand)" }}
        onClick={() => setOpen(true)}><I.eye /></button>
      {open && url && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 9999,
          display: "grid", placeItems: "center" }} onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 18, padding: 16, maxWidth: "90vw", maxHeight: "90vh", overflow: "auto" }}>
            <img src={url} style={{ maxWidth: "80vw", maxHeight: "78vh", borderRadius: 10, display: "block" }} />
            <button className="btn-primary" style={{ marginTop: 12, width: "100%" }} onClick={() => setOpen(false)}>ปิด</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Edit modal ---------- */
function EditTxModal({ tx, adminName, onClose, onSaved }) {
  const toast = useToast();
  const [amount, setAmount]   = useState(String(tx.amount));
  const [desc,   setDesc]     = useState(tx.description);
  const [saving, setSaving]   = useState(false);

  const submit = async e => {
    e.preventDefault();
    const newAmt = parseFloat(amount);
    if (!newAmt || newAmt <= 0) { toast("จำนวนเงินไม่ถูกต้อง", "warn"); return; }
    if (!desc.trim()) { toast("กรุณาระบุรายละเอียด", "warn"); return; }
    setSaving(true);

    const logEntry = {
      at: new Date().toISOString(),
      by: adminName,
      old_amount: tx.amount,
      old_description: tx.description,
    };
    const newLog = [...(tx.edit_log || []), logEntry];

    const { error } = await window.db.from("wallet_transactions")
      .update({ amount: newAmt, description: desc.trim(), edit_log: newLog })
      .eq("id", tx.id);

    setSaving(false);
    if (error) { toast("แก้ไขไม่สำเร็จ: " + error.message, "warn"); return; }
    toast("แก้ไขสำเร็จ");
    onSaved();
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 9999, display: "grid", placeItems: "center" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 18, padding: 28, width: "min(480px,92vw)", boxShadow: "var(--sh-2)" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>แก้ไขรายการ</div>
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <div className="field">
            <label className="lbl">จำนวนเงิน (บาท)</label>
            <input className="inp num" type="number" min="1" step="0.01"
              value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
          <div className="field">
            <label className="lbl">รายละเอียด</label>
            <input className="inp" value={desc} onChange={e => setDesc(e.target.value)} required />
          </div>
          {(tx.edit_log || []).length > 0 && (
            <div style={{ background: "var(--bg)", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", marginBottom: 8 }}>ประวัติการแก้ไข</div>
              {[...tx.edit_log].reverse().map((log, i) => (
                <div key={i} style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6, borderLeft: "2px solid var(--line)", paddingLeft: 10 }}>
                  <div style={{ fontWeight: 600 }}>{log.by} · {log.at.slice(0,10)} {log.at.slice(11,16)} น.</div>
                  <div>เดิม: <span className="num">{THB(log.old_amount)}</span> — {log.old_description}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn-ghost" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "กำลังบันทึก…" : "บันทึก"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Transaction row ---------- */
function TxRow({ tx, showUser, isAdmin, adminName, onDeleted, onEdited }) {
  const toast = useToast();
  const isCredit = tx.type === "credit";
  const [confirmDel, setConfirmDel] = useState(false);
  const [editing, setEditing]       = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const doDelete = async () => {
    setDeleting(true);
    const { error } = await window.db.from("wallet_transactions").delete().eq("id", tx.id);
    setDeleting(false);
    if (error) { toast("ลบไม่สำเร็จ: " + error.message, "warn"); return; }
    toast("ลบรายการแล้ว", "warn");
    onDeleted?.();
    setConfirmDel(false);
  };

  return (
    <>
      <tr>
        <td style={{ width: 40 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: isCredit ? "var(--brand-50)" : "var(--red-bg)",
            display: "grid", placeItems: "center",
            color: isCredit ? "var(--brand)" : "#BF4530"
          }}>
            {isCredit ? <I.down style={{ width: 16, height: 16 }} /> : <I.up style={{ width: 16, height: 16 }} />}
          </div>
        </td>
        <td>
          {showUser && tx._userName && (
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 2 }}>
              <Avatar name={tx._userName} size={18} /> {tx._userName}
            </div>
          )}
          <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)" }}>{tx.description}</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
            {thDate(tx.created_at.slice(0, 10), true)} · {tx.created_at.slice(11, 16)} น.
            {(tx.edit_log || []).length > 0 && (
              <span style={{ fontSize: 11, background: "var(--amber-bg)", color: "#C0852A", borderRadius: 6, padding: "1px 7px", fontWeight: 600 }}>
                แก้ไขแล้ว {tx.edit_log.length} ครั้ง
              </span>
            )}
          </div>
        </td>
        <td className="ta-r" style={{ whiteSpace: "nowrap" }}>
          {tx.slip_path || tx.slip_url ? <BillSlip tx={tx} /> : null}
          {isAdmin && (
            <>
              <button className="icon-btn" title="แก้ไข" onClick={() => setEditing(true)}><I.edit /></button>
              <button className="icon-btn" title="ลบ" style={{ color: "#BF4530" }}
                onClick={() => setConfirmDel(true)}><I.trash /></button>
            </>
          )}
          <span className="num" style={{ fontWeight: 700, fontSize: 15, color: isCredit ? "var(--brand)" : "#BF4530" }}>
            {isCredit ? "+" : "−"}{THB(tx.amount)}
          </span>
        </td>
      </tr>
      {/* inline delete confirm */}
      {confirmDel && (
        <tr style={{ background: "var(--red-bg)" }}>
          <td colSpan={3} style={{ padding: "10px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#BF4530", flex: 1 }}>
                ยืนยันลบรายการนี้? ({tx.description})
              </span>
              <button className="btn-ghost" onClick={() => setConfirmDel(false)}>ยกเลิก</button>
              <button className="btn-primary" style={{ background: "#BF4530" }}
                disabled={deleting} onClick={doDelete}>
                {deleting ? "กำลังลบ…" : "ยืนยันลบ"}
              </button>
            </div>
          </td>
        </tr>
      )}
      {editing && (
        <EditTxModal tx={tx} adminName={adminName} onClose={() => setEditing(false)} onSaved={onEdited} />
      )}
    </>
  );
}

/* ---------- Admin: all users balances ---------- */
function AdminOverview({ allTxs, profiles, adminName, onReload }) {
  const byUser = {};
  allTxs.forEach(tx => {
    if (!byUser[tx.user_id]) byUser[tx.user_id] = { credit: 0, debit: 0, txs: [] };
    byUser[tx.user_id][tx.type === "credit" ? "credit" : "debit"] += Number(tx.amount);
    byUser[tx.user_id].txs.push(tx);
  });

  const rows = Object.entries(byUser).map(([uid, v]) => {
    const p = profiles.find(p => p.id === uid);
    return { uid, name: p?.name || uid, dept: p?.dept || "", balance: v.credit - v.debit, credit: v.credit, debit: v.debit, txs: v.txs };
  }).sort((a, b) => b.balance - a.balance);

  const [expand, setExpand] = useState(null);

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-pad" style={{ paddingBottom: 6 }}>
        <div className="section-head">
          <h2>ยอดคงเหลือทุกคน</h2>
          <span className="sub ml-auto">{rows.length} คน</span>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>แผนก</th>
              <th className="ta-r">รับเข้า</th>
              <th className="ta-r">ตัดบิล</th>
              <th className="ta-r">คงเหลือ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <React.Fragment key={r.uid}>
                <tr>
                  <td><div className="who"><Avatar name={r.name} /><div className="nm">{r.name}</div></div></td>
                  <td style={{ color: "var(--ink-3)", fontSize: 13 }}>{r.dept}</td>
                  <td className="ta-r num" style={{ color: "var(--brand)", fontWeight: 600 }}>+{THB(r.credit)}</td>
                  <td className="ta-r num" style={{ color: "#BF4530", fontWeight: 600 }}>-{THB(r.debit)}</td>
                  <td className="ta-r num" style={{ fontWeight: 700, fontSize: 15, color: r.balance >= 0 ? "var(--ink)" : "#BF4530" }}>{THB(r.balance)}</td>
                  <td className="ta-r">
                    <button className="icon-btn" title="ดูรายการ" onClick={() => setExpand(expand === r.uid ? null : r.uid)}>
                      <I.chevron style={{ transform: expand === r.uid ? "rotate(90deg)" : "none", transition: ".2s" }} />
                    </button>
                  </td>
                </tr>
                {expand === r.uid && r.txs.map(tx => (
                  <tr key={tx.id} style={{ background: "var(--bg)" }}>
                    <td colSpan={6} style={{ paddingLeft: 48, paddingTop: 4, paddingBottom: 4 }}>
                      <table className="tbl" style={{ margin: 0 }}>
                        <tbody><TxRow tx={tx} showUser={false} isAdmin={true} adminName={adminName} onDeleted={onReload} onEdited={onReload} /></tbody>
                      </table>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Export helpers ---------- */
function exportTxs(txs, filename, profiles) {
  const header = ["วันที่", "เวลา", "ประเภท", "รายละเอียด", "จำนวนเงิน (บาท)", "แก้ไขแล้ว (ครั้ง)"];
  if (profiles) header.splice(2, 0, "ชื่อผู้ทำรายการ");
  const rows = txs.map(tx => {
    const typeLabel = tx.type === "credit" ? "รับเงินเบิก" : "ตัดบิล";
    const userName  = profiles ? (profiles.find(p => p.id === tx.user_id)?.name || tx.user_id) : undefined;
    const row = [
      tx.created_at.slice(0, 10),
      tx.created_at.slice(11, 16),
      typeLabel,
      tx.description,
      Number(tx.amount),
      (tx.edit_log || []).length,
    ];
    if (profiles) row.splice(2, 0, userName);
    return row;
  });
  return [header, ...rows];
}

function ExportButtons({ txs, filenameBase, profiles }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button className="btn-ghost" style={{ fontSize: 13 }}
        onClick={() => downloadXlsx(filenameBase + ".xlsx", exportTxs(txs, filenameBase, profiles))}>
        <I.download style={{ width: 15, height: 15 }} />Excel
      </button>
      <button className="btn-ghost" style={{ fontSize: 13 }}
        onClick={() => downloadCsv(filenameBase + ".csv", exportTxs(txs, filenameBase, profiles))}>
        <I.download style={{ width: 15, height: 15 }} />CSV
      </button>
    </div>
  );
}

/* ---------- Main WalletPage ---------- */
function WalletPage({ profile }) {
  const toast = useToast();
  const isAdmin = profile?.role === "admin";
  const [txs, setTxs] = useState([]);
  const [allTxs, setAllTxs] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState(false);
  const [tab, setTab] = useState("mine"); // "mine" | "all"

  const loadTxs = async () => {
    setLoading(true);

    // โหลดของตัวเอง
    const { data: myData, error } = await window.db
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    if (error) toast("โหลดข้อมูลไม่สำเร็จ: " + error.message, "warn");
    setTxs(myData || []);

    // admin โหลดทั้งหมด
    if (isAdmin) {
      const [{ data: all }, { data: prof }] = await Promise.all([
        window.db.from("wallet_transactions").select("*").order("created_at", { ascending: false }),
        window.db.from("user_profiles").select("id,name,dept"),
      ]);
      setAllTxs(all || []);
      setProfiles(prof || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadTxs();
    const t = setTimeout(() => setRun(true), 80);
    return () => clearTimeout(t);
  }, [profile.id]);

  const credit  = txs.filter(t => t.type === "credit").reduce((s, t) => s + Number(t.amount), 0);
  const debit   = txs.filter(t => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0);
  const balance = credit - debit;

  if (loading) return (
    <div className="page" style={{ display: "grid", placeItems: "center", minHeight: 300 }}>
      <div style={{ textAlign: "center", color: "var(--ink-3)" }}>กำลังโหลด…</div>
    </div>
  );

  return (
    <div className="page">
      {/* Tab switcher สำหรับ admin */}
      {isAdmin && (
        <div className="seg" style={{ marginBottom: 18 }}>
          <button className={tab === "mine" ? "on" : ""} onClick={() => setTab("mine")}>กระเป๋าของฉัน</button>
          <button className={tab === "all"  ? "on" : ""} onClick={() => setTab("all")}>ภาพรวมทุกคน</button>
        </div>
      )}

      {tab === "all" && isAdmin ? (
        <>
          <AdminOverview allTxs={allTxs} profiles={profiles} adminName={profile.name} onReload={loadTxs} />
          {/* รายการทั้งหมด */}
          <div className="card">
            <div className="card-pad" style={{ paddingBottom: 6 }}>
              <div className="section-head">
                <h2>รายการตัดบิลทั้งหมด</h2>
                <span className="sub" style={{ marginRight: "auto", marginLeft: 8 }}>{allTxs.filter(t => t.type === "debit").length} รายการ</span>
                <ExportButtons txs={allTxs} filenameBase={"wallet_all_" + todayIso()} profiles={profiles} />
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <tbody>
                  {allTxs.filter(t => t.type === "debit").map(tx => {
                    const p = profiles.find(p => p.id === tx.user_id);
                    return <TxRow key={tx.id} tx={{ ...tx, _userName: p?.name }} showUser={true}
                      isAdmin={true} adminName={profile.name} onDeleted={loadTxs} onEdited={loadTxs} />;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <WalletBalanceCard balance={balance} credit={credit} debit={debit} run={run} />
          <BillForm userId={profile.id} onSuccess={loadTxs} />
          <div className="card">
            <div className="card-pad" style={{ paddingBottom: 6 }}>
              <div className="section-head">
                <h2>ประวัติธุรกรรม</h2>
                <span className="sub" style={{ marginRight: "auto", marginLeft: 8 }}>{txs.length} รายการ</span>
                <ExportButtons txs={txs} filenameBase={"wallet_" + profile.name + "_" + todayIso()} />
              </div>
            </div>
            {txs.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>
                ยังไม่มีธุรกรรม — เงินจะเข้ากระเป๋าเมื่อรายการเบิกได้รับการอนุมัติ
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="tbl">
                  <tbody>
                    {txs.map(tx => <TxRow key={tx.id} tx={tx} showUser={false}
                      isAdmin={isAdmin} adminName={profile.name} onDeleted={loadTxs} onEdited={loadTxs} />)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { WalletPage });
