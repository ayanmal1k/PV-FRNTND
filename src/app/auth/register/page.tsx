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

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const firstName = String(form.get("firstName") || "");
      const lastName = String(form.get("lastName") || "");
      const { data, error: authError } = await supabase.auth.signUp({
        email: String(form.get("email") || ""),
        password: String(form.get("password") || ""),
        phone: String(form.get("phone") || "") || undefined,
        options: {
          data: {
            firstName,
            lastName,
            full_name: `${firstName} ${lastName}`.trim(),
            role: "USER",
          },
        },
      });
      if (authError) throw authError;
      if (!data.session) {
        router.push("/auth/login");
        return;
      }

      const session = mapSupabaseSession(data.session);
      setAuth(session.user, session.accessToken, session.refreshToken);
      router.push("/dashboard");
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ background: "#f5f5f5", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 3, padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 48, height: 48, background: "#33a137", color: "#fff",
            fontWeight: 900, fontSize: 22, borderRadius: 4, marginBottom: 10,
          }}>PV</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#333", margin: 0 }}>Create your PropVault account</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Free registration — no credit card needed</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input name="firstName" required placeholder="First name" style={inp} />
            <input name="lastName" required placeholder="Last name" style={inp} />
          </div>
          <input name="email" type="email" required placeholder="Email address" style={inp} />
          <input name="phone" placeholder="Phone number (optional)" style={inp} />
          <input name="password" type="password" required minLength={8} placeholder="Password (min 8 characters)" style={inp} />
          {error && <p style={{ fontSize: 12, color: "#c00", margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={btn}>{loading ? "Creating account…" : "Create Account"}</button>
          <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", margin: 0 }}>
            By registering you agree to our Terms of Use
          </p>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#888", marginTop: 20 }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "#33a137", fontWeight: 700 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
