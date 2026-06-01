// ============ expenseform.jsx ============
function CatPicker({ value, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
      {CAT_KEYS.map(k => {
        const c = CATS[k]; const Icon = c.icon; const on = value === k;
        return (
          <button key={k} type="button" onClick={() => onChange(k)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 14,
              border: "1.6px solid " + (on ? c.color : "var(--line)"),
              background: on ? c.color + "12" : "var(--surface)", transition: ".2s", textAlign: "left",
              boxShadow: on ? "0 0 0 3px " + c.color + "1f" : "none",
            }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, flex: "none", display: "grid", placeItems: "center",
              background: c.color + "1a", color: c.color }}><Icon style={{ width: 18, height: 18 }} /></span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: on ? c.color : "var(--ink)" }}>{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function Dropzone({ files, setFiles }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const addFiles = list => {
    Array.from(list).forEach(f => {
      if (f.size > 10 * 1024 * 1024) return;
      const id = Math.random();
      const entry = { id, name: f.name, size: (f.size / 1024).toFixed(0) + " KB", hue: Math.floor(Math.random() * 360), dataUrl: null, fileObj: f };
      setFiles(prev => [...prev, entry]);
      if (f.type && (f.type.startsWith("image/") || f.type === "application/pdf")) {
        const reader = new FileReader();
        reader.onload = e => setFiles(prev => prev.map(x => x.id === id ? { ...x, dataUrl: e.target.result } : x));
        reader.readAsDataURL(f);
      }
    });
  };
  return (
    <div>
      <div className={"dropzone" + (drag ? " drag" : "")}
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); else addFiles([{ name: "slip_" + Date.now() + ".jpg", size: 1234 * 200 }]); }}>
        <div className="dz-ic"><I.upload /></div>
        <div style={{ fontWeight: 600, fontSize: 14.5 }}>ลากไฟล์สลิป/ใบเสร็จมาวางที่นี่</div>
        <div className="hint" style={{ marginTop: 4 }}>หรือคลิกเพื่อเลือกไฟล์ · รองรับ JPG, PNG, PDF (ไม่เกิน 10MB)</div>
        <input ref={inputRef} type="file" multiple accept="image/*,.pdf" style={{ display: "none" }}
          onChange={e => { if (e.target.files.length) addFiles(e.target.files); }} />
      </div>
      {files.length > 0 && (
        <div className="dz-files">
          {files.map(f => (
            <div className="dz-file" key={f.id}>
              <div className="pv" style={{ overflow: "hidden" }}>
                {f.dataUrl
                  ? <img src={f.dataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <ReceiptSVG hue={f.hue} className="rcpt" />}
              </div>
              <div className="meta">
                <div className="fn">{f.name}</div>
                <div className="fs num">{f.size}</div>
              </div>
              <span className="badge b-green"><I.check style={{ width: 13, height: 13 }} />อัปโหลดแล้ว</span>
              <button className="icon-btn" type="button" onClick={() => setFiles(arr => arr.filter(x => x.id !== f.id))}><I.x /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpenseForm({ onSubmit, goList, profile, appSettings }) {
  const toast = useToast();
  const today = todayIso();
  const [date, setDate] = useState(today);
  const [person, setPerson] = useState(profile?.name || "");
  const [dept, setDept]     = useState(profile?.dept || "");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("travel");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState([]);


  const [submitting, setSubmitting] = useState(false);
  const valid = amount && Number(amount) > 0 && person && date;
  const submit = async e => {
    e.preventDefault();
    if (!valid) { toast("กรุณากรอกจำนวนเงินและข้อมูลให้ครบ", "warn"); return; }
    if (files.length === 0) { toast("กรุณาแนบไฟล์สลิป/ใบเสร็จ", "warn"); return; }
    setSubmitting(true);
    const newId = "EXP-" + Date.now().toString().slice(-8);

    // ─── อัปโหลด slip ไป Supabase Storage ───
    let slip_path = null;
    let slip_url = null;
    const slipFile = files.find(f => f.fileObj);
    if (slipFile?.fileObj) {
      const ext  = slipFile.fileObj.name.split(".").pop() || "jpg";
      const path = (profile?.id || "anonymous") + "/" + newId + "." + ext.toLowerCase();
      const { error: upErr } = await window.db.storage
        .from("slips").upload(path, slipFile.fileObj, { upsert: true });
      if (!upErr) {
        slip_path = path;
        console.log("[Storage] slip uploaded:", slip_path);
      } else {
        console.warn("[Storage] upload failed:", upErr.message);
      }
      // fallback: เก็บใน localStorage ด้วยเสมอ (ใช้ดูออฟไลน์)
      if (slipFile.dataUrl) {
        try { localStorage.setItem("slip_" + newId, slipFile.dataUrl); } catch (_) {}
      }
    }

    // ตรวจ auto-approve
    const amt = Number(amount);
    const autoOk = appSettings?.autoApprove && amt < Number(appSettings?.autoApproveLimit || 5000);
    const status = autoOk ? "approved" : "pending";
    const approvedFields = autoOk
      ? { approved_by: "ระบบ (อนุมัติอัตโนมัติ)", approved_at: new Date().toISOString() }
      : {};

    const { error } = await onSubmit({
      id: newId, date, person, dept,
      amount: amt, cat,
      note: note || CATS[cat].name,
      status,
      hue: files[0]?.hue || 140,
      slip_path, slip_url,
      submitted_by: profile?.name || person,
      submitted_by_id: profile?.id || null,
      ...approvedFields,
    });
    setSubmitting(false);
    if (error) { toast("เกิดข้อผิดพลาด: " + error.message, "warn"); return; }

    // แจ้งเตือน LINE (silent — ไม่ block ถ้า fail)
    fetch("/api/notify-line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newId, person, amount,
        cat: CATS[cat]?.name || cat,
        note: note || CATS[cat]?.name,
      }),
    }).catch(() => {});

    toast(autoOk ? "✅ อนุมัติอัตโนมัติแล้ว (ยอดต่ำกว่า ฿" + Number(appSettings?.autoApproveLimit||5000).toLocaleString() + ")" : "ส่งรายการเบิกเข้าระบบแล้ว · รอการอนุมัติ", "ok");
    goList();
  };

  return (
    <div className="page" style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)", gap: 18 }} className="form-grid">
        {/* form */}
        <form className="card card-pad" onSubmit={submit} style={{ padding: 28 }}>
          <div className="section-head" style={{ marginBottom: 22 }}>
            <div><h2>รายละเอียดการเบิก</h2><span className="sub">กรอกข้อมูลและแนบหลักฐานการจ่าย</span></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>วันที่ <span className="req">*</span></label>
              <input type="date" className="inp" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label>จำนวนเงิน <span className="req">*</span></label>
              <div className="inp-money">
                <span className="cur">฿</span>
                <input className="inp" inputMode="decimal" placeholder="0.00" value={amount}
                  onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>ชื่อผู้เบิก <span className="req">*</span></label>
              <input className="inp" placeholder="ชื่อ-นามสกุล" value={person}
                onChange={e => setPerson(e.target.value)} />
            </div>
            <div className="field">
              <label>แผนก</label>
              <input className="inp" value={dept} onChange={e => setDept(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>หมวดหมู่ค่าใช้จ่าย <span className="req">*</span></label>
            <CatPicker value={cat} onChange={setCat} />
          </div>

          <div className="field">
            <label>รายละเอียด / หมายเหตุ</label>
            <textarea className="inp" placeholder="เช่น ค่าแท็กซี่ไปพบลูกค้าที่สำนักงานใหญ่" value={note} onChange={e => setNote(e.target.value)}></textarea>
          </div>

          <div className="field" style={{ marginBottom: 24 }}>
            <label>แนบไฟล์สลิป / ใบเสร็จ <span className="req">*</span></label>
            <Dropzone files={files} setFiles={setFiles} />
          </div>

          <div className="flex gap-12">
            <button type="submit" className="btn-primary" disabled={submitting} style={{ opacity: submitting ? .7 : 1 }}>
              {submitting ? <span style={{ width:18,height:18,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block" }}></span> : <I.check2 />}
              {submitting ? "กำลังบันทึก…" : "ส่งรายการเบิก"}
            </button>
            <button type="button" className="btn-ghost" onClick={goList} disabled={submitting}>ยกเลิก</button>
          </div>
        </form>

        {/* live preview */}
        <div className="col" style={{ gap: 18 }}>
          <div className="card card-pad" style={{ position: "sticky", top: 92 }}>
            <div className="section-head"><div><h2>ตัวอย่างรายการ</h2><span className="sub">ดูก่อนส่ง</span></div></div>
            <div style={{ border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ background: "var(--leaf-grad)", padding: "18px 20px", color: "#fff" }}>
                <div style={{ fontSize: 12.5, opacity: .8 }}>จำนวนเงินที่เบิก</div>
                <div className="num" style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-.5px" }}>
                  ฿{amount ? fmtFull(Number(amount)) : "0.00"}
                </div>
              </div>
              <div style={{ padding: "16px 20px" }} className="col gap-12">
                <PreviewRow k="ผู้เบิก" v={<div className="who"><Avatar name={person} size={28} /><span style={{ fontWeight: 600, fontSize: 13.5 }}>{person}</span></div>} />
                <PreviewRow k="แผนก" v={dept} />
                <PreviewRow k="หมวดหมู่" v={<CatChip cat={cat} />} />
                <PreviewRow k="วันที่" v={thDate(date, true)} />
                <PreviewRow k="หลักฐาน" v={<span style={{ color: files.length ? "var(--green)" : "var(--ink-3)", fontWeight: 600, fontSize: 13.5 }}>{files.length ? files.length + " ไฟล์" : "ยังไม่แนบ"}</span>} />
                <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 12, marginTop: 4 }}>
                  <span className="badge b-amber"><span className="bd"></span>จะถูกตั้งเป็น "รออนุมัติ"</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:920px){.form-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
function PreviewRow({ k, v }) {
  return (
    <div className="flex items-center" style={{ justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "var(--ink-3)", fontSize: 13 }}>{k}</span>
      <span style={{ fontSize: 13.5, textAlign: "right" }}>{v}</span>
    </div>
  );
}

Object.assign(window, { ExpenseForm });
