"use client";
import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../lib/api";

type MapItem = { id: string; name: string; description?: string | null; createdAt: string };

export default function Home() {
    const [maps, setMaps] = useState<MapItem[]>([]);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [loading, setLoading] = useState(true);

    async function loadMaps() { try { const r = await apiGet<{ maps: MapItem[] }>("/maps"); setMaps(r.maps); } catch { } setLoading(false); }
    useEffect(() => { loadMaps(); }, []);

    async function createMap() {
        if (!name.trim()) return;
        const r = await apiPost<{ map: MapItem }>("/maps", { name, description: desc || undefined });
        setName(""); setDesc(""); setMaps(prev => [r.map, ...prev]);
    }

    async function deleteMap(id: string) {
        if (!confirm("Delete this map and all its data?")) return;
        await apiDelete(`/maps/${id}`); setMaps(prev => prev.filter(m => m.id !== id));
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ maxWidth: 720, width: "100%", padding: 32 }} className="fade-in">
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>🧠</div>
                    <h1 style={{ background: "linear-gradient(135deg, var(--accent-light), var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: 36, marginBottom: 8 }}>Decision Explorer</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>Causal &amp; cognitive mapping for strategy, policy, and complex problem-structuring</p>
                </div>
                <div className="card" style={{ marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 12 }}>Create New Map</h3>
                    <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                        <input placeholder="Map name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && createMap()} style={{ flex: "1 1 200px", minWidth: 180 }} />
                        <input placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} onKeyDown={e => e.key === "Enter" && createMap()} style={{ flex: "1 1 200px", minWidth: 180 }} />
                        <button className="btn-primary" onClick={createMap} disabled={!name.trim()}>+ Create Map</button>
                    </div>
                </div>
                <div className="card">
                    <h3 style={{ marginBottom: 12 }}>Your Maps</h3>
                    {loading && <p style={{ color: "var(--text-muted)" }}>Loading…</p>}
                    {!loading && maps.length === 0 && <p style={{ color: "var(--text-muted)" }}>No maps yet. Create one above to get started.</p>}
                    <div className="flex flex-col gap-2">
                        {maps.map(m => (
                            <div key={m.id} className="flex items-center justify-between" style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", transition: "border-color 0.15s" }}>
                                <div>
                                    <a href={`/maps/${m.id}`} style={{ color: "var(--accent-light)", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>{m.name}</a>
                                    {m.description && <div className="text-xs opacity-70" style={{ marginTop: 2 }}>{m.description}</div>}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <span className="text-xs opacity-50">{new Date(m.createdAt).toLocaleDateString()}</span>
                                    <button className="btn-sm btn-danger" onClick={() => deleteMap(m.id)}>✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>Shortcuts in editor: <strong>N</strong>=add node, <strong>E</strong>=edge mode, <strong>1/2/3</strong>=polarity, <strong>[ ]</strong>=strength, <strong>Del</strong>=delete, <strong>⌘Z</strong>=undo, <strong>⌘⇧Z</strong>=redo</div>
            </div>
        </div>
    );
}
