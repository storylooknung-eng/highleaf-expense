// ============ auth.jsx — Login / Register ============
function AuthPage() {
  const [mode, setMode]       = useState("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [dept, setDept]       = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");
  const [info, setInfo]       = useState("");

  const switchMode = m => { setMode(m); setErr(""); setInfo(""); };

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setErr(""); setInfo("");

    if (mode === "login") {
      const { error } = await window.db.auth.signInWithPassword({ email, password });
      if (error) {
        setErr(
          error.message === "Invalid login credentials"
            ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
            : error.message === "Email not confirmed"
            ? "กรุณายืนยันอีเมลของคุณก่อน (ตรวจสอบ inbox)"
            : error.message
        );
        setLoading(false);
      }
      // auth state change ใน app.jsx จะ redirect ให้เอง

    } else {
      if (!name.trim())  { setErr("กรุณากรอกชื่อ"); setLoading(false); return; }
      if (password.length < 6) { setErr("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); setLoading(false); return; }

      const { data, error } = await window.db.auth.signUp({ email, password });
      if (error) { setErr(error.message); setLoading(false); return; }

      if (data.user) {
        // ตรวจว่าเป็นผู้ใช้คนแรกหรือไม่ → ให้เป็น admin
        const { count } = await window.db
          .from("user_profiles")
          .select("*", { count: "exact", head: true });
        const role = (count === 0) ? "admin" : "staff";

        // พยายาม insert พร้อม email — ถ้า column ไม่มีให้ retry โดยไม่มี email
        const tryInsert = async (withEmail) => {
          const payload = { id: data.user.id, name: name.trim(), dept: dept.trim(), role };
          if (withEmail) payload.email = email.trim();
          return window.db.from("user_profiles").insert(payload);
        };

        let { error: profileError } = await tryInsert(true);

        // email column ยังไม่มี → retry ไม่ใส่ email
        if (profileError?.message?.includes("email")) {
          const r2 = await tryInsert(false);
          profileError = r2.error;
        }

        // admin insert ถูกบล็อกโดย policy → ลอง staff แทน (admin จะถูก set ด้วย SQL function)
        if (profileError && role === "admin") {
          const r3 = await tryInsert(true);
          profileError = r3.error?.message?.includes("email")
            ? (await tryInsert(false)).error
            : r3.error;
        }

        if (profileError) {
          setErr("สมัครสมาชิกสำเร็จ แต่สร้างโปรไฟล์ไม่สำเร็จ: " + profileError.message);
          setLoading(false);
          return;
        }
      }

      setInfo("สมัครสมาชิกแล้ว! " + (data.session ? "" : "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ"));
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 20, background: "var(--leaf-grad)",
            display: "inline-grid", placeItems: "center",
            boxShadow: "var(--sh-brand)", marginBottom: 16,
          }}>
            <img src="assets/logo-mark.png" style={{ width: 46, height: 46, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-.3px" }}>ไฮลีฟ โกบอล</div>
          <div style={{ color: "var(--ink-3)", fontSize: 13.5, marginTop: 3 }}>ระบบเบิกเงินภายในบริษัท</div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <div className="seg" style={{ marginBottom: 24, width: "100%" }}>
            <button style={{ flex: 1 }} className={mode === "login" ? "on" : ""} onClick={() => switchMode("login")}>เข้าสู่ระบบ</button>
            <button style={{ flex: 1 }} className={mode === "register" ? "on" : ""} onClick={() => switchMode("register")}>สมัครสมาชิก</button>
          </div>

          <form onSubmit={submit}>
            {mode === "register" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 0 }}>
                <div className="field">
                  <label>ชื่อ-นามสกุล <span className="req">*</span></label>
                  <input className="inp" placeholder="ฟร้อง ใจดี" value={name} onChange={e => setName(e.target.value)} autoFocus />
                </div>
                <div className="field">
                  <label>แผนก</label>
                  <input className="inp" placeholder="การตลาด" value={dept} onChange={e => setDept(e.target.value)} />
                </div>
              </div>
            )}

            <div className="field">
              <label>อีเมล <span className="req">*</span></label>
              <input className="inp" type="email" placeholder="you@highleaf.co.th"
                value={email} onChange={e => setEmail(e.target.value)}
                autoFocus={mode === "login"} />
            </div>

            <div className="field" style={{ marginBottom: 20 }}>
              <label>รหัสผ่าน <span className="req">*</span></label>
              <input className="inp" type="password" placeholder="อย่างน้อย 6 ตัวอักษร"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {err && (
              <div style={{
                background: "var(--red-bg)", color: "var(--red)",
                padding: "11px 16px", borderRadius: 12, fontSize: 13.5, marginBottom: 16,
              }}>{err}</div>
            )}
            {info && (
              <div style={{
                background: "var(--green-bg)", color: "var(--green)",
                padding: "11px 16px", borderRadius: 12, fontSize: 13.5, marginBottom: 16,
              }}>{info}</div>
            )}

            <button type="submit" className="btn-primary"
              style={{ width: "100%", justifyContent: "center", height: 48, fontSize: 15 }}
              disabled={loading}>
              {loading
                ? <span style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }}></span>
                : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"
              }
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 12.5, color: "var(--ink-3)" }}>
          HIGHLEAF Global · ระบบเบิกเงินภายใน
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

Object.assign(window, { AuthPage });
