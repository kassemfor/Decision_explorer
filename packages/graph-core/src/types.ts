export type NodeId = string;

export interface ConceptNode {
    id: NodeId;
    title: string;
    tags?: string[];
    confidence?: number;
    polarity?: number;
}

export interface CausalEdge {
    id: string;
    sourceId: NodeId;
    targetId: NodeId;
    polarity?: number;
    strength?: number;
    type?: string;
}

export interface Graph {
    nodes: ConceptNode[];
    edges: CausalEdge[];
}

export interface AnalysisOptions {
    clustering?: "none" | "tags";
}

export interface NodeReport {
    nodeId: NodeId;
    inCount: number;
    outCount: number;
    inStrength: number;
    outStrength: number;
    domain: number;
    role: "Head" | "Tail" | "Orphan" | "Ordinary";
}

export interface AnalysisResult {
    scores: {
        outStrength: Record<NodeId, number>;
        inStrength: Record<NodeId, number>;
    };
    drivers: Array<{ nodeId: NodeId; score: number }>;
    outcomes: Array<{ nodeId: NodeId; score: number }>;
    clusters: Record<NodeId, string>;
    loops: Array<{ nodes: NodeId[]; size: number }>;
    nodeReport: NodeReport[];
    headNodes: NodeId[];
    tailNodes: NodeId[];
    orphans: NodeId[];
    potentNodes: NodeId[];
}
