"use client";
import React, { useState } from "react";
import { apiPost } from "../../../lib/api";

export default function JoinPage() {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");

    async function join() {
        setError("");
        try {
            const r = await apiPost<{ sessionId: string }>(`/sessions/${code}/join`, {});
            window.location.href = `/connect/session/${r.sessionId}`;
        } catch { setError("Session not found. Check your code."); }
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="card fade-in" style={{ maxWidth: 420, width: "100%", padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔗</div>
                <h2 style={{ marginBottom: 8 }}>Join a Session</h2>
                <p className="text-sm opacity-70" style={{ marginBottom: 16 }}>Enter the code from your facilitator</p>
                <input placeholder="Enter join code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && join()} style={{ width: "100%", textAlign: "center", fontSize: 20, letterSpacing: 4, fontWeight: 700, marginBottom: 12 }} />
                <button className="btn-primary w-full" onClick={join} disabled={code.length < 4}>Join Session</button>
                {error && <p style={{ color: "var(--danger)", marginTop: 12, fontSize: 13 }}>{error}</p>}
                <a href="/" style={{ display: "block", marginTop: 16, fontSize: 12, color: "var(--accent-light)", textDecoration: "none" }}>← Back to home</a>
            </div>
        </div>
    );
}
