// ============ shared.jsx — icons, data, helpers, UI atoms ============
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------- Icons (stroke, 24x24) ---------- */
function Ic({ d, fill, vb = "0 0 24 24", sw = 1.8, ...p }) {
  return (
    <svg viewBox={vb} fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>
      {Array.isArray(d) ? d.map((x, i) => <path key={i} d={x} />) : <path d={d} />}
    </svg>
  );
}
const I = {
  grid: p => <Ic {...p} d={["M4 4h7v7H4z", "M13 4h7v7h-7z", "M13 13h7v7h-7z", "M4 13h7v7H4z"]} />,
  receipt: p => <Ic {...p} d={["M5 3v18l2.5-1.5L10 21l2-1.5L14 21l2.5-1.5L19 21V3l-2.5 1.5L14 3l-2 1.5L10 3 7.5 4.5z", "M8.5 8.5h7", "M8.5 12h7", "M8.5 15.5h4"]} />,
  list: p => <Ic {...p} d={["M8 6h12", "M8 12h12", "M8 18h12", "M3.5 6h.01", "M3.5 12h.01", "M3.5 18h.01"]} />,
  check2: p => <Ic {...p} d={["M9 11l3 3L22 4", "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"]} />,
  gear: p => <Ic {...p} d={["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"]} />,
  search: p => <Ic {...p} d={["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.3-4.3"]} />,
  bell: p => <Ic {...p} d={["M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9", "M13.7 21a2 2 0 0 1-3.4 0"]} />,
  plus: p => <Ic {...p} d={["M12 5v14", "M5 12h14"]} />,
  up: p => <Ic {...p} d={["M7 17L17 7", "M9 7h8v8"]} />,
  down: p => <Ic {...p} d={["M7 7l10 10", "M17 9v8H9"]} />,
  upload: p => <Ic {...p} d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"]} />,
  cal: p => <Ic {...p} d={["M8 2v4", "M16 2v4", "M3 9h18", "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"]} />,
  filter: p => <Ic {...p} d={["M22 3H2l8 9.46V19l4 2v-8.54L22 3z"]} />,
  download: p => <Ic {...p} d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"]} />,
  check: p => <Ic {...p} d="M20 6L9 17l-5-5" />,
  x: p => <Ic {...p} d={["M18 6L6 18", "M6 6l12 12"]} />,
  eye: p => <Ic {...p} d={["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"]} />,
  dots: p => <Ic {...p} fill d={["M12 6a1.6 1.6 0 1 0 0-.01", "M12 12.6a1.6 1.6 0 1 0 0-.01", "M12 19.2a1.6 1.6 0 1 0 0-.01"]} />,
  menu: p => <Ic {...p} d={["M3 6h18", "M3 12h18", "M3 18h18"]} />,
  trend: p => <Ic {...p} d={["M3 17l6-6 4 4 8-8", "M21 7h-5", "M21 7v5"]} />,
  wallet: p => <Ic {...p} d={["M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v3", "M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3", "M21 10h-5a2 2 0 0 0 0 4h5", "M16.5 12h.01"]} />,
  clock: p => <Ic {...p} d={["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7v5l3 2"]} />,
  car: p => <Ic {...p} d={["M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13", "M5 13h14v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z", "M7.5 16h.01", "M16.5 16h.01"]} />,
  box: p => <Ic {...p} d={["M21 8l-9-5-9 5 9 5 9-5z", "M3 8v8l9 5 9-5V8", "M12 13v8"]} />,
  mega: p => <Ic {...p} d={["M3 11l14-7v16l-14-7z", "M3 11v4a2 2 0 0 0 2 2h2", "M9 17v3", "M17 8a3 3 0 0 1 0 6"]} />,
  cup: p => <Ic {...p} d={["M18 8h1a3 3 0 0 1 0 6h-1", "M4 8h14v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z", "M6 2v2", "M10 2v2", "M14 2v2"]} />,
  bolt: p => <Ic {...p} d="M13 2L4.5 13.5H11l-1 8.5L19.5 10.5H13z" />,
  logout: p => <Ic {...p} d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"]} />,
  user: p => <Ic {...p} d={["M20 21a8 8 0 1 0-16 0", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]} />,
  shield: p => <Ic {...p} d={["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "M9 12l2 2 4-4"]} />,
  building: p => <Ic {...p} d={["M3 21h18", "M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16", "M15 21V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v12", "M9 7h2", "M9 11h2", "M9 15h2"]} />,
  chevron: p => <Ic {...p} d="M9 18l6-6-6-6" />,
  edit:   p => <Ic {...p} d={["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"]} />,
  trash:  p => <Ic {...p} d={["M3 6h18","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6","M8 6V4h8v2"]} />,
};

/* ---------- Categories ---------- */
const CATS = {
  travel:  { name: "เดินทาง",        color: "#2D6CB5", icon: I.car },
  supply:  { name: "วัสดุอุปกรณ์",    color: "#1F8A4C", icon: I.box },
  market:  { name: "การตลาด",        color: "#C0852A", icon: I.mega },
  meal:    { name: "รับรอง/อาหาร",   color: "#BF4530", icon: I.cup },
  utility: { name: "สาธารณูปโภค",    color: "#7A52B3", icon: I.bolt },
};
const CAT_KEYS = Object.keys(CATS);

/* ---------- helpers ---------- */
const THB = n => "฿" + Math.round(n).toLocaleString("en-US");
const fmtFull = n => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const todayIso = () => new Date().toISOString().slice(0, 10);
function thDate(iso, withYear) {
  const d = new Date(iso);
  return d.getDate() + " " + THAI_MONTHS[d.getMonth()] + (withYear ? " " + (d.getFullYear() + 543) : "");
}
const STATUS = {
  approved: { th: "อนุมัติแล้ว", cls: "b-green" },
  pending:  { th: "รออนุมัติ",   cls: "b-amber" },
  rejected: { th: "ไม่อนุมัติ",  cls: "b-red" },
};
const AV_COLORS = ["#1B6B3A","#2D6CB5","#C0852A","#7A52B3","#BF4530","#1F8A4C"];
const avColor = name => AV_COLORS[(name.charCodeAt(0) + (name.charCodeAt(2) || 0)) % AV_COLORS.length];
const initials = name => name.replace(/^(นาย|นางสาว|นาง|คุณ)\s*/, "").trim().charAt(0);
const isManager = profile => ["admin", "approver"].includes(profile?.role);
const canEditExpense = (profile, rec) => {
  if (profile?.role === "admin") return true;
  if (profile?.role === "approver" && rec.status === "pending") return true;
  return rec.status === "pending" && rec.submitted_by_id === profile?.id;
};
const csvCell = v => {
  const s = (v ?? "").toString().replace(/\r?\n/g, " ");
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
function downloadCsv(filename, rows) {
  const csv = "\uFEFF" + rows.map(r => r.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function downloadXlsx(filename, rows) {
  const [header, ...data] = rows;
  const ws = window.XLSX.utils.aoa_to_sheet([header, ...data]);
  // ปรับความกว้าง column อัตโนมัติ
  ws["!cols"] = header.map((_, ci) => ({
    wch: Math.max(header[ci]?.toString().length || 10,
      ...data.map(r => (r[ci]?.toString().length || 0))) + 2
  }));
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "รายการเบิกเงิน");
  window.XLSX.writeFile(wb, filename);
}
function useSlipUrl(rec) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (!rec) return;
    if (rec.slip_url) {
      setUrl(rec.slip_url);
      return;
    }
    const local = localStorage.getItem("slip_" + rec.id);
    if (local) {
      setUrl(local);
      return;
    }
    if (rec.slip_path) {
      window.db.storage.from("slips").createSignedUrl(rec.slip_path, 60 * 60)
        .then(({ data, error }) => {
          if (error) console.warn("[Storage] signed URL failed:", error.message);
          if (alive) setUrl(data?.signedUrl || null);
        });
    }
    return () => { alive = false; };
  }, [rec?.id, rec?.slip_path, rec?.slip_url]);
  return url;
}

/* ---------- People ---------- */
const PEOPLE = [
  { name: "ศิริพร วงศ์ทอง",   dept: "การตลาด" },
  { name: "ธนกร อินทรา",      dept: "ปฏิบัติการ" },
  { name: "ปวีณา รัตนชัย",    dept: "การเงิน" },
  { name: "อนุชา ภักดี",      dept: "คลังสินค้า" },
  { name: "กิตติพงษ์ แสงเดือน", dept: "ฝ่ายขาย" },
  { name: "นภัสสร เจริญสุข",   dept: "การตลาด" },
  { name: "วีรภัทร ชูเกียรติ", dept: "ปฏิบัติการ" },
];

/* ---------- Generate records ---------- */
function genRecords() {
  const notes = {
    travel: ["ค่าแท็กซี่ไปพบลูกค้า", "ค่าน้ำมันรถส่งของ", "ค่าเดินทางสัมมนา จ.เชียงใหม่", "ค่าทางด่วน+ที่จอดรถ"],
    supply: ["กระถาง+วัสดุปลูก", "อุปกรณ์สำนักงาน", "ถุงบรรจุภัณฑ์ผลิตภัณฑ์", "เครื่องเขียน+หมึกพิมพ์"],
    market: ["ค่าโฆษณา Facebook Ads", "ออกบูธงานแสดงสินค้า", "ถ่ายภาพผลิตภัณฑ์", "ของแจกลูกค้า"],
    meal:   ["เลี้ยงรับรองคู่ค้า", "อาหารกลางวันทีมงาน", "กาแฟประชุมพันธมิตร"],
    utility:["ค่าไฟฟ้าโรงเรือน", "ค่าอินเทอร์เน็ตสำนักงาน", "ค่าน้ำประปา"],
  };
  const recs = [];
  const today = new Date("2026-05-29");
  let id = 1048;
  for (let i = 0; i < 64; i++) {
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.4) * 58);
    const d = new Date(today); d.setDate(d.getDate() - daysAgo);
    const cat = CAT_KEYS[Math.floor(Math.random() * CAT_KEYS.length)];
    const p = PEOPLE[Math.floor(Math.random() * PEOPLE.length)];
    const base = { travel: 850, supply: 2400, market: 6500, meal: 1500, utility: 4200 }[cat];
    const amt = Math.round((base * (0.4 + Math.random() * 1.8)) / 10) * 10;
    let status = "approved";
    if (daysAgo <= 4) status = Math.random() < 0.7 ? "pending" : (Math.random() < 0.5 ? "approved" : "rejected");
    else if (Math.random() < 0.08) status = "rejected";
    recs.push({
      id: "EXP-" + (id--),
      date: d.toISOString().slice(0, 10),
      person: p.name, dept: p.dept,
      cat, amount: amt, status,
      note: notes[cat][Math.floor(Math.random() * notes[cat].length)],
      hue: Math.floor(Math.random() * 360),
    });
  }
  return recs.sort((a, b) => b.date.localeCompare(a.date));
}

