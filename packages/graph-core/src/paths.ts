import { Graph, NodeId } from "./types";

export function shortestPath(graph: Graph, from: NodeId, to: NodeId): NodeId[] | null {
    const out = new Map<NodeId, NodeId[]>();
    for (const n of graph.nodes) out.set(n.id, []);
    for (const e of graph.edges) out.get(e.sourceId)?.push(e.targetId);

    const prev = new Map<NodeId, NodeId | null>();
    const q: NodeId[] = [from];
    prev.set(from, null);
    while (q.length) {
        const cur = q.shift()!;
        if (cur === to) break;
        for (const nxt of out.get(cur) ?? []) { if (!prev.has(nxt)) { prev.set(nxt, cur); q.push(nxt); } }
    }
    if (!prev.has(to)) return null;
    const path: NodeId[] = [];
    let cur: NodeId | null = to;
    while (cur) { path.push(cur); cur = prev.get(cur) ?? null; }
    return path.reverse();
}
