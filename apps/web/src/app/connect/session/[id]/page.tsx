"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { apiPost } from "../../../../lib/api";

export default function SessionPage() {
    const { id } = useParams<{ id: string }>();
    const [name, setName] = useState("");
    const [text, setText] = useState("");
    const [submitted, setSubmitted] = useState<string[]>([]);

    async function submit() {
        if (!text.trim()) return;
        await apiPost(`/sessions/${id}/submissions`, { text, participant: name || undefined });
        setSubmitted(prev => [...prev, text]); setText("");
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="card fade-in" style={{ maxWidth: 480, width: "100%", padding: 32 }}>
                <div style={{ fontSize: 36, marginBottom: 6 }}>💡</div>
                <h2 style={{ marginBottom: 16 }}>Submit Your Ideas</h2>
                <input placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", marginBottom: 12 }} />
                <textarea placeholder="Type your idea or concept..." value={text} onChange={e => setText(e.target.value)} rows={3} style={{ width: "100%", marginBottom: 12 }} />
                <button className="btn-primary w-full" onClick={submit} disabled={!text.trim()}>Submit Idea</button>
                {submitted.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                        <div className="label mb-2">Your Submissions ({submitted.length})</div>
                        {submitted.map((s, i) => <div key={i} className="text-sm" style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", background: "var(--bg-tertiary)", marginBottom: 6, border: "1px solid var(--border-color)" }}>✓ {s}</div>)}
                    </div>
                )}
            </div>
        </div>
    );
}
