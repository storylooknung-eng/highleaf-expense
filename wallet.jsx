// ============ wallet.jsx — กระเป๋าเงิน / ตัดบิล ============

const BILL_CATS = [
  { k: "promote",  label: "ค่าโปรโมทไลฟ์"      },
  { k: "ads",      label: "ค่าโฆษณา"            },
  { k: "shipping", label: "ค่าขนส่ง"            },
  { k: "stock",    label: "ซื้อสต็อกสินค้า"     },
  { k: "salary",   label: "ค่าจ้าง/ค่าแรง"      },
  { k: "other",    label: "อื่นๆ"               },
];

function WalletBalanceCard({ balance, credit, debit, run }) {
  const n = useCountUp(balance, 1100, run);
  const safe = balance >= 0;
  return (
    <div className="card card-pad" style={{
      background: safe ? "var(--leaf-grad)" : "linear-gradient(135deg,#BF4530 0%,#8B2F20 100%)",
      color: "#fff", position: "relative", overflow: "hidden", marginBottom: 18
    }}>
      <div style={{ position: "absolute", right: -50, top: -50, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.07)" }}></div>
      <div style={{ position: "absolute", right: 60, bottom: -60, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.05)" }}></div>
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

function BillForm({ userId, onSuccess }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ amount: "", description: "", cat: "promote" });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { toast("กรุณาระบุจำนวนเงินที่ถูกต้อง", "warn"); return; }
    if (!form.description.trim()) { toast("กรุณาระบุรายละเอียด", "warn"); return; }
    setSaving(true);
    const catLabel = BILL_CATS.find(c => c.k === form.cat)?.label || form.cat;
    const { error } = await window.db.from("wallet_transactions").insert({
      user_id: userId,
      type: "debit",
      amount: amt,
      description: `[${catLabel}] ${form.description.trim()}`,
    });
    setSaving(false);
    if (error) { toast("เกิดข้อผิดพลาด: " + error.message, "warn"); return; }
    toast("ตัดบิลสำเร็จ ฿" + amt.toLocaleString("en-US"));
    setForm({ amount: "", description: "", cat: "promote" });
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

function TxRow({ tx }) {
  const isCredit = tx.type === "credit";
  return (
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
        <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)" }}>{tx.description}</div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
          {thDate(tx.created_at.slice(0, 10), true)} · {tx.created_at.slice(11, 16)} น.
        </div>
      </td>
      <td className="ta-r">
        <span className={"num"} style={{
          fontWeight: 700, fontSize: 15,
          color: isCredit ? "var(--brand)" : "#BF4530"
        }}>
          {isCredit ? "+" : "−"}{THB(tx.amount)}
        </span>
      </td>
    </tr>
  );
}

function WalletPage({ profile }) {
  const toast = useToast();
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState(false);

  const loadTxs = async () => {
    setLoading(true);
    const { data, error } = await window.db
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    if (error) toast("โหลดข้อมูลไม่สำเร็จ: " + error.message, "warn");
    setTxs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadTxs();
    const t = setTimeout(() => setRun(true), 80);
    return () => clearTimeout(t);
  }, [profile.id]);

  const credit = txs.filter(t => t.type === "credit").reduce((s, t) => s + Number(t.amount), 0);
  const debit  = txs.filter(t => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0);
  const balance = credit - debit;

  if (loading) return (
    <div className="page" style={{ display: "grid", placeItems: "center", minHeight: 300 }}>
      <div style={{ textAlign: "center", color: "var(--ink-3)" }}>กำลังโหลด…</div>
    </div>
  );

  return (
    <div className="page">
      <WalletBalanceCard balance={balance} credit={credit} debit={debit} run={run} />
      <BillForm userId={profile.id} onSuccess={loadTxs} />

      <div className="card">
        <div className="card-pad" style={{ paddingBottom: 6 }}>
          <div className="section-head">
            <h2>ประวัติธุรกรรม</h2>
            <span className="sub ml-auto">{txs.length} รายการ</span>
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
                {txs.map(tx => <TxRow key={tx.id} tx={tx} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { WalletPage });
