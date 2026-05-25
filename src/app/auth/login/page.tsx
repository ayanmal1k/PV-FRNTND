"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mapSupabaseSession, supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";

const inp: React.CSSProperties = {
  width: "100%", border: "1px solid #ccc", borderRadius: 3,
  padding: "10px 12px", fontSize: 14, outline: "none",
};
const btn: React.CSSProperties = {
  width: "100%", background: "#33a137", color: "#fff", border: "none",
  borderRadius: 3, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer",
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: String(form.get("email") || ""),
        password: String(form.get("password") || ""),
      });
      if (authError) throw authError;
      if (!data.session) throw new Error("No Supabase session returned");

      const session = mapSupabaseSession(data.session);
      setAuth(session.user, session.accessToken, session.refreshToken);
      router.push("/dashboard");
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function handleOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      if (!otpSent) {
        const { error: authError } = await supabase.auth.signInWithOtp({
          phone: String(form.get("phone") || ""),
        });
        if (authError) throw authError;
        setOtpSent(true);
      } else {
        const { data, error: authError } = await supabase.auth.verifyOtp({
          phone: String(form.get("phone") || ""),
          token: String(form.get("code") || ""),
          type: "sms",
        });
        if (authError) throw authError;
        if (!data.session) throw new Error("No Supabase session returned");

        const session = mapSupabaseSession(data.session);
        setAuth(session.user, session.accessToken, session.refreshToken);
        router.push("/dashboard");
      }
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ background: "#f5f5f5", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 3, padding: 32 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 48, height: 48, background: "#33a137", color: "#fff",
            fontWeight: 900, fontSize: 22, borderRadius: 4, marginBottom: 10,
          }}>PV</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#333", margin: 0 }}>Sign in to PropVault</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Pakistan&apos;s #1 Property Portal</p>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", border: "1px solid #e0e0e0", borderRadius: 3, marginBottom: 20, overflow: "hidden" }}>
          {(["email", "otp"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{
              flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: "none", background: mode === m ? "#33a137" : "#fff", color: mode === m ? "#fff" : "#555",
            }}>
              {m === "email" ? "Email / Password" : "SMS OTP"}
            </button>
          ))}
        </div>

        {mode === "email" ? (
          <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input name="email" type="email" required placeholder="Email address" style={inp} />
            <input name="password" type="password" required placeholder="Password" style={inp} />
            {error && <p style={{ fontSize: 12, color: "#c00", margin: 0 }}>{error}</p>}
            <button type="submit" disabled={loading} style={btn}>{loading ? "Signing in…" : "Sign In"}</button>
          </form>
        ) : (
          <form onSubmit={handleOtp} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input name="phone" required placeholder="+923001234567" style={inp} />
            {otpSent && <input name="code" required placeholder="6-digit OTP" style={inp} maxLength={6} />}
            {error && <p style={{ fontSize: 12, color: "#c00", margin: 0 }}>{error}</p>}
            <button type="submit" disabled={loading} style={btn}>{loading ? "Sending…" : otpSent ? "Verify OTP" : "Send OTP"}</button>
          </form>
        )}

        <p style={{ textAlign: "center", fontSize: 13, color: "#888", marginTop: 20 }}>
          No account?{" "}
          <Link href="/auth/register" style={{ color: "#33a137", fontWeight: 700 }}>Register free</Link>
        </p>
      </div>
    </div>
  );
}
