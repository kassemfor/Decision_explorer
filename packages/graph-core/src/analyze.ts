import { Graph, AnalysisOptions, AnalysisResult, NodeId, NodeReport } from "./types";
import { stronglyConnectedComponents } from "./scc";

export function analyzeGraph(graph: Graph, options: AnalysisOptions = {}): AnalysisResult {
    const outStrength: Record<NodeId, number> = {};
    const inStrength: Record<NodeId, number> = {};
    const outCount: Record<NodeId, number> = {};
    const inCount: Record<NodeId, number> = {};

    for (const n of graph.nodes) {
        outStrength[n.id] = 0; inStrength[n.id] = 0;
        outCount[n.id] = 0; inCount[n.id] = 0;
    }

    for (const e of graph.edges) {
        const w = Math.max(0, e.strength ?? 1);
        outStrength[e.sourceId] = (outStrength[e.sourceId] ?? 0) + w;
        inStrength[e.targetId] = (inStrength[e.targetId] ?? 0) + w;
        outCount[e.sourceId] = (outCount[e.sourceId] ?? 0) + 1;
        inCount[e.targetId] = (inCount[e.targetId] ?? 0) + 1;
    }

    // Drivers (tails) = high out-strength, Outcomes (heads) = high in-strength
    const drivers = graph.nodes.map(n => ({ nodeId: n.id, score: outStrength[n.id] ?? 0 })).sort((a, b) => b.score - a.score).slice(0, 20);
    const outcomes = graph.nodes.map(n => ({ nodeId: n.id, score: inStrength[n.id] ?? 0 })).sort((a, b) => b.score - a.score).slice(0, 20);

    // SCCs for feedback loops
    const sccs = stronglyConnectedComponents(graph);
    const loops = sccs.filter(c => c.length > 1).map(c => ({ nodes: c, size: c.length })).sort((a, b) => b.size - a.size).slice(0, 50);

    // Clusters by tags
    const clusters: Record<NodeId, string> = {};
    if ((options.clustering ?? "tags") === "none") {
        for (const n of graph.nodes) clusters[n.id] = "cluster:all";
    } else {
        for (const n of graph.nodes) clusters[n.id] = `tag:${(n.tags ?? [])[0] ?? "__untagged__"}`;
    }

    // Node Report with head/tail/orphan classification
    const headNodes: NodeId[] = [];
    const tailNodes: NodeId[] = [];
    const orphans: NodeId[] = [];

    const nodeReport: NodeReport[] = graph.nodes.map(n => {
        const ic = inCount[n.id] ?? 0;
        const oc = outCount[n.id] ?? 0;
        const is_ = inStrength[n.id] ?? 0;
        const os = outStrength[n.id] ?? 0;
        let role: NodeReport["role"] = "Ordinary";
        if (ic === 0 && oc === 0) { role = "Orphan"; orphans.push(n.id); }
        else if (oc === 0) { role = "Head"; headNodes.push(n.id); }
        else if (ic === 0) { role = "Tail"; tailNodes.push(n.id); }
        return { nodeId: n.id, inCount: ic, outCount: oc, inStrength: is_, outStrength: os, domain: is_ + os, role };
    }).sort((a, b) => b.domain - a.domain);

    // Potent nodes: tails that can reach ≥2 different heads via BFS
    const adj: Record<NodeId, NodeId[]> = {};
    for (const n of graph.nodes) adj[n.id] = [];
    for (const e of graph.edges) {
        if (adj[e.sourceId]) adj[e.sourceId].push(e.targetId);
    }

    const headSet = new Set(headNodes);
    const potentNodes: NodeId[] = [];

    for (const tailId of tailNodes) {
        // BFS from this tail to find which heads are reachable
        const visited = new Set<NodeId>();
        const queue: NodeId[] = [tailId];
        visited.add(tailId);
        const reachedHeads = new Set<NodeId>();

        while (queue.length > 0) {
            const curr = queue.shift()!;
            if (headSet.has(curr) && curr !== tailId) reachedHeads.add(curr);
            for (const next of (adj[curr] ?? [])) {
                if (!visited.has(next)) { visited.add(next); queue.push(next); }
            }
        }
        if (reachedHeads.size >= 2) potentNodes.push(tailId);
    }

    return { scores: { outStrength, inStrength }, drivers, outcomes, clusters, loops, nodeReport, headNodes, tailNodes, orphans, potentNodes };
}