/* ---------- Fake receipt SVG (slip placeholder) ---------- */
function ReceiptSVG({ hue = 140, className }) {
  const c = `hsl(${hue} 22% 88%)`, c2 = `hsl(${hue} 20% 78%)`, bg = `hsl(${hue} 30% 96%)`;
  return (
    <svg className={className} viewBox="0 0 40 48" preserveAspectRatio="xMidYMid slice">
      <rect width="40" height="48" fill={bg} />
      <rect x="6" y="6" width="20" height="3" rx="1.5" fill={c2} />
      <rect x="6" y="13" width="28" height="2" rx="1" fill={c} />
      <rect x="6" y="18" width="28" height="2" rx="1" fill={c} />
      <rect x="6" y="23" width="22" height="2" rx="1" fill={c} />
      <line x1="6" y1="30" x2="34" y2="30" stroke={c2} strokeWidth="1" strokeDasharray="2 2" />
      <rect x="6" y="35" width="12" height="3" rx="1.5" fill={c2} />
      <rect x="24" y="35" width="10" height="3" rx="1.5" fill={c2} />
    </svg>
  );
}

/* ---------- UI atoms ---------- */
function Badge({ status }) {
  const s = STATUS[status];
  return <span className={"badge " + s.cls}><span className="bd"></span>{s.th}</span>;
}
function CatChip({ cat, dotOnly }) {
  const c = CATS[cat];
  if (dotOnly) return <span className="cat-dot" style={{ background: c.color }}></span>;
  return <span className="cat-chip"><span className="cat-dot" style={{ background: c.color }}></span>{c.name}</span>;
}
function Avatar({ name, size }) {
  const st = size ? { width: size, height: size, fontSize: size * 0.42 } : null;
  return <span className="avatar" style={{ background: avColor(name), ...st }}>{initials(name)}</span>;
}

/* ---------- Count-up hook ---------- */
function useCountUp(target, dur = 1000, run = true) {
  const [v, setV] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (!run) { setV(target); return; }
    let start;
    const tick = t => {
      if (!start) start = t;
      const p = Math.min((t - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(target * e);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, run]);
  return v;
}

/* ---------- Toast system ---------- */
const ToastCtx = React.createContext(() => {});
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, kind = "ok") => {
    const id = Math.random();
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3400);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={"toast " + t.kind}>
            <span className="ti">{t.kind === "ok" ? <I.check /> : t.kind === "warn" ? <I.x /> : <I.bell />}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => React.useContext(ToastCtx);

Object.assign(window, {
  useState, useEffect, useRef, useMemo, useCallback,
  Ic, I, CATS, CAT_KEYS, THB, fmtFull, thDate, THAI_MONTHS, STATUS,
  todayIso, avColor, initials, isManager, canEditExpense, downloadCsv, downloadXlsx, useSlipUrl, PEOPLE, genRecords, ReceiptSVG,
  Badge, CatChip, Avatar, useCountUp, ToastProvider, useToast,
});
