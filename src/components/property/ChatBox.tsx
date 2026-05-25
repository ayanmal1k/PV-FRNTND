"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

interface Props {
  propertyId: string;
  propertyTitle: string;
}

const inputStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  borderRadius: 3,
  padding: "8px 10px",
  fontSize: 13,
  width: "100%",
  outline: "none",
};

const btnStyle: React.CSSProperties = {
  background: "#33a137",
  color: "#fff",
  border: "none",
  borderRadius: 3,
  padding: "9px 0",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
};

function GuestInquiryForm({ propertyId, propertyTitle }: Props) {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const f = new FormData(e.currentTarget);

    try {
      await api("/leads/inquiry", {
        method: "POST",
        body: JSON.stringify({
          propertyId,
          userId: user?.id,
          name: f.get("name"),
          email: f.get("email"),
          phone: f.get("phone"),
          body: f.get("message") || `I am interested in: ${propertyTitle}`,
          whatsapp: false,
        }),
      });
      setStatus("ok");
      e.currentTarget.reset();
    } catch {
      setStatus("err");
    }
  }

  return (
    <div>
      <div style={{ padding: "12px 14px", background: "#f8f8f8", borderBottom: "1px solid #e0e0e0", fontSize: 13, color: "#555" }}>
        <strong style={{ color: "#33a137" }}>Send an enquiry</strong>
        <span> and the agent can follow up from your contact details.</span>
      </div>
      <form onSubmit={submit} style={{ padding: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input name="name" required placeholder="Your name" style={inputStyle} defaultValue={user ? `${user.firstName} ${user.lastName}`.trim() : ""} />
          <input name="email" type="email" required placeholder="Email address" style={inputStyle} defaultValue={user?.email ?? ""} />
          <input name="phone" placeholder="Phone number" style={inputStyle} />
          <textarea name="message" rows={3} placeholder={`I am interested in: ${propertyTitle}`} style={{ ...inputStyle, resize: "vertical" }} />
          <button type="submit" disabled={status === "loading"} style={btnStyle}>
            {status === "loading" ? "Sending..." : "Send Enquiry"}
          </button>
          {status === "ok" && <p style={{ color: "#33a137", fontSize: 12 }}>Message sent. The agent will respond shortly.</p>}
          {status === "err" && <p style={{ color: "#c00", fontSize: 12 }}>Failed. Please try again.</p>}
        </div>
      </form>
    </div>
  );
}

export function ChatBox({ propertyId, propertyTitle }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ border: "1px solid #e0e0e0", borderRadius: 3, overflow: "hidden", background: "#fff" }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: "100%",
          background: "#33a137",
          color: "#fff",
          border: "none",
          padding: "11px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" />
          </svg>
          Send enquiry to agent
        </span>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <path d="M0 0l6 8 6-8z" />
        </svg>
      </button>

      {open && <GuestInquiryForm propertyId={propertyId} propertyTitle={propertyTitle} />}
    </div>
  );
}
