// ============ dashboard.jsx ============
function StatCard({ icon: Icon, label, value, prefix, delta, up, tint, bg, run, delay }) {
  const n = useCountUp(value, 1100, run);
  return (
    <div className="stat" style={{ animationDelay: (delay || 0) + "ms" }}>
      <div className="glow" style={{ background: tint }}></div>
      <div className="ic" style={{ background: bg, color: tint }}><Icon /></div>
      <div className="lab">{label}</div>
      <div className="val num">{prefix && <span className="cur">{prefix}</span>}{Math.round(n).toLocaleString("en-US")}</div>
      {delta != null && (
        <div className={"delta " + (up ? "up" : "down")}>
          {up ? <I.up /> : <I.down />}{Math.abs(delta)}% เทียบช่วงก่อน
        </div>
      )}
    </div>
  );
}

/* Animated SVG line+area chart */
function TrendChart({ data, color = "#1B6B3A" }) {
  const [hover, setHover] = useState(null);
  const W = 760, H = 230, pad = { l: 12, r: 12, t: 16, b: 28 };
  const max = Math.max(...data.map(d => d.v)) * 1.18 || 1;
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const x = i => pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = v => pad.t + ih - (v / max) * ih;
  const pts = data.map((d, i) => [x(i), y(d.v)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L${x(data.length - 1)} ${pad.t + ih} L${x(0)} ${pad.t + ih} Z`;
  const [len, setLen] = useState(0);
  const pathRef = useRef(null);
  useEffect(() => {
    if (pathRef.current) { const L = pathRef.current.getTotalLength(); setLen(L); }
  }, [data]);
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
        onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="area-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((g, i) => (
          <line key={i} x1={pad.l} x2={W - pad.r} y1={pad.t + ih * g} y2={pad.t + ih * g}
            stroke="#EFF3EF" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#area-g)" style={{ opacity: len ? 1 : 0, transition: "opacity .6s .4s" }} />
        <path ref={pathRef} d={line} fill="none" stroke={color} strokeWidth="2.6"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: len, strokeDashoffset: len, animation: len ? "draw 1.4s cubic-bezier(.4,0,.2,1) forwards" : "none" }} />
        {pts.map((p, i) => (
          <g key={i}>
            <rect x={x(i) - iw / data.length / 2} y={pad.t} width={iw / data.length} height={ih}
              fill="transparent" onMouseEnter={() => setHover(i)} />
            <circle cx={p[0]} cy={p[1]} r={hover === i ? 6 : 3.5} fill="#fff" stroke={color} strokeWidth="2.4"
              style={{ transition: "r .15s", opacity: len ? 1 : 0 }} />
          </g>
        ))}
        {data.map((d, i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fill="#8A938C"
            fontFamily="Anuphan">{d.lab}</text>
        ))}
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          </g>
        )}
      </svg>
      {hover != null && (
        <div style={{
          position: "absolute", left: `${(x(hover) / W) * 100}%`, top: 0, transform: "translateX(-50%)",
          background: "var(--ink)", color: "#fff", padding: "7px 12px", borderRadius: 10, fontSize: 13,
          fontWeight: 600, whiteSpace: "nowrap", pointerEvents: "none", boxShadow: "var(--sh-2)"
        }}>
          <div style={{ opacity: .7, fontSize: 11, fontWeight: 500 }}>{data[hover].lab}</div>
          <span className="num">{THB(data[hover].v)}</span>
        </div>
      )}
      <style>{`@keyframes draw{to{stroke-dashoffset:0}}`}</style>
    </div>
  );
}

/* Category breakdown bars */
function CatBreakdown({ items, total }) {
  return (
    <div className="col" style={{ gap: 18 }}>
      {items.map((it, i) => {
        const pct = total ? (it.v / total) * 100 : 0;
        return (
          <div key={it.cat}>
            <div className="flex items-center" style={{ marginBottom: 7 }}>
              <CatChip cat={it.cat} />
              <span className="ml-auto num" style={{ fontWeight: 700, fontSize: 14 }}>{THB(it.v)}</span>
              <span className="num" style={{ color: "var(--ink-3)", fontSize: 12.5, width: 44, textAlign: "right" }}>{pct.toFixed(0)}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: "var(--line-2)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: pct + "%", borderRadius: 6, background: CATS[it.cat].color,
                transition: "width 1s cubic-bezier(.22,1,.36,1)", transitionDelay: i * 90 + "ms"
              }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Dashboard({ records, period, setPeriod, goCreate }) {
  const [run, setRun] = useState(false);
  useEffect(() => { const t = setTimeout(() => setRun(true), 80); return () => clearTimeout(t); }, []);

  const todayKey = todayIso();
  const today = new Date(todayKey);
  const inPeriod = (iso, days) => (today - new Date(iso)) / 86400000 < days;

  const approved = records.filter(r => r.status === "approved");
  const sumDay = approved.filter(r => r.date === todayKey).reduce((s, r) => s + r.amount, 0)
    || approved.filter(r => inPeriod(r.date, 1.5)).reduce((s, r) => s + r.amount, 0);
  const sumWeek = approved.filter(r => inPeriod(r.date, 7)).reduce((s, r) => s + r.amount, 0);
  const sumMonth = approved.filter(r => inPeriod(r.date, 30)).reduce((s, r) => s + r.amount, 0);
  const pendingCount = records.filter(r => r.status === "pending").length;
  const pendingSum = records.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0);

  // trend data depends on period
  const trend = useMemo(() => {
    if (period === "day") {
      // last 7 days
      const arr = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        const v = approved.filter(r => r.date === iso).reduce((s, r) => s + r.amount, 0);
        arr.push({ lab: ["อา","จ","อ","พ","พฤ","ศ","ส"][d.getDay()], v });
      }
      return arr;
    }
    if (period === "week") {
      const arr = [];
      for (let w = 5; w >= 0; w--) {
        const v = approved.filter(r => { const dd = (today - new Date(r.date)) / 86400000; return dd >= w * 7 && dd < (w + 1) * 7; }).reduce((s, r) => s + r.amount, 0);
        arr.push({ lab: "สัปดาห์ " + (6 - w), v });
      }
      return arr;
    }
    // month -> last 6 months
    const arr = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date(today); d.setMonth(d.getMonth() - m);
      const v = approved.filter(r => { const rd = new Date(r.date); return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear(); }).reduce((s, r) => s + r.amount, 0);
      arr.push({ lab: THAI_MONTHS[d.getMonth()], v });
    }
    return arr;
  }, [period, records]);

  const windowDays = period === "day" ? 1.5 : period === "week" ? 7 : 30;
  const catItems = useMemo(() => {
    const map = {};
    CAT_KEYS.forEach(c => map[c] = 0);
    approved.filter(r => inPeriod(r.date, windowDays === 1.5 ? 7 : windowDays)).forEach(r => map[r.cat] += r.amount);
    return CAT_KEYS.map(c => ({ cat: c, v: map[c] })).sort((a, b) => b.v - a.v);
  }, [period, records]);
  const catTotal = catItems.reduce((s, c) => s + c.v, 0);

  const recent = records.slice(0, 6);

  return (
    <div className="page">
      {/* period switch */}
      <div className="flex items-center wrap gap-12" style={{ marginBottom: 22 }}>
        <div className="seg">
          {[["day","รายวัน"],["week","รายสัปดาห์"],["month","รายเดือน"]].map(([k, l]) => (
            <button key={k} className={period === k ? "on" : ""} onClick={() => setPeriod(k)}>{l}</button>
          ))}
        </div>
        <span style={{ color: "var(--ink-3)", fontSize: 13.5 }} className="hide-sm">
          ข้อมูล ณ วันที่ {thDate(todayKey, true)}
        </span>
        <button className="btn-primary ml-auto" onClick={goCreate}><I.plus />สร้างรายการเบิก</button>
      </div>

      {/* stat cards */}
      <div className="stat-grid">
        <StatCard icon={I.wallet} label="ยอดเบิกวันนี้" value={sumDay} prefix="฿" delta={8} up tint="#1B6B3A" bg="var(--brand-50)" run={run} delay={0} />
        <StatCard icon={I.cal} label="ยอดสัปดาห์นี้" value={sumWeek} prefix="฿" delta={12} up tint="#2D6CB5" bg="var(--blue-bg)" run={run} delay={70} />
        <StatCard icon={I.trend} label="ยอดเดือนนี้" value={sumMonth} prefix="฿" delta={4} up={false} tint="#C0852A" bg="var(--amber-bg)" run={run} delay={140} />
        <StatCard icon={I.clock} label="รออนุมัติ" value={pendingCount} delta={null} tint="#BF4530" bg="var(--red-bg)" run={run} delay={210} />
      </div>

      {/* chart + breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.85fr) minmax(0,1fr)", gap: 18, marginTop: 18 }} className="dash-grid">
        <div className="card card-pad">
          <div className="section-head">
            <div>
              <h2>แนวโน้มค่าใช้จ่าย</h2>
              <span className="sub">เฉพาะรายการที่อนุมัติแล้ว · {period === "day" ? "7 วันล่าสุด" : period === "week" ? "6 สัปดาห์ล่าสุด" : "6 เดือนล่าสุด"}</span>
            </div>
            <span className="badge b-green ml-auto"><span className="bd"></span>อนุมัติแล้ว</span>
          </div>
          <TrendChart data={trend} />
        </div>
        <div className="card card-pad">
          <div className="section-head">
            <div><h2>แยกตามหมวดหมู่</h2><span className="sub">รวม {THB(catTotal)}</span></div>
          </div>
          <CatBreakdown items={catItems} total={catTotal} />
        </div>
      </div>

      {/* recent + pending callout */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.85fr) minmax(0,1fr)", gap: 18, marginTop: 18 }} className="dash-grid">
        <div className="card">
          <div className="card-pad" style={{ paddingBottom: 6 }}>
            <div className="section-head"><h2>รายการล่าสุด</h2><span className="sub ml-auto hide-sm">6 รายการ</span></div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <tbody>
                {recent.map(r => (
                  <tr key={r.id}>
                    <td style={{ width: 54 }}><div className="slip-thumb"><ReceiptSVG hue={r.hue} className="rcpt" /></div></td>
                    <td>
                      <div className="who"><Avatar name={r.person} /><div><div className="nm">{r.person}</div><div className="dp">{r.note}</div></div></div>
                    </td>
                    <td className="hide-sm"><CatChip cat={r.cat} /></td>
                    <td className="hide-sm" style={{ color: "var(--ink-3)", fontSize: 13 }}>{thDate(r.date)}</td>
                    <td className="ta-r"><span className="amount num">{THB(r.amount)}</span></td>
                    <td className="ta-r"><Badge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card card-pad" style={{ background: "var(--leaf-grad)", color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -40, top: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.08)" }}></div>
          <div className="ic" style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(255,255,255,.16)", display: "grid", placeItems: "center", marginBottom: 18 }}>
            <I.clock style={{ width: 24, height: 24 }} />
          </div>
          <div style={{ fontSize: 14, opacity: .82 }}>มูลค่ารออนุมัติทั้งหมด</div>
          <div className="num" style={{ fontSize: 34, fontWeight: 700, marginTop: 4, letterSpacing: "-.5px" }}>{THB(pendingSum)}</div>
          <div style={{ fontSize: 13.5, opacity: .82, marginTop: 4 }}>{pendingCount} รายการรอการตรวจสอบ</div>
        </div>
      </div>
      <style>{`@media(max-width:980px){.dash-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

Object.assign(window, { Dashboard });
