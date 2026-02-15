import { Graph, NodeId } from "./types";

export function stronglyConnectedComponents(graph: Graph): NodeId[][] {
    const adj = new Map<NodeId, NodeId[]>();
    for (const n of graph.nodes) adj.set(n.id, []);
    for (const e of graph.edges) adj.get(e.sourceId)?.push(e.targetId);

    let idx = 0;
    const stack: NodeId[] = [];
    const onStack = new Set<NodeId>();
    const index = new Map<NodeId, number>();
    const lowlink = new Map<NodeId, number>();
    const result: NodeId[][] = [];

    function connect(v: NodeId) {
        index.set(v, idx); lowlink.set(v, idx); idx++;
        stack.push(v); onStack.add(v);

        for (const w of adj.get(v) ?? []) {
            if (!index.has(w)) { connect(w); lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!)); }
            else if (onStack.has(w)) { lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!)); }
        }

        if (lowlink.get(v) === index.get(v)) {
            const comp: NodeId[] = [];
            let w: NodeId;
            do { w = stack.pop()!; onStack.delete(w); comp.push(w); } while (w !== v);
            result.push(comp);
        }
    }

    for (const n of graph.nodes) { if (!index.has(n.id)) connect(n.id); }
    return result;
}
