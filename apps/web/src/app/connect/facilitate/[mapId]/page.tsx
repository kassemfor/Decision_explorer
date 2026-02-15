"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { apiGet, apiPost } from "../../../../lib/api";

type Submission = { id: string; text: string; participant?: string; status: string; createdAt: string };
type NodeItem = { id: string; title: string };

export default function FacilitatePage() {
    const { mapId } = useParams<{ mapId: string }>();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [joinCode, setJoinCode] = useState("");
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [nodes, setNodes] = useState<NodeItem[]>([]);

    async function createSession() {
        const r = await apiPost<{ session: { id: string }; joinCode: string }>(`/maps/${mapId}/sessions`, {});
        setSessionId(r.session.id); setJoinCode(r.joinCode);
    }

    const poll = useCallback(async () => {
        if (!sessionId) return;
        const [subs, mapData] = await Promise.all([
            apiGet<{ submissions: Submission[] }>(`/sessions/${sessionId}/submissions`),
            apiGet<{ nodes: NodeItem[] }>(`/maps/${mapId}`),
        ]);
        setSubmissions(subs.submissions); setNodes(mapData.nodes);
    }, [sessionId, mapId]);

    useEffect(() => { if (!sessionId) return; poll(); const interval = setInterval(poll, 3000); return () => clearInterval(interval); }, [sessionId, poll]);

    async function moderate(submissionId: string, action: string, targetNodeId?: string) {
        await apiPost(`/sessions/${sessionId}/moderate`, { submissionId, action, mapId, targetNodeId });
        poll();
    }

    const pending = submissions.filter(s => s.status === "PENDING");
    const processed = submissions.filter(s => s.status !== "PENDING");

    return (
        <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }} className="fade-in">
            <a href={`/maps/${mapId}`} style={{ fontSize: 12, color: "var(--accent-light)", textDecoration: "none" }}>← Back to map editor</a>
            <h2 style={{ marginTop: 12, marginBottom: 20 }}>🎯 Facilitate Connect Session</h2>

            {!sessionId ? (
                <div className="card" style={{ textAlign: "center", padding: 40 }}>
                    <p className="opacity-70 mb-3">Start a live session for participants to submit ideas</p>
                    <button className="btn-primary" onClick={createSession}>Start New Session</button>
                </div>
            ) : (
                <>
                    <div className="card mb-3" style={{ textAlign: "center" }}>
                        <div className="label mb-2">Join Code</div>
                        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: 6, color: "var(--accent-light)" }}>{joinCode}</div>
                        <p className="text-xs opacity-50 mt-2">Share this code with participants to join at /connect/join</p>
                    </div>

                    <div className="card mb-3">
                        <h3 className="mb-2">Pending ({pending.length})</h3>
                        {pending.length === 0 && <p className="text-sm opacity-50">Waiting for submissions…</p>}
                        {pending.map(s => (
                            <div key={s.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-sm" style={{ fontWeight: 600 }}>{s.text}</div>
                                        {s.participant && <div className="text-xs opacity-50">by {s.participant}</div>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="btn-sm" style={{ color: "var(--success)" }} onClick={() => moderate(s.id, "ACCEPT")}>✓ Accept</button>
                                        <button className="btn-sm btn-danger" onClick={() => moderate(s.id, "REJECT")}>✕ Reject</button>
                                        <select className="btn-sm" style={{ minWidth: 120 }} onChange={e => { if (e.target.value) moderate(s.id, "MERGE", e.target.value); }} defaultValue="">
                                            <option value="">Merge into…</option>
                                            {nodes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <h3 className="mb-2">Processed ({processed.length})</h3>
                        {processed.map(s => (
                            <div key={s.id} className="flex justify-between items-center text-sm" style={{ padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                                <span>{s.text}</span>
                                <span className={`badge ${s.status === "ACCEPTED" ? "badge-success" : s.status === "MERGED" ? "badge-info" : "badge-danger"}`}>{s.status}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
