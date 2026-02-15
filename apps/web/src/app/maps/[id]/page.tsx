"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { apiGet, apiPost, apiPatch, apiDelete } from "../../../lib/api";
import { UndoStack } from "../../../lib/undo";
import type { AnalysisResult } from "@de/graph-core";
import * as XLSX from "xlsx";

declare const cytoscape: any;

type NodeData = { id: string; title: string; note?: string; tags?: string[]; x?: number; y?: number };
type EdgeData = { id: string; sourceId: string; targetId: string; polarity?: number; strength?: number; note?: string };
type MapData = { id: string; name: string; description?: string };
type ViewMode = "edit" | "drivers" | "outcomes" | "loops" | "clusters" | "strategy" | "report" | "howto";

const POLARITY_COLORS: Record<number, string> = { [-1]: "#ef4444", 0: "#94a3b8", 1: "#22c55e" };
const POLARITY_LABELS: Record<number, string> = { [-1]: "−", 0: "○", 1: "+" };
const CLUSTER_PALETTE = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#f97316", "#8b5cf6", "#14b8a6"];

export default function MapEditor() {
    const { id: mapId } = useParams<{ id: string }>();
    const cyRef = useRef<HTMLDivElement>(null);
    const cyInstanceRef = useRef<any>(null);
    const undoRef = useRef(new UndoStack());

    const [mapData, setMapData] = useState<MapData | null>(null);
    const [nodes, setNodes] = useState<NodeData[]>([]);
    const [edges, setEdges] = useState<EdgeData[]>([]);
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<EdgeData | null>(null);
    const [edgeMode, setEdgeMode] = useState(false);
    const [edgeSource, setEdgeSource] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("edit");
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [ready, setReady] = useState(false);
    const [showAddNode, setShowAddNode] = useState(false);
    const [newNodeTitle, setNewNodeTitle] = useState("");

    /* === Resizable inspector === */
    const [inspectorWidth, setInspectorWidth] = useState(340);
    const isResizing = useRef(false);
    const resizeHandleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const newW = window.innerWidth - e.clientX;
            setInspectorWidth(Math.max(260, Math.min(600, newW)));
        };
        const onMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            resizeHandleRef.current?.classList.remove("active");
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
    }, []);

    const startResize = useCallback(() => {
        isResizing.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        resizeHandleRef.current?.classList.add("active");
    }, []);

    /* === REFS for mutable state (solves stale closure problem) === */
    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    const edgeModeRef = useRef(edgeMode);
    const edgeSourceRef = useRef(edgeSource);
    const selectedNodeRef = useRef(selectedNode);
    const selectedEdgeRef = useRef(selectedEdge);

    useEffect(() => { nodesRef.current = nodes; }, [nodes]);
    useEffect(() => { edgesRef.current = edges; }, [edges]);
    useEffect(() => { edgeModeRef.current = edgeMode; }, [edgeMode]);
    useEffect(() => { edgeSourceRef.current = edgeSource; }, [edgeSource]);
    useEffect(() => { selectedNodeRef.current = selectedNode; }, [selectedNode]);
    useEffect(() => { selectedEdgeRef.current = selectedEdge; }, [selectedEdge]);

    // Load map
    useEffect(() => {
        if (!mapId) return;
        apiGet<{ map: MapData; nodes: NodeData[]; edges: EdgeData[] }>(`/maps/${mapId}`).then(r => {
            setMapData(r.map); setNodes(r.nodes); setEdges(r.edges);
        });
    }, [mapId]);

    // Init Cytoscape
    useEffect(() => {
        if (!cyRef.current || ready) return;
        const script = document.createElement("script");
        script.src = "https://unpkg.com/cytoscape@3.30.4/dist/cytoscape.min.js";
        script.onload = () => setReady(true);
        document.head.appendChild(script);
    }, [ready]);

    // Create Cytoscape instance
    useEffect(() => {
        if (!ready || !cyRef.current) return;
        const cy = cytoscape({
            container: cyRef.current,
            style: [
                { selector: "node", style: { label: "data(label)", "text-wrap": "wrap", "text-max-width": "120px", "font-size": "12px", color: "#e2e8f0", "text-valign": "center", "text-halign": "center", "background-color": "#374151", "border-width": 2, "border-color": "#6366f1", width: 60, height: 60, "text-outline-color": "#0f1117", "text-outline-width": 1.5 } },
                { selector: "node[badge]", style: { label: (ele: any) => `${ele.data('label')}\n${ele.data('badge')}`, "text-wrap": "wrap", "text-max-width": "140px", "font-size": "11px" } },
                { selector: "node:selected", style: { "border-color": "#818cf8", "border-width": 3, "background-color": "#4f46e5" } },
                { selector: "edge", style: { width: "data(w)", "line-color": "data(color)", "target-arrow-color": "data(color)", "target-arrow-shape": "triangle", "curve-style": "bezier", label: "data(sign)", "font-size": "14px", color: "data(color)", "text-outline-color": "#0f1117", "text-outline-width": 1.5 } },
                { selector: "edge:selected", style: { width: 4, "line-color": "#818cf8", "target-arrow-color": "#818cf8" } },
                { selector: ".driver", style: { "background-color": "#22c55e", "border-color": "#22c55e" } },
                { selector: ".outcome", style: { "background-color": "#f59e0b", "border-color": "#f59e0b" } },
                { selector: ".loop-member", style: { "background-color": "#ec4899", "border-color": "#ec4899" } },
                { selector: ".head-node", style: { "border-color": "#f59e0b", "border-width": 3, "border-style": "double" } },
                { selector: ".tail-node", style: { "border-color": "#22c55e", "border-width": 3, "border-style": "dashed" } },
                { selector: ".potent-node", style: { "border-color": "#a78bfa", "border-width": 3, "background-color": "#4c1d95" } },
                { selector: ".orphan-node", style: { "border-color": "#64748b", "border-style": "dotted", opacity: 0.7 } },
            ],
            layout: { name: "preset" },
            elements: [],
        });
        cyInstanceRef.current = cy;

        cy.on("tap", "node", (e: any) => {
            const id = e.target.id();
            const n = nodesRef.current.find((n: NodeData) => n.id === id);
            if (edgeModeRef.current && edgeSourceRef.current) {
                doAddEdge(edgeSourceRef.current, id);
                setEdgeSource(null);
            } else if (edgeModeRef.current) {
                setEdgeSource(id);
            } else {
                setSelectedNode(n ?? null);
                setSelectedEdge(null);
            }
        });

        cy.on("tap", "edge", (e: any) => {
            const id = e.target.id();
            const ed = edgesRef.current.find((ed: EdgeData) => ed.id === id);
            setSelectedEdge(ed ?? null);
            setSelectedNode(null);
        });

        cy.on("tap", (e: any) => {
            if (e.target === cy) { setSelectedNode(null); setSelectedEdge(null); }
        });

        cy.on("dragfree", "node", (e: any) => {
            const pos = e.target.position();
            apiPatch(`/nodes/${e.target.id()}`, { x: pos.x, y: pos.y }).catch(() => { });
        });

        return () => { cy.destroy(); cyInstanceRef.current = null; };
    }, [ready]);

    // Sync graph elements
    useEffect(() => {
        const cy = cyInstanceRef.current; if (!cy) return;
        cy.elements().remove();
        for (const n of nodes) {
            cy.add({ data: { id: n.id, label: n.title }, position: { x: n.x ?? Math.random() * 600, y: n.y ?? Math.random() * 400 } });
        }
        for (const e of edges) {
            const pol = e.polarity ?? 0;
            cy.add({ data: { id: e.id, source: e.sourceId, target: e.targetId, w: Math.max(1, (e.strength ?? 1) * 1.5), color: POLARITY_COLORS[pol] ?? "#94a3b8", sign: POLARITY_LABELS[pol] ?? "○" } });
        }
        if (nodes.length > 0 && edges.length > 0) cy.fit(undefined, 40);
    }, [nodes, edges, ready]);

    // Analysis + cluster coloring + node badges
    useEffect(() => {
        const cy = cyInstanceRef.current; if (!cy) return;
        cy.nodes().removeClass("driver outcome loop-member head-node tail-node potent-node orphan-node");
        cy.nodes().removeData("badge");
        cy.nodes().style({ "background-color": "#374151", "border-color": "#6366f1" });

        if (!analysis) return;

        // Apply classification badges to ALL nodes (persistent after analysis)
        const potentSet = new Set(analysis.potentNodes ?? []);
        const busyIds = (analysis.nodeReport ?? []).slice(0, 3).map(r => r.nodeId);
        const busySet = new Set(busyIds);

        for (const r of (analysis.nodeReport ?? [])) {
            const el = cy.$(`#${r.nodeId}`);
            if (el.length === 0) continue;
            // Assign badge text and class
            if (potentSet.has(r.nodeId)) {
                el.data("badge", "💎 Potent"); el.addClass("potent-node");
            } else if (r.role === "Head") {
                el.data("badge", "🎯 Head"); el.addClass("head-node");
            } else if (r.role === "Tail") {
                el.data("badge", "⚡ Tail"); el.addClass("tail-node");
            } else if (r.role === "Orphan") {
                el.data("badge", "👻 Orphan"); el.addClass("orphan-node");
            } else if (busySet.has(r.nodeId)) {
                el.data("badge", "🔥 Busy");
            }
        }

        // View-specific highlighting (additive on top of badges)
        if (viewMode === "drivers") analysis.drivers.slice(0, 5).forEach(d => cy.$(`#${d.nodeId}`).addClass("driver"));
        if (viewMode === "outcomes") analysis.outcomes.slice(0, 5).forEach(d => cy.$(`#${d.nodeId}`).addClass("outcome"));
        if (viewMode === "loops") analysis.loops.forEach(l => l.nodes.forEach(nid => cy.$(`#${nid}`).addClass("loop-member")));
        if (viewMode === "clusters" && analysis.clusters) {
            const clusterNames = [...new Set(Object.values(analysis.clusters))];
            Object.entries(analysis.clusters).forEach(([nodeId, clusterName]) => {
                const ci = clusterNames.indexOf(clusterName);
                const color = CLUSTER_PALETTE[ci % CLUSTER_PALETTE.length];
                cy.$(`#${nodeId}`).style({ "background-color": color, "border-color": color });
            });
        }
    }, [viewMode, analysis]);

    /* === Add Node (inline, no prompt()) === */
    const doAddNode = useCallback(async (title: string) => {
        if (!title.trim()) return;
        const x = 300 + Math.random() * 200;
        const y = 200 + Math.random() * 200;
        try {
            const r = await apiPost<{ node: NodeData }>(`/maps/${mapId}/nodes`, { title: title.trim(), x, y });
            const n = r.node;
            setNodes(prev => [...prev, n]);
            undoRef.current.push({
                label: `Add "${title}"`,
                do: async () => { const r2 = await apiPost<{ node: NodeData }>(`/maps/${mapId}/nodes`, { title: n.title, x: n.x, y: n.y }); setNodes(prev => [...prev, r2.node]); },
                undo: async () => { await apiDelete(`/nodes/${n.id}`).catch(() => { }); setNodes(prev => prev.filter(x => x.id !== n.id)); }
            });
        } catch (err) { console.error("Add node failed:", err); }
    }, [mapId]);

    /* === Add Edge === */
    const doAddEdge = useCallback(async (sourceId: string, targetId: string) => {
        if (sourceId === targetId) return;
        try {
            const r = await apiPost<{ edge: EdgeData }>(`/maps/${mapId}/edges`, { sourceId, targetId });
            setEdges(prev => [...prev, r.edge]);
        } catch (err) { console.error("Add edge failed:", err); }
    }, [mapId]);

    /* === Delete Selected (uses refs for fresh state) === */
    const doDelete = useCallback(async () => {
        const sn = selectedNodeRef.current;
        const se = selectedEdgeRef.current;
        if (sn) {
            try {
                await apiDelete(`/nodes/${sn.id}`);
                setNodes(prev => prev.filter(n => n.id !== sn.id));
                setEdges(prev => prev.filter(e => e.sourceId !== sn.id && e.targetId !== sn.id));
                setSelectedNode(null);
            } catch (err) { console.error("Delete node failed:", err); }
        } else if (se) {
            try {
                await apiDelete(`/edges/${se.id}`);
                setEdges(prev => prev.filter(e => e.id !== se.id));
                setSelectedEdge(null);
            } catch (err) { console.error("Delete edge failed:", err); }
        }
    }, []);

    const runAnalysis = useCallback(async () => {
        try {
            const r = await apiPost<AnalysisResult>(`/maps/${mapId}/analyze`, {});
            setAnalysis(r); if (viewMode === "edit" || viewMode === "howto") setViewMode("drivers");
        } catch (err) { console.error("Analysis failed:", err); }
    }, [mapId, viewMode]);

    const updateNodeField = useCallback(async (field: string, val: any) => {
        if (!selectedNode) return;
        await apiPatch(`/nodes/${selectedNode.id}`, { [field]: val });
        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, [field]: val } : n));
        setSelectedNode(prev => prev ? { ...prev, [field]: val } : null);
    }, [selectedNode]);

    const updateEdgeField = useCallback(async (field: string, val: any) => {
        if (!selectedEdge) return;
        await apiPatch(`/edges/${selectedEdge.id}`, { [field]: val });
        setEdges(prev => prev.map(e => e.id === selectedEdge.id ? { ...e, [field]: val } : e));
        setSelectedEdge(prev => prev ? { ...prev, [field]: val } : null);
    }, [selectedEdge]);

    const exportPNG = useCallback(() => {
        const cy = cyInstanceRef.current; if (!cy) return;
        const blob = cy.png({ output: "blob", bg: "#0f1117", scale: 2 });
        const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${mapData?.name ?? "map"}.png`; a.click();
    }, [mapData]);

    /* === Excel Export === */
    const exportExcel = useCallback(() => {
        const conceptRows = nodes.map(n => {
            const report = analysis?.nodeReport?.find(r => r.nodeId === n.id);
            return {
                ID: n.id, Title: n.title, Note: n.note ?? "",
                Tags: (n.tags ?? []).join("; "),
                X: Math.round(n.x ?? 0), Y: Math.round(n.y ?? 0),
                Role: report?.role ?? "", Domain: report?.domain ?? "",
                "In#": report?.inCount ?? "", "Out#": report?.outCount ?? "",
            };
        });

        const linkRows = edges.map(e => {
            const srcName = nodes.find(n => n.id === e.sourceId)?.title ?? e.sourceId;
            const tgtName = nodes.find(n => n.id === e.targetId)?.title ?? e.targetId;
            const polLabel = e.polarity === 1 ? "+Positive" : e.polarity === -1 ? "-Negative" : "Neutral";
            return {
                ID: e.id, Source_Title: srcName, Target_Title: tgtName,
                Polarity: polLabel, Strength: e.strength ?? 1,
                Note: e.note ?? "",
            };
        });

        const wb = XLSX.utils.book_new();
        const wsConcepts = XLSX.utils.json_to_sheet(conceptRows);
        XLSX.utils.book_append_sheet(wb, wsConcepts, "Concepts");
        const wsLinks = XLSX.utils.json_to_sheet(linkRows);
        XLSX.utils.book_append_sheet(wb, wsLinks, "Links");

        if (analysis) {
            const summaryRows = [
                { Metric: "Total Concepts", Value: nodes.length },
                { Metric: "Total Links", Value: edges.length },
                { Metric: "Head Nodes", Value: (analysis.headNodes ?? []).length },
                { Metric: "Tail Nodes", Value: (analysis.tailNodes ?? []).length },
                { Metric: "Potent Nodes", Value: (analysis.potentNodes ?? []).length },
                { Metric: "Orphan Nodes", Value: (analysis.orphans ?? []).length },
                { Metric: "Feedback Loops", Value: analysis.loops.length },
            ];
            const wsAnalysis = XLSX.utils.json_to_sheet(summaryRows);
            XLSX.utils.book_append_sheet(wb, wsAnalysis, "Analysis");
        }

        const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${mapData?.name ?? "map"}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    }, [nodes, edges, analysis, mapData]);

    /* === Excel Import === */
    const importFileRef = useRef<HTMLInputElement>(null);
    const importExcel = useCallback(async (file: File) => {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: "array" });

        // Parse Concepts sheet
        const conceptsSheet = wb.Sheets["Concepts"];
        const conceptRows: any[] = conceptsSheet ? XLSX.utils.sheet_to_json(conceptsSheet) : [];

        // Parse Links sheet
        const linksSheet = wb.Sheets["Links"];
        const linkRows: any[] = linksSheet ? XLSX.utils.sheet_to_json(linksSheet) : [];

        // Build a title→node lookup from existing nodes for merging
        const existingByTitle = new Map(nodes.map(n => [n.title.toLowerCase().trim(), n]));
        const titleToId = new Map<string, string>();

        // Process concepts: update existing or create new
        for (const row of conceptRows) {
            const title = String(row.Title ?? "").trim();
            if (!title) continue;
            const existing = existingByTitle.get(title.toLowerCase());
            const tags = row.Tags ? String(row.Tags).split(";").map((t: string) => t.trim()).filter(Boolean) : [];
            if (existing) {
                // Update existing node
                await apiPatch(`/nodes/${existing.id}`, {
                    note: row.Note !== undefined ? String(row.Note) : existing.note,
                    tags: tags.length > 0 ? tags : existing.tags,
                });
                titleToId.set(title.toLowerCase(), existing.id);
            } else {
                // Create new node
                const r = await apiPost<{ node: NodeData }>(`/maps/${mapId}/nodes`, {
                    title, note: row.Note ? String(row.Note) : undefined,
                    tags, x: Number(row.X) || Math.random() * 600,
                    y: Number(row.Y) || Math.random() * 400,
                });
                titleToId.set(title.toLowerCase(), r.node.id);
            }
        }

        // Process links: create edges by matching Source_Title → Target_Title
        for (const row of linkRows) {
            const srcTitle = String(row.Source_Title ?? "").trim().toLowerCase();
            const tgtTitle = String(row.Target_Title ?? "").trim().toLowerCase();
            const srcId = titleToId.get(srcTitle) ?? existingByTitle.get(srcTitle)?.id;
            const tgtId = titleToId.get(tgtTitle) ?? existingByTitle.get(tgtTitle)?.id;
            if (!srcId || !tgtId || srcId === tgtId) continue;

            // Check if this edge already exists
            const alreadyExists = edges.some(e => e.sourceId === srcId && e.targetId === tgtId);
            if (alreadyExists) continue;

            const polStr = String(row.Polarity ?? "Neutral");
            const polarity = polStr.startsWith("+") ? 1 : polStr.startsWith("-") ? -1 : 0;
            const strength = Math.min(5, Math.max(1, Number(row.Strength) || 1));
            await apiPost(`/maps/${mapId}/edges`, {
                sourceId: srcId, targetId: tgtId, polarity, strength,
                note: row.Note ? String(row.Note) : undefined,
            });
        }

        // Reload the map to pick up all changes
        const r = await apiGet<{ map: MapData; nodes: NodeData[]; edges: EdgeData[] }>(`/maps/${mapId}`);
        setNodes(r.nodes); setEdges(r.edges);
        setAnalysis(null); // clear stale analysis
    }, [mapId, nodes, edges]);

    /* === Build strategy advisory from DE methodology === */
    const getStrategyAdvisory = useCallback(() => {
        if (!analysis) return null;
        const nameOf = (id: string) => nodes.find(n => n.id === id)?.title ?? id;

        const headNames = (analysis.headNodes ?? []).map(nameOf);
        const tailNames = (analysis.tailNodes ?? []).map(nameOf);
        const potentNames = (analysis.potentNodes ?? []).map(nameOf);
        const orphanNames = (analysis.orphans ?? []).map(nameOf);
        const busyNodes = (analysis.nodeReport ?? []).slice(0, 3).map(r => ({ name: nameOf(r.nodeId), domain: r.domain }));
        const loopCount = analysis.loops.length;
        const nodeCount = nodes.length;
        const edgeCount = edges.length;
        const density = nodeCount > 1 ? (edgeCount / (nodeCount * (nodeCount - 1))).toFixed(2) : "0";

        type Section = { icon: string; title: string; color: string; items: string[] };
        const sections: Section[] = [];

        // 1. Goals / Outcomes (Heads)
        if (headNames.length > 0) {
            sections.push({
                icon: "🎯", title: "Strategic Goals (Heads)", color: "var(--warning)",
                items: [
                    `Your map has **${headNames.length} head concept${headNames.length > 1 ? "s" : ""}** — these are the endpoints everything flows toward.`,
                    `Heads: **${headNames.join("**, **")}**`,
                    `In Decision Explorer terms, these represent your aspirations or desired outcomes. Ask "Is this what we truly want to achieve?"`,
                ]
            });
        }

        // 2. Action Levers (Tails)
        if (tailNames.length > 0) {
            sections.push({
                icon: "⚡", title: "Action Levers (Tails)", color: "var(--success)",
                items: [
                    `**${tailNames.length} tail concept${tailNames.length > 1 ? "s" : ""}** — these are starting points with no incoming links. You can directly influence these.`,
                    `Tails: **${tailNames.join("**, **")}**`,
                    `These are your intervention points. Ask "Which of these can we actually change?" to identify actionable options.`,
                ]
            });
        }

        // 3. Potent Options
        if (potentNames.length > 0) {
            sections.push({
                icon: "💎", title: "Potent Options", color: "var(--accent-light)",
                items: [
                    `**${potentNames.length} potent concept${potentNames.length > 1 ? "s" : ""}** — these tails reach multiple goals simultaneously.`,
                    `Potent: **${potentNames.join("**, **")}**`,
                    `These are your highest-leverage actions. Investing here produces the widest impact across your goal system.`,
                ]
            });
        }

        // 4. Key Strategic Issues (Busy concepts)
        if (busyNodes.length > 0) {
            sections.push({
                icon: "🔥", title: "Key Strategic Issues (Busy)", color: "var(--cyan)",
                items: [
                    `The busiest concepts (highest in+out connections) are your strategic hotspots:`,
                    ...busyNodes.map(b => `**${b.name}** — domain score ${b.domain.toFixed(1)} (total link weight in + out)`),
                    `High-domain concepts sit at the crossroads of multiple argument chains. They are potential strategic priorities.`,
                ]
            });
        }

        // 5. Feedback Loops (Self-sustaining competence patterns)
        sections.push({
            icon: "🔄", title: "Feedback Loops", color: "var(--pink)",
            items: loopCount > 0 ? [
                `**${loopCount} feedback loop${loopCount > 1 ? "s" : ""} detected** — self-reinforcing cycles in your causal system.`,
                ...analysis.loops.slice(0, 3).map((l, i) => `Loop ${i + 1}: **${l.nodes.map(nameOf).join(" → ")}** → (back to start)`),
                `In the Making Strategy framework, self-sustaining loops represent **distinctive competence patterns** — protect virtuous ones and break vicious ones.`,
            ] : [
                `No feedback loops detected — your system is mostly linear (cause → effect chains without cycles).`,
                `Consider whether there are reinforcing dynamics you haven't captured. Self-sustaining loops are key to identifying competitive advantage.`,
            ]
        });

        // 6. Structural Health
        const healthItems: string[] = [
            `📊 **${nodeCount} concepts**, **${edgeCount} causal links**, density **${density}**`,
        ];
        if (orphanNames.length > 0) {
            healthItems.push(`⚠️ **${orphanNames.length} orphan${orphanNames.length > 1 ? "s" : ""}** (disconnected): **${orphanNames.join("**, **")}** — link these into the model or remove them.`);
        }
        if (parseFloat(density) > 0.3) healthItems.push(`🌐 High connectivity — changes propagate quickly suggesting tight coupling.`);
        if (parseFloat(density) < 0.1) healthItems.push(`🔗 Low connectivity — the map may be incomplete. Consider "How?" and "Why?" questions to elaborate argument chains.`);
        if (nodeCount > 15) healthItems.push(`Consider breaking into sub-maps (views) for clarity, focusing on different strategic arenas.`);
        sections.push({ icon: "🏗️", title: "Structural Health", color: "var(--text-muted)", items: healthItems });

        return { sections, headNames, tailNames, potentNames, orphanNames, busyNodes, loopCount, density };
    }, [analysis, nodes, edges]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
            if (e.key === "n" || e.key === "N") { e.preventDefault(); setShowAddNode(true); }
            if (e.key === "e") { e.preventDefault(); setEdgeMode(prev => !prev); setEdgeSource(null); }
            if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); doDelete(); }
            if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undoRef.current.undo(); }
            if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) { e.preventDefault(); undoRef.current.redo(); }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [doDelete]);

    const strategy = viewMode === "strategy" ? getStrategyAdvisory() : null;

    /* Role badge color helper */
    const roleBadge = (role: string) => {
        const colors: Record<string, string> = { Head: "var(--warning)", Tail: "var(--success)", Orphan: "var(--danger)", Ordinary: "var(--text-muted)" };
        return <span style={{ fontSize: 10, fontWeight: 700, color: colors[role] ?? "var(--text-muted)", padding: "2px 6px", borderRadius: 3, background: `${colors[role] ?? "var(--text-muted)"}20` }}>{role}</span>;
    };

    return (
        <div className="editor-grid" style={{ gridTemplateColumns: `260px 1fr auto ${inspectorWidth}px` }}>
            {/* LEFT SIDEBAR */}
            <div className="editor-left flex flex-col gap-3">
                <a href="/" style={{ fontSize: 12, color: "var(--accent-light)", textDecoration: "none" }}>← Back to maps</a>
                <h3 style={{ fontSize: 16 }}>{mapData?.name ?? "Loading…"}</h3>
                <hr />

                {/* Inline Add Node */}
                {showAddNode ? (
                    <div className="flex flex-col gap-2">
                        <input
                            autoFocus
                            placeholder="Enter node title…"
                            value={newNodeTitle}
                            onChange={e => setNewNodeTitle(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter" && newNodeTitle.trim()) { doAddNode(newNodeTitle); setNewNodeTitle(""); setShowAddNode(false); }
                                if (e.key === "Escape") { setShowAddNode(false); setNewNodeTitle(""); }
                            }}
                            style={{ width: "100%" }}
                        />
                        <div className="flex gap-2">
                            <button className="btn-primary btn-sm" style={{ flex: 1 }} onClick={() => { if (newNodeTitle.trim()) { doAddNode(newNodeTitle); setNewNodeTitle(""); setShowAddNode(false); } }} disabled={!newNodeTitle.trim()}>Add</button>
                            <button className="btn-sm" style={{ flex: 1 }} onClick={() => { setShowAddNode(false); setNewNodeTitle(""); }}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <button className="btn-primary w-full" onClick={() => setShowAddNode(true)}>+ Add Node</button>
                )}

                <button className={edgeMode ? "btn-active w-full" : "w-full"} onClick={() => { setEdgeMode(!edgeMode); setEdgeSource(null); }}>{edgeMode ? (edgeSource ? "Click target node…" : "Click source node…") : "🔗 Edge Mode"}</button>
                <button className="w-full" onClick={doDelete} disabled={!selectedNode && !selectedEdge}>🗑 Delete Selected</button>
                <hr />
                <button className="w-full" onClick={runAnalysis}>📊 Run Analysis</button>
                <div className="flex flex-wrap gap-2">
                    {(["edit", "drivers", "outcomes", "loops", "clusters", "report", "strategy", "howto"] as ViewMode[]).map(v => (
                        <button key={v} className={`btn-sm ${viewMode === v ? "btn-active" : ""}`} onClick={() => setViewMode(v)}>
                            {v === "howto" ? "How-to" : v === "strategy" ? "📋 Strategy" : v === "report" ? "📊 Report" : v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </div>
                <hr />
                <div className="flex gap-2">
                    <button className="btn-sm w-full" onClick={() => undoRef.current.undo()}>↩ Undo</button>
                    <button className="btn-sm w-full" onClick={() => undoRef.current.redo()}>↪ Redo</button>
                </div>
                <button className="btn-sm w-full" onClick={exportPNG}>📷 Export PNG</button>
                <button className="btn-sm w-full" onClick={exportExcel}>📥 Export Excel</button>
                <input ref={importFileRef} type="file" accept=".xlsx,.xls" hidden onChange={e => { const f = e.target.files?.[0]; if (f) { importExcel(f); e.target.value = ""; } }} />
                <button className="btn-sm w-full" onClick={() => importFileRef.current?.click()}>📤 Import Excel</button>
                <hr />
                <div className="text-xs opacity-50">
                    <strong>N</strong> add node &nbsp; <strong>E</strong> edge mode<br />
                    <strong>Del</strong> delete selected<br />
                    <strong>⌘Z</strong> undo &nbsp; <strong>⌘⇧Z</strong> redo
                </div>
            </div>

            {/* CANVAS */}
            <div ref={cyRef} className="editor-canvas" style={{ background: "var(--bg-primary)" }} />

            {/* RESIZE HANDLE */}
            <div ref={resizeHandleRef} className="resize-handle" onMouseDown={startResize} />

            {/* RIGHT SIDEBAR — INSPECTOR */}
            <div className="editor-right flex flex-col gap-3">
                <h3>Inspector</h3>
                <hr />

                {/* === HOW-TO GUIDE === */}
                {viewMode === "howto" && (
                    <div className="fade-in flex flex-col gap-3">
                        <div className="label">HOW TO USE DECISION EXPLORER</div>

                        <div style={{ padding: 12, background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                            <h4 style={{ color: "var(--accent-light)", marginBottom: 6 }}>1. Build Your Map</h4>
                            <ul style={{ fontSize: 12, color: "var(--text-secondary)", paddingLeft: 16, lineHeight: 1.8 }}>
                                <li>Click <strong>+ Add Node</strong> or press <strong>N</strong> to add concepts</li>
                                <li>Click <strong>Edge Mode</strong> or press <strong>E</strong>, then click two nodes to create a causal link</li>
                                <li><strong>Drag nodes</strong> to rearrange the layout</li>
                                <li><strong>Click a node/edge</strong> to select and edit properties</li>
                            </ul>
                        </div>

                        <div style={{ padding: 12, background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                            <h4 style={{ color: "var(--success)", marginBottom: 6 }}>2. Causal Links & Polarity</h4>
                            <ul style={{ fontSize: 12, color: "var(--text-secondary)", paddingLeft: 16, lineHeight: 1.8 }}>
                                <li><span style={{ color: "#22c55e" }}>+ Positive</span>: "A leads to/supports B" (green)</li>
                                <li><span style={{ color: "#ef4444" }}>− Negative</span>: "A leads to opposite of B" (red)</li>
                                <li><span style={{ color: "#94a3b8" }}>○ Neutral</span>: associative relationship (gray)</li>
                                <li><strong>Strength 1–5</strong>: how strong is the causal effect?</li>
                            </ul>
                        </div>

                        <div style={{ padding: 12, background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                            <h4 style={{ color: "var(--warning)", marginBottom: 6 }}>3. Understanding Analysis Scores</h4>
                            <ul style={{ fontSize: 12, color: "var(--text-secondary)", paddingLeft: 16, lineHeight: 1.8 }}>
                                <li><strong>Heads</strong> (outcomes) = concepts with no outgoing links — goals/aspirations at the top of your argument chains</li>
                                <li><strong>Tails</strong> (drivers) = concepts with no incoming links — action levers and root causes at the bottom</li>
                                <li><strong>Driver score</strong> = total weight of outgoing links (out-strength)</li>
                                <li><strong>Outcome score</strong> = total weight of incoming links (in-strength)</li>
                                <li><strong>Domain score</strong> = in + out combined — "busy" concepts (key strategic issues)</li>
                                <li><strong>Potent</strong> = tails that reach ≥2 different heads — highest-leverage options</li>
                            </ul>
                        </div>

                        <div style={{ padding: 12, background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                            <h4 style={{ color: "var(--pink)", marginBottom: 6 }}>4. Clusters & Loops</h4>
                            <ul style={{ fontSize: 12, color: "var(--text-secondary)", paddingLeft: 16, lineHeight: 1.8 }}>
                                <li><strong>Clusters</strong> = groups of related concepts by tags. Add tags to nodes, then view the Clusters tab</li>
                                <li><strong>Loops</strong> = feedback cycles (self-reinforcing patterns). Virtuous loops = competitive advantage</li>
                                <li>Use the <strong>📊 Report</strong> tab for a full breakdown of every node's in/out counts and role</li>
                            </ul>
                        </div>

                        <div style={{ padding: 12, background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                            <h4 style={{ color: "var(--cyan)", marginBottom: 6 }}>5. Strategy Advisory (DE Methodology)</h4>
                            <ul style={{ fontSize: 12, color: "var(--text-secondary)", paddingLeft: 16, lineHeight: 1.8 }}>
                                <li>Based on Eden & Ackermann's <em>Making Strategy</em> framework</li>
                                <li>Identifies <strong>strategic goals</strong>, <strong>action levers</strong>, <strong>potent options</strong>, and <strong>distinctive competence loops</strong></li>
                                <li>Run Analysis → click <strong>📋 Strategy</strong> for structured recommendations</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* === STRATEGY ADVISORY (DE methodology) === */}
                {viewMode === "strategy" && (
                    <div className="fade-in flex flex-col gap-3">
                        <div className="label">STRATEGY ADVISORY</div>
                        <div className="text-xs" style={{ color: "var(--text-muted)", fontStyle: "italic", marginBottom: 4 }}>Based on Decision Explorer / Eden-Ackermann Making Strategy methodology</div>
                        {!analysis ? (
                            <div style={{ padding: 16, textAlign: "center" }}>
                                <p className="text-sm opacity-70 mb-3">Run analysis first to generate strategic recommendations</p>
                                <button className="btn-primary" onClick={runAnalysis}>📊 Run Analysis</button>
                            </div>
                        ) : strategy && (
                            <>
                                {strategy.sections.map((sec, i) => (
                                    <div key={i} style={{ padding: "12px 14px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: `1px solid ${sec.color}30` }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: sec.color, marginBottom: 6 }}>{sec.icon} {sec.title}</div>
                                        {sec.items.map((item, j) => (
                                            <div key={j} style={{ fontSize: 12, lineHeight: 1.7, color: "var(--text-secondary)", padding: "2px 0" }} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary)">$1</strong>') }} />
                                        ))}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* === REPORT VIEW — full node table === */}
                {viewMode === "report" && (
                    <div className="fade-in flex flex-col gap-3">
                        <div className="label">NODE ANALYSIS REPORT</div>
                        {!analysis ? (
                            <div style={{ padding: 16, textAlign: "center" }}>
                                <p className="text-sm opacity-70 mb-3">Run analysis to see the full node report</p>
                                <button className="btn-primary" onClick={runAnalysis}>📊 Run Analysis</button>
                            </div>
                        ) : (
                            <>
                                <div style={{ padding: 10, background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
                                    <strong style={{ color: "var(--text-primary)" }}>Score Legend:</strong><br />
                                    <span style={{ color: "var(--success)" }}>▶ Out</span> = outgoing link weight (driver score) — how much this concept influences others<br />
                                    <span style={{ color: "var(--warning)" }}>◆ In</span> = incoming link weight (outcome score) — how much this concept is influenced<br />
                                    <strong>Domain</strong> = In + Out combined = total connectivity (strategic busyness)
                                </div>
                                <table style={{ fontSize: 11 }}>
                                    <thead>
                                        <tr>
                                            <th style={{ minWidth: 90 }}>Concept</th>
                                            <th style={{ textAlign: "center", width: 36 }} title="Incoming link count">In#</th>
                                            <th style={{ textAlign: "center", width: 36 }} title="Outgoing link count">Out#</th>
                                            <th style={{ textAlign: "center", width: 50 }} title="Domain = In+Out weight">Domain</th>
                                            <th style={{ textAlign: "center", width: 55 }}>Role</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(analysis.nodeReport ?? []).map(r => {
                                            const n = nodes.find(n => n.id === r.nodeId);
                                            return (
                                                <tr key={r.nodeId} style={{ cursor: "pointer" }} onClick={() => { const nd = nodes.find(nd => nd.id === r.nodeId); if (nd) { setSelectedNode(nd); setSelectedEdge(null); setViewMode("edit"); } }}>
                                                    <td style={{ fontWeight: 500 }}>{n?.title ?? r.nodeId}</td>
                                                    <td style={{ textAlign: "center", color: "var(--warning)" }}>{r.inCount}</td>
                                                    <td style={{ textAlign: "center", color: "var(--success)" }}>{r.outCount}</td>
                                                    <td style={{ textAlign: "center", fontWeight: 700 }}>{r.domain.toFixed(1)}</td>
                                                    <td style={{ textAlign: "center" }}>{roleBadge(r.role)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                )}

                {/* === ANALYSIS VIEWS (drivers, outcomes, loops, clusters) === */}
                {viewMode !== "edit" && viewMode !== "strategy" && viewMode !== "howto" && viewMode !== "report" && analysis && (
                    <div className="fade-in">
                        <div className="label mb-2">{viewMode.toUpperCase()} VIEW</div>
                        {viewMode === "drivers" && (
                            <>
                                <div style={{ padding: "6px 10px", marginBottom: 8, background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                                    <strong style={{ color: "var(--success)" }}>Driver score</strong> = sum of outgoing link weights. High-score concepts are <strong>tails</strong> — they cause/influence the most downstream effects.
                                </div>
                                {analysis.drivers.slice(0, 8).map(d => {
                                    const n = nodes.find(n => n.id === d.nodeId);
                                    const inS = analysis.scores.inStrength[d.nodeId] ?? 0;
                                    return <div key={d.nodeId} className="text-sm" style={{ padding: "6px 0", borderBottom: "1px solid var(--border-color)" }}>
                                        <span style={{ color: "var(--success)", fontWeight: 600 }}>▶</span> {n?.title ?? d.nodeId} <span className="opacity-50">({d.score.toFixed(1)} out</span> <span style={{ opacity: 0.35 }}>/ {inS.toFixed(1)} in)</span>
                                    </div>;
                                })}
                            </>
                        )}
                        {viewMode === "outcomes" && (
                            <>
                                <div style={{ padding: "6px 10px", marginBottom: 8, background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                                    <strong style={{ color: "var(--warning)" }}>Outcome score</strong> = sum of incoming link weights. High-score concepts are <strong>heads</strong> — endpoints influenced by many upstream causes.
                                </div>
                                {analysis.outcomes.slice(0, 8).map(d => {
                                    const n = nodes.find(n => n.id === d.nodeId);
                                    const outS = analysis.scores.outStrength[d.nodeId] ?? 0;
                                    return <div key={d.nodeId} className="text-sm" style={{ padding: "6px 0", borderBottom: "1px solid var(--border-color)" }}>
                                        <span style={{ color: "var(--warning)", fontWeight: 600 }}>◆</span> {n?.title ?? d.nodeId} <span className="opacity-50">({d.score.toFixed(1)} in</span> <span style={{ opacity: 0.35 }}>/ {outS.toFixed(1)} out)</span>
                                    </div>;
                                })}
                            </>
                        )}
                        {viewMode === "loops" && analysis.loops.length === 0 && <div className="text-sm opacity-50">No feedback loops detected.</div>}
                        {viewMode === "loops" && analysis.loops.map((l, i) => (
                            <div key={i} className="text-sm" style={{ padding: "6px 0", borderBottom: "1px solid var(--border-color)" }}>
                                <span style={{ color: "var(--pink)", fontWeight: 600 }}>⟳</span> Loop ({l.size} nodes): {l.nodes.map(nid => nodes.find(n => n.id === nid)?.title ?? nid).join(" → ")}
                            </div>
                        ))}
                        {viewMode === "clusters" && (
                            <div className="flex flex-col gap-2">
                                {analysis.clusters ? (() => {
                                    const groups: Record<string, string[]> = {};
                                    Object.entries(analysis.clusters).forEach(([nid, cl]) => { (groups[cl] ??= []).push(nid); });
                                    const clusterNames = Object.keys(groups);
                                    return clusterNames.map((cl, ci) => (
                                        <div key={cl} style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", border: `1px solid ${CLUSTER_PALETTE[ci % CLUSTER_PALETTE.length]}40`, background: `${CLUSTER_PALETTE[ci % CLUSTER_PALETTE.length]}10` }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: CLUSTER_PALETTE[ci % CLUSTER_PALETTE.length], marginBottom: 4, textTransform: "uppercase" }}>● {cl || "ungrouped"}</div>
                                            {groups[cl].map(nid => {
                                                const n = nodes.find(n => n.id === nid);
                                                return <div key={nid} className="text-sm" style={{ padding: "2px 0" }}>{n?.title ?? nid}</div>;
                                            })}
                                        </div>
                                    ));
                                })() : <div className="text-sm opacity-50">Run analysis first to see clusters.</div>}
                            </div>
                        )}
                    </div>
                )}

                {/* === NODE INSPECTOR === */}
                {selectedNode && (
                    <div className="fade-in">
                        <div className="label mb-2">NODE</div>
                        <label className="text-xs opacity-70">Title</label>
                        <input className="w-full mb-2" value={selectedNode.title} onChange={e => updateNodeField("title", e.target.value)} />
                        <label className="text-xs opacity-70">Note</label>
                        <textarea className="w-full mb-2" rows={3} value={selectedNode.note ?? ""} onChange={e => updateNodeField("note", e.target.value)} />
                        <label className="text-xs opacity-70">Tags (comma-separated) — used for clustering</label>
                        <input className="w-full" value={(selectedNode.tags ?? []).join(", ")} onChange={e => updateNodeField("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))} />
                    </div>
                )}

                {/* === EDGE INSPECTOR === */}
                {selectedEdge && (
                    <div className="fade-in">
                        <div className="label mb-2">EDGE</div>
                        <label className="text-xs opacity-70">Polarity</label>
                        <div className="flex gap-2 mb-2">
                            {([-1, 0, 1] as number[]).map(p => (
                                <button key={p} className={`btn-sm ${(selectedEdge.polarity ?? 0) === p ? "btn-active" : ""}`} style={{ color: POLARITY_COLORS[p] }} onClick={() => updateEdgeField("polarity", p)}>{POLARITY_LABELS[p]} {p === 1 ? "Positive" : p === -1 ? "Negative" : "Neutral"}</button>
                            ))}
                        </div>
                        <label className="text-xs opacity-70">Strength (1–5)</label>
                        <div className="flex gap-2 mb-2">
                            {[1, 2, 3, 4, 5].map(s => (
                                <button key={s} className={`btn-sm ${(selectedEdge.strength ?? 1) === s ? "btn-active" : ""}`} onClick={() => updateEdgeField("strength", s)}>{s}</button>
                            ))}
                        </div>
                        <label className="text-xs opacity-70">Note</label>
                        <textarea className="w-full" rows={2} value={selectedEdge.note ?? ""} onChange={e => updateEdgeField("note", e.target.value)} />
                    </div>
                )}

                {!selectedNode && !selectedEdge && viewMode === "edit" && (
                    <p className="text-sm opacity-50">Select a node or edge to inspect its properties, or click <strong>How-to</strong> for a guide.</p>
                )}
            </div>
        </div>
    );
}
