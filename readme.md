


You said:
› plan and build full stack software to : Decision Explorer supports causal/cognitive mapping: you capture ideas as
  nodes (“concepts”) and link them with directed relationships to model how issues, drivers, and outcomes connect.
 
  It is aimed at managing “soft” qualitative issues in complex or uncertain situations, such as strategy development,
  policy analysis, and organisational problem structuring.
 
  It provides analysis features over the map (e.g., exploring clusters, key drivers, feedback loops) to clarify
  thinking and support decision making.t can integrate with Decision Explorer Connect for group sessions where
  participants enter and structure ideas collaboratively around a projected map.

ChatGPT said:
Below is a practical plan + build blueprint for a “Decision Explorer–style” causal / cognitive mapping product, including analysis (clusters, key drivers, feedback loops) and an optional group session “Connect” mode for live collaborative mapping.

1) Product scope
Core idea
Users capture Concepts (nodes) and connect them with directed links (edges) that represent “A influences B”.

The map supports qualitative, messy problem-structuring (strategy, policy, org issues) with analysis overlays.

MVP features
Map building

Create/edit concepts (title, notes, tags, confidence, polarity +/−, evidence links)

Create/edit directed links (type, polarity, strength, rationale)

Drag layout, multi-select, align/distribute, undo/redo

Search, filter by tags, highlight paths

Analysis

Key drivers / outcomes:

In-degree / out-degree, weighted variants

Centrality (PageRank on directed graph, betweenness optional)

Clusters:

Community detection (Louvain) or modularity-style clustering

“Theme” clustering via tags as a simpler MVP

Feedback loops:

Strongly Connected Components (SCC) + cycle listing

“Loop heatmap” overlay on edges/nodes

Collaboration (basic)

Share map with roles: owner/editor/viewer

Comments / annotations per node

Group session “Connect” mode (phase 2)
Session host opens a “live board” on projector

Participants submit ideas from phones/laptops

Moderator (facilitator) accepts/merges/subsumes and links

Live cursors, presence, and chat

Timed rounds (brainstorm → group → link → vote)

2) Recommended tech stack (full-stack)
Frontend
Next.js (React, TypeScript) for app + routing

Cytoscape.js (or React Flow) for graph editing/visualization

Cytoscape is strong for graph algorithms + layouts (cola, cose, dagre)

TanStack Query for data fetching

Tailwind + component library (shadcn/ui) for UI

Backend
Node.js (NestJS or Fastify/Express) + TypeScript

PostgreSQL (maps, nodes, edges, permissions, sessions)

Prisma ORM (fast iteration)

Redis (presence, session queues, realtime ephemeral state)

Realtime collaboration options
Yjs (CRDT) + WebSocket server (good for conflict-free live edits)

Or Liveblocks (hosted) if you want speed over control

For group sessions: a WS channel per session for submissions + moderation events

Deployment
Dockerized services

Vercel for Next.js + Fly.io / Render / AWS for API + Postgres + Redis

3) Data model (simple + scalable)
Map

id, orgId, name, description, createdBy, createdAt, updatedAt, version

Concept (Node)

id, mapId

title, note (markdown), tags (string[])

polarityDefault (optional), confidence (0–1)

x, y (for manual positions), style (color/icon optional)

Link (Edge)

id, mapId

sourceNodeId, targetNodeId

type (influences / enables / inhibits / causes / depends-on)

polarity (+1 / −1 / 0), strength (1–5), note

Permissions

mapId, userId, role

Session (Connect mode)

id, mapId, status, facilitatorId

joinCode, startedAt, endedAt

Submission

id, sessionId, participantId (or anon)

text, createdAt, status (pending/accepted/merged/rejected)

acceptedNodeId (nullable)

4) Graph analysis you should implement
Key driver / outcome scoring
Driver score: high out-degree (or out-strength) and high reachability

Outcome score: high in-degree and high reachability from drivers

Add PageRank on directed edges (optionally weighted by strength)

Clustering
Louvain community detection (works well in practice)

For MVP: cluster by tags OR by SCC groups + “neighbor similarity”

Feedback loops
Compute SCCs (Tarjan/Kosaraju). Any SCC with >1 node is a loop candidate.

Optionally enumerate simple cycles (bounded length, e.g., 3–10) to avoid blowups.

Path exploration
“Show impacts of this node”: forward BFS/DFS with depth limit

“Show causes of this node”: reverse BFS/DFS

“Shortest influence path” (unweighted BFS or weighted Dijkstra)

5) API surface (clean and minimal)
REST

POST /maps create map

GET /maps/:id fetch map + nodes + edges

POST /maps/:id/nodes create node

PATCH /nodes/:id update node

POST /maps/:id/edges create edge

PATCH /edges/:id update edge

DELETE /nodes/:id (cascade edges)

DELETE /edges/:id

Analysis

POST /maps/:id/analyze returns:

scores (driver/outcome/pagerank)

clusters (nodeId → clusterId)

loops (SCCs + optional cycles)

GET /maps/:id/paths?from=A&to=B (optional)

Connect mode

POST /maps/:id/sessions create session

POST /sessions/:code/join join (returns ws token)

POST /sessions/:id/submissions participant idea submission

POST /sessions/:id/moderate accept/merge/reject events

6) UI layout (what users will actually see)
Main “Map Editor”
Left panel: concept list + search + filters + tags

Center: graph canvas (pan/zoom, drag nodes, add edges)

Right panel: selected item details (notes, evidence, link rationale)

Top bar: Undo/redo, layout, analysis, share, session mode

Analysis overlay panel
Toggle overlays:

driver heat

outcome heat

clusters

loops

Click a node → show:

top outgoing impacts (depth 1–3)

top incoming causes

Connect mode (facilitator)
Large map view + “incoming ideas” queue

Buttons: accept as node, merge into existing node, reject, tag, link suggestions

Connect mode (participant)
Simple mobile-first page:

submit idea text

optionally pick “affects/relates to” from existing themes

see status (pending/accepted)

7) Build plan (fastest path to a working product)
Sprint 1 — Working map editor (single user)
Next.js app shell + auth

Cytoscape canvas with add/edit/delete nodes/edges

Persist to Postgres via API

Export/import JSON

Sprint 2 — Analysis engine
Implement /analyze:

degree + weighted degree

PageRank

SCC loops

simple clustering (tags or Louvain)

UI overlays + ranked “key drivers/outcomes” lists

Sprint 3 — Collaboration
Map sharing permissions

Realtime editing using Yjs (map doc = nodes/edges/positions)

Presence + cursors (optional)

Sprint 4 — Connect mode
Sessions, join codes, participant submissions

Facilitator moderation queue + actions

Projector-friendly “presentation mode”

Sprint 5 — Polish + enterprise readiness
Audit log, versioning, map snapshots

SSO (SAML/OIDC), org/workspace support

Templates (strategy map, policy map, org problem-structuring)

Export to PDF/PNG + reports (top drivers, loops, cluster summaries)

8) “Build starter” repo structure (what to generate)
decision-explorer/
  apps/
    web/                 # Next.js (UI)
    api/                 # Node API (Nest/Fastify)
    collab/              # WS/Yjs server (or integrated in api)
  packages/
    graph-core/          # shared graph types + algorithms
    ui/                  # shared UI components
  infra/
    docker-compose.yml   # postgres + redis
    migrations/
  docs/
    architecture.md
    api.md
Key shared package (graph-core)

types.ts (Node, Edge, Map)

analyze.ts (pagerank, scc, degree scoring, clustering adapter)

paths.ts (BFS/DFS, dijkstra optional)

9) Implementation notes that will save you pain
Keep graph editing local-first in the UI (optimistic updates), then sync.

Store node positions so maps don’t “jump” every time.

For analysis, run algorithms server-side for consistency on large maps (but you can also run client-side for small maps).

Cycles can explode: only enumerate cycles up to a max length and max count; rely on SCCs for the main “loop” insight.

In Connect mode, don’t let participants edit the map directly at first—route through the facilitator queue.

If you want, I can also provide:

a complete PRD (user stories + acceptance criteria),

a full DB schema (Prisma),

a ready-to-run docker-compose,

and the core graph analysis code (PageRank + SCC + clustering hooks) so your dev team can paste it in and run it.


You said:
yes all

ChatGPT said:
Awesome — here’s the complete package: PRD + user stories/acceptance, architecture, DB schema (Prisma), docker-compose, API spec, and core graph analysis code (PageRank + SCC loops + clustering stub + path exploration), plus a repo scaffold you can paste into a GitHub project.

1) PRD: Decision Explorer–style Causal / Cognitive Mapping
1.1 Problem
Teams need to structure “soft” qualitative issues (strategy, policy, org complexity) into causal maps of concepts and directed relationships to clarify drivers, outcomes, and feedback loops—often in workshops.

1.2 Goals
Create/edit concept maps (nodes/edges) quickly and intuitively

Provide analysis: key drivers/outcomes, clusters, loops, influence paths

Support collaboration, including facilitated group sessions (“Connect mode”)

1.3 Non-goals (MVP)
Fully automated natural-language map generation (can add later)

Complex quantitative system dynamics simulation

1.4 Personas
Facilitator: runs sessions, moderates, merges ideas

Analyst/Strategist: builds maps, runs analysis, produces reports

Participant: submits ideas in Connect sessions

1.5 Core Entities
Map: container for nodes/edges

Concept (Node): qualitative idea, tagged, annotated, positioned

Link (Edge): directed influence (type, polarity, strength, rationale)

Session: Connect mode workshop

Submission: participant idea awaiting moderation

1.6 Functional Requirements (MVP)
A) Map Editor
User stories

Create a map with name/description

AC: map appears in “My Maps”; can open it.

Add concepts with title + notes

AC: node renders immediately; saved to DB; editable.

Add directed links by drag or “add edge” mode

AC: edge direction is visible; can edit type/polarity/strength.

Arrange nodes (drag) and save positions

AC: reopening map preserves layout.

Search/filter nodes by title/tags

AC: list filters; graph highlights matching nodes.

B) Analysis
“Key Drivers” list (high out-strength + reachability)

AC: shows ranked nodes with scores.

“Key Outcomes” list (high in-strength)

AC: shows ranked nodes with scores.

Feedback loops detection

AC: highlights SCC groups; list of loop groups.

Clustering overlay

AC: nodes colored/grouped by clusterId.

Path exploration

AC: select node → show forward/backward impacts up to depth N.

C) Sharing & Permissions (basic)
Share map with viewer/editor

AC: permissions enforced at API.

Comments / annotations per node (optional MVP)

AC: comment list stored and displayed.

1.7 Connect Mode (Phase 2)
Facilitator

Start session, get join code

See incoming submissions queue

Accept as new node, merge into existing node, reject

Add quick tags, link suggestions, or send follow-up prompts

Participant

Join via code, submit idea text

See status (pending/accepted/rejected)

AC

Submissions appear in facilitator queue in real time

Accepted submissions create nodes (and link optionally)

Audit log of moderation actions

1.8 Quality Attributes
Fast: <200ms UI interactions, analysis <2s for 1k nodes / 5k edges

Reliable: autosave, optimistic updates

Secure: RBAC per map, org/workspace later

Scalable: analysis runs server-side; realtime via WS/CRDT

2) Architecture Overview
Services
apps/web: Next.js UI (editor + analysis + connect pages)

apps/api: Node API (Fastify) + Prisma/Postgres

apps/collab: WebSocket server (optional; can embed into api)

Realtime strategy
MVP: polling + server events (simple)

Collaboration: Yjs document per map over WebSocket (CRDT)

Connect mode: WS channels per session for submissions + moderation events

3) Repo Scaffold (folders + key files)
decision-explorer/
  apps/
    web/
      src/
        app/
        components/
        lib/
    api/
      src/
        index.ts
        routes/
        services/
        auth/
      prisma/
        schema.prisma
  packages/
    graph-core/
      src/
        types.ts
        analyze.ts
        pagerank.ts
        scc.ts
        paths.ts
        clustering.ts
      package.json
      tsconfig.json
  infra/
    docker-compose.yml
    init.sql (optional)
  docs/
    architecture.md
    api.md
    prd.md
  package.json
  pnpm-workspace.yaml
4) Database Schema (Prisma)
Create apps/api/prisma/schema.prisma:

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum MapRole {
  OWNER
  EDITOR
  VIEWER
}

enum EdgeType {
  INFLUENCES
  ENABLES
  INHIBITS
  CAUSES
  DEPENDS_ON
  RELATES_TO
}

enum SessionStatus {
  DRAFT
  LIVE
  ENDED
}

enum SubmissionStatus {
  PENDING
  ACCEPTED
  MERGED
  REJECTED
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  mapRoles  MapRoleAssignment[]
  comments  Comment[]
}

model Map {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  nodes       Node[]
  edges       Edge[]
  roles       MapRoleAssignment[]
  sessions    Session[]
}

model MapRoleAssignment {
  id     String  @id @default(cuid())
  mapId  String
  userId String
  role   MapRole

  map    Map    @relation(fields: [mapId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([mapId, userId])
  @@index([userId])
}

model Node {
  id          String   @id @default(cuid())
  mapId       String
  title       String
  note        String?
  tags        String[] @default([])
  confidence  Float?   // 0..1
  polarity    Int?     // -1,0,+1 default polarity or meaning
  x           Float    @default(0)
  y           Float    @default(0)
  style       Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  map         Map      @relation(fields: [mapId], references: [id], onDelete: Cascade)
  outgoing    Edge[]   @relation("EdgeSource")
  incoming    Edge[]   @relation("EdgeTarget")
  comments    Comment[]

  @@index([mapId])
}

model Edge {
  id          String   @id @default(cuid())
  mapId       String
  sourceId    String
  targetId    String
  type        EdgeType @default(INFLUENCES)
  polarity    Int      @default(0) // -1 inhibits, +1 supports, 0 neutral/unknown
  strength    Int      @default(1) // 1..5
  note        String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  map         Map      @relation(fields: [mapId], references: [id], onDelete: Cascade)
  source      Node     @relation("EdgeSource", fields: [sourceId], references: [id], onDelete: Cascade)
  target      Node     @relation("EdgeTarget", fields: [targetId], references: [id], onDelete: Cascade)

  @@index([mapId])
  @@index([sourceId])
  @@index([targetId])
  @@unique([mapId, sourceId, targetId, type, note], map: "uniq_edge_variant")
}

model Comment {
  id        String   @id @default(cuid())
  mapId     String
  nodeId    String
  userId    String
  body      String
  createdAt DateTime @default(now())

  map       Map      @relation(fields: [mapId], references: [id], onDelete: Cascade)
  node      Node     @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([mapId])
  @@index([nodeId])
}

model Session {
  id           String        @id @default(cuid())
  mapId        String
  facilitatorId String
  joinCode     String        @unique
  status       SessionStatus @default(DRAFT)
  startedAt    DateTime?
  endedAt      DateTime?
  createdAt    DateTime      @default(now())

  map          Map           @relation(fields: [mapId], references: [id], onDelete: Cascade)
  submissions  Submission[]

  @@index([mapId])
}

model Submission {
  id          String           @id @default(cuid())
  sessionId   String
  participant String?          // optional name/identifier
  text        String
  status      SubmissionStatus @default(PENDING)
  acceptedNodeId String?
  createdAt   DateTime         @default(now())

  session     Session          @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
}
5) docker-compose (Postgres + Redis)
Create infra/docker-compose.yml:

version: "3.9"

services:
  postgres:
    image: postgres:16
    container_name: de_postgres
    environment:
      POSTGRES_USER: de_user
      POSTGRES_PASSWORD: de_pass
      POSTGRES_DB: decision_explorer
    ports:
      - "5432:5432"
    volumes:
      - de_pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7
    container_name: de_redis
    ports:
      - "6379:6379"

volumes:
  de_pgdata:
Example apps/api/.env:

DATABASE_URL="postgresql://de_user:de_pass@localhost:5432/decision_explorer?schema=public"
PORT=4000
6) API Spec (REST) + Responses
Maps
POST /maps → create map
Body: { name, description? }
Response: { map }

GET /maps/:id → map + nodes + edges
Response: { map, nodes, edges }

Nodes
POST /maps/:id/nodes
Body: { title, note?, tags?, confidence?, polarity?, x?, y?, style? }

PATCH /nodes/:id

DELETE /nodes/:id

Edges
POST /maps/:id/edges
Body: { sourceId, targetId, type?, polarity?, strength?, note? }

PATCH /edges/:id

DELETE /edges/:id

Analysis
POST /maps/:id/analyze
Body: { maxDepth?: number, clustering?: "tags" | "louvain" | "none" }
Response:

{
  "scores": {
    "outStrength": { "nodeId": 12.3 },
    "inStrength": { "nodeId": 5.1 },
    "pagerank": { "nodeId": 0.004 }
  },
  "drivers": [{ "nodeId": "…", "score": 99 }],
  "outcomes": [{ "nodeId": "…", "score": 88 }],
  "clusters": { "nodeId": "cluster-1" },
  "loops": [
    { "nodes": ["a","b","c"], "size": 3 }
  ]
}
Connect Mode
POST /maps/:id/sessions → { joinCode, session }

POST /sessions/:code/join → { sessionId, wsToken? }

POST /sessions/:id/submissions → { submission }

POST /sessions/:id/moderate → accept/merge/reject events

7) Core Graph Analysis Package (TypeScript)
Create packages/graph-core/src/types.ts:

export type NodeId = string;

export interface ConceptNode {
  id: NodeId;
  title: string;
  tags?: string[];
  confidence?: number; // 0..1
  polarity?: -1 | 0 | 1;
}

export interface CausalEdge {
  id: string;
  sourceId: NodeId;
  targetId: NodeId;
  polarity?: -1 | 0 | 1;
  strength?: number; // 1..5
  type?: string;
}

export interface Graph {
  nodes: ConceptNode[];
  edges: CausalEdge[];
}

export interface AnalysisOptions {
  pagerank?: { damping?: number; iterations?: number; tol?: number };
  maxDepth?: number; // for reachability scoring
  clustering?: "none" | "tags" | "louvain";
}

export interface AnalysisResult {
  scores: {
    outStrength: Record<NodeId, number>;
    inStrength: Record<NodeId, number>;
    pagerank: Record<NodeId, number>;
    reachOut: Record<NodeId, number>;
    reachIn: Record<NodeId, number>;
  };
  drivers: Array<{ nodeId: NodeId; score: number }>;
  outcomes: Array<{ nodeId: NodeId; score: number }>;
  clusters: Record<NodeId, string>;
  loops: Array<{ nodes: NodeId[]; size: number }>;
}
pagerank.ts
import { Graph, NodeId } from "./types";

export function pageRank(
  graph: Graph,
  opts: { damping?: number; iterations?: number; tol?: number } = {}
): Record<NodeId, number> {
  const damping = opts.damping ?? 0.85;
  const iterations = opts.iterations ?? 50;
  const tol = opts.tol ?? 1e-9;

  const nodes = graph.nodes.map(n => n.id);
  const N = nodes.length;
  const idx = new Map<NodeId, number>();
  nodes.forEach((id, i) => idx.set(id, i));

  if (N === 0) return {};

  // Build outgoing weights
  const outWeight = new Array<number>(N).fill(0);
  const incoming: Array<Array<{ from: number; w: number }>> = Array.from({ length: N }, () => []);

  for (const e of graph.edges) {
    const s = idx.get(e.sourceId);
    const t = idx.get(e.targetId);
    if (s === undefined || t === undefined) continue;

    const w = Math.max(0, e.strength ?? 1); // use strength as weight
    outWeight[s] += w;
    incoming[t].push({ from: s, w });
  }

  // Initialize PR uniformly
  let pr = new Array<number>(N).fill(1 / N);

  for (let it = 0; it < iterations; it++) {
    const next = new Array<number>(N).fill((1 - damping) / N);

    // Handle dangling nodes (no outgoing)
    let danglingSum = 0;
    for (let i = 0; i < N; i++) {
      if (outWeight[i] === 0) danglingSum += pr[i];
    }
    const danglingContribution = damping * danglingSum / N;

    for (let i = 0; i < N; i++) {
      next[i] += danglingContribution;
      for (const inc of incoming[i]) {
        const denom = outWeight[inc.from];
        if (denom > 0) {
          next[i] += damping * pr[inc.from] * (inc.w / denom);
        }
      }
    }

    // Convergence check
    let diff = 0;
    for (let i = 0; i < N; i++) diff += Math.abs(next[i] - pr[i]);
    pr = next;
    if (diff < tol) break;
  }

  const result: Record<NodeId, number> = {};
  for (let i = 0; i < N; i++) result[nodes[i]] = pr[i];
  return result;
}
scc.ts (Tarjan SCC)
import { Graph, NodeId } from "./types";

export function stronglyConnectedComponents(graph: Graph): NodeId[][] {
  const nodes = graph.nodes.map(n => n.id);
  const adj = new Map<NodeId, NodeId[]>();
  for (const id of nodes) adj.set(id, []);
  for (const e of graph.edges) {
    if (!adj.has(e.sourceId)) adj.set(e.sourceId, []);
    adj.get(e.sourceId)!.push(e.targetId);
  }

  const index = new Map<NodeId, number>();
  const lowlink = new Map<NodeId, number>();
  const onStack = new Set<NodeId>();
  const stack: NodeId[] = [];
  const sccs: NodeId[][] = [];
  let idx = 0;

  function strongconnect(v: NodeId) {
    index.set(v, idx);
    lowlink.set(v, idx);
    idx++;
    stack.push(v);
    onStack.add(v);

    for (const w of adj.get(v) ?? []) {
      if (!index.has(w)) {
        strongconnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
      }
    }

    if (lowlink.get(v) === index.get(v)) {
      const component: NodeId[] = [];
      while (true) {
        const w = stack.pop()!;
        onStack.delete(w);
        component.push(w);
        if (w === v) break;
      }
      sccs.push(component);
    }
  }

  for (const v of nodes) {
    if (!index.has(v)) strongconnect(v);
  }
  return sccs;
}
paths.ts (reachability + shortest influence path)
import { Graph, NodeId } from "./types";

function buildAdj(graph: Graph): { out: Map<NodeId, NodeId[]>; in: Map<NodeId, NodeId[]> } {
  const out = new Map<NodeId, NodeId[]>();
  const inn = new Map<NodeId, NodeId[]>();
  for (const n of graph.nodes) {
    out.set(n.id, []);
    inn.set(n.id, []);
  }
  for (const e of graph.edges) {
    if (!out.has(e.sourceId)) out.set(e.sourceId, []);
    if (!inn.has(e.targetId)) inn.set(e.targetId, []);
    out.get(e.sourceId)!.push(e.targetId);
    inn.get(e.targetId)!.push(e.sourceId);
  }
  return { out, in: inn };
}

export function reachableCount(
  graph: Graph,
  direction: "out" | "in",
  maxDepth = 4
): Record<NodeId, number> {
  const { out, in: inn } = buildAdj(graph);
  const adj = direction === "out" ? out : inn;

  const res: Record<NodeId, number> = {};
  for (const n of graph.nodes) {
    const start = n.id;
    const seen = new Set<NodeId>([start]);
    const q: Array<{ id: NodeId; d: number }> = [{ id: start, d: 0 }];

    while (q.length) {
      const cur = q.shift()!;
      if (cur.d >= maxDepth) continue;
      for (const nxt of adj.get(cur.id) ?? []) {
        if (!seen.has(nxt)) {
          seen.add(nxt);
          q.push({ id: nxt, d: cur.d + 1 });
        }
      }
    }
    res[start] = Math.max(0, seen.size - 1);
  }
  return res;
}

export function shortestPath(
  graph: Graph,
  from: NodeId,
  to: NodeId
): NodeId[] | null {
  const { out } = buildAdj(graph);
  const prev = new Map<NodeId, NodeId | null>();
  const q: NodeId[] = [from];
  prev.set(from, null);

  while (q.length) {
    const cur = q.shift()!;
    if (cur === to) break;
    for (const nxt of out.get(cur) ?? []) {
      if (!prev.has(nxt)) {
        prev.set(nxt, cur);
        q.push(nxt);
      }
    }
  }

  if (!prev.has(to)) return null;
  const path: NodeId[] = [];
  let cur: NodeId | null = to;
  while (cur) {
    path.push(cur);
    cur = prev.get(cur) ?? null;
  }
  path.reverse();
  return path;
}
clustering.ts (MVP: tag clusters + placeholder for Louvain)
import { Graph, NodeId } from "./types";

export function clusterByTags(graph: Graph): Record<NodeId, string> {
  const clusters: Record<NodeId, string> = {};
  for (const n of graph.nodes) {
    const tags = (n.tags ?? []).filter(Boolean);
    clusters[n.id] = tags.length ? `tag:${tags[0]}` : "tag:__untagged__";
  }
  return clusters;
}

/**
 * Placeholder: implement Louvain later or use a library.
 * Keep the API stable so you can swap in real clustering without breaking UI.
 */
export function clusterLouvainStub(graph: Graph): Record<NodeId, string> {
  // For now: fall back to tags.
  return clusterByTags(graph);
}
analyze.ts (ties it all together)
import { AnalysisOptions, AnalysisResult, Graph, NodeId } from "./types";
import { pageRank } from "./pagerank";
import { stronglyConnectedComponents } from "./scc";
import { reachableCount } from "./paths";
import { clusterByTags, clusterLouvainStub } from "./clustering";

export function analyzeGraph(graph: Graph, options: AnalysisOptions = {}): AnalysisResult {
  const outStrength: Record<NodeId, number> = {};
  const inStrength: Record<NodeId, number> = {};

  for (const n of graph.nodes) {
    outStrength[n.id] = 0;
    inStrength[n.id] = 0;
  }

  for (const e of graph.edges) {
    const w = Math.max(0, e.strength ?? 1);
    outStrength[e.sourceId] = (outStrength[e.sourceId] ?? 0) + w;
    inStrength[e.targetId] = (inStrength[e.targetId] ?? 0) + w;
  }

  const pr = pageRank(graph, options.pagerank);
  const maxDepth = options.maxDepth ?? 4;
  const reachOut = reachableCount(graph, "out", maxDepth);
  const reachIn = reachableCount(graph, "in", maxDepth);

  // Drivers: outStrength + reachOut (simple composite)
  const drivers = graph.nodes
    .map(n => ({
      nodeId: n.id,
      score: (outStrength[n.id] ?? 0) * 10 + (reachOut[n.id] ?? 0) + (pr[n.id] ?? 0) * 1000,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  // Outcomes: inStrength + reachIn
  const outcomes = graph.nodes
    .map(n => ({
      nodeId: n.id,
      score: (inStrength[n.id] ?? 0) * 10 + (reachIn[n.id] ?? 0) + (pr[n.id] ?? 0) * 1000,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  // Loops via SCCs (size > 1)
  const sccs = stronglyConnectedComponents(graph);
  const loops = sccs
    .filter(c => c.length > 1)
    .map(c => ({ nodes: c, size: c.length }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 50);

  // Clusters
  const clustering = options.clustering ?? "tags";
  let clusters: Record<NodeId, string> = {};
  if (clustering === "none") {
    for (const n of graph.nodes) clusters[n.id] = "cluster:all";
  } else if (clustering === "louvain") {
    clusters = clusterLouvainStub(graph);
  } else {
    clusters = clusterByTags(graph);
  }

  return {
    scores: { outStrength, inStrength, pagerank: pr, reachOut, reachIn },
    drivers,
    outcomes,
    clusters,
    loops,
  };
}
8) Minimal API Server (Fastify + Prisma) skeleton
Create apps/api/src/index.ts:

import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { analyzeGraph } from "../../../packages/graph-core/src/analyze";
import type { Graph } from "../../../packages/graph-core/src/types";

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/health", async () => ({ ok: true }));

app.post("/maps", async (req, reply) => {
  const body = req.body as { name: string; description?: string; createdById?: string };
  const createdById = body.createdById ?? "demo-user"; // replace with real auth
  const map = await prisma.map.create({
    data: { name: body.name, description: body.description, createdById }
  });
  // Owner role for creator
  await prisma.mapRoleAssignment.upsert({
    where: { mapId_userId: { mapId: map.id, userId: createdById } },
    update: { role: "OWNER" },
    create: { mapId: map.id, userId: createdById, role: "OWNER" }
  });
  return reply.send({ map });
});

app.get("/maps/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  const map = await prisma.map.findUnique({ where: { id } });
  if (!map) return reply.code(404).send({ error: "Map not found" });

  const [nodes, edges] = await Promise.all([
    prisma.node.findMany({ where: { mapId: id } }),
    prisma.edge.findMany({ where: { mapId: id } }),
  ]);

  return reply.send({ map, nodes, edges });
});

app.post("/maps/:id/nodes", async (req, reply) => {
  const { id: mapId } = req.params as { id: string };
  const body = req.body as any;
  const node = await prisma.node.create({
    data: { mapId, title: body.title, note: body.note, tags: body.tags ?? [], confidence: body.confidence,
            polarity: body.polarity, x: body.x ?? 0, y: body.y ?? 0, style: body.style }
  });
  return reply.send({ node });
});

app.patch("/nodes/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as any;
  const node = await prisma.node.update({
    where: { id },
    data: { title: body.title, note: body.note, tags: body.tags, confidence: body.confidence,
            polarity: body.polarity, x: body.x, y: body.y, style: body.style }
  });
  return reply.send({ node });
});

app.delete("/nodes/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  await prisma.node.delete({ where: { id } });
  return reply.send({ ok: true });
});

app.post("/maps/:id/edges", async (req, reply) => {
  const { id: mapId } = req.params as { id: string };
  const body = req.body as any;
  const edge = await prisma.edge.create({
    data: { mapId, sourceId: body.sourceId, targetId: body.targetId, type: body.type ?? "INFLUENCES",
            polarity: body.polarity ?? 0, strength: body.strength ?? 1, note: body.note }
  });
  return reply.send({ edge });
});

app.patch("/edges/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as any;
  const edge = await prisma.edge.update({
    where: { id },
    data: { type: body.type, polarity: body.polarity, strength: body.strength, note: body.note }
  });
  return reply.send({ edge });
});

app.delete("/edges/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  await prisma.edge.delete({ where: { id } });
  return reply.send({ ok: true });
});

app.post("/maps/:id/analyze", async (req, reply) => {
  const { id: mapId } = req.params as { id: string };
  const body = (req.body as any) ?? {};
  const [nodes, edges] = await Promise.all([
    prisma.node.findMany({ where: { mapId } }),
    prisma.edge.findMany({ where: { mapId } }),
  ]);

  const graph: Graph = {
    nodes: nodes.map(n => ({ id: n.id, title: n.title, tags: n.tags ?? [], confidence: n.confidence ?? undefined, polarity: (n.polarity ?? 0) as any })),
    edges: edges.map(e => ({ id: e.id, sourceId: e.sourceId, targetId: e.targetId, polarity: (e.polarity ?? 0) as any, strength: e.strength ?? 1, type: e.type })),
  };

  const result = analyzeGraph(graph, { maxDepth: body.maxDepth ?? 4, clustering: body.clustering ?? "tags" });
  return reply.send(result);
});

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: "0.0.0.0" });
9) Web UI (Next.js) — key components outline (so devs can implement fast)
Suggested library
Cytoscape.js (graph canvas)

Or React Flow if you prefer React-native nodes (Cytoscape is better for algorithms/layouts)

Pages
/maps list

/maps/[id] editor

/maps/[id]/analysis optional, or analysis panel in editor

/connect/join participant join

/connect/session/[code] participant submission

/connect/facilitate/[mapId] facilitator queue + projector mode

Editor behaviors
Click canvas → add node

Shift+drag from node → create edge

Right panel → edit title/notes/tags/polarity/strength

10) Local run steps (developer-friendly)
Start infra

cd infra
docker compose up -d
Install + migrate (pnpm recommended)

pnpm install
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate
pnpm dev
Run web

cd apps/web
pnpm dev
11) What to build next (recommended defaults)
If you want this to feel like Decision Explorer quickly:

Add “map view modes”: “drivers”, “outcomes”, “loops”, “clusters”

Add “set polarity/strength quickly” with edge inspector + keyboard shortcuts

Add facilitator merge tooling (very important for Connect mode quality)

Add export: PNG/PDF + “analysis report” (drivers/outcomes/loops list)

If you paste this into a repo and tell me your preference for the stack details:

React Flow vs Cytoscape

NestJS vs Fastify

CRDT (Yjs) now or later

…I can give you a single-copy-paste monorepo package.json + pnpm workspace config and a minimal web editor implementation skeleton (ready to run, even before CRDT).


You said:
Add “map view modes”: “drivers”, “outcomes”, “loops”, “clusters”

Add “set polarity/strength quickly” with edge inspector + keyboard shortcuts

Add facilitator merge tooling (very important for Connect mode quality)

Add export: PNG/PDF + “analysis report” (drivers/outcomes/loops list)
single-copy-paste microservices package.json + pnpm workspace config and a minimal web editor implementation skeleton (ready to run, even before CRDT). agentic for multi agent will be great

ChatGPT said:
Below is a single-copy/paste monorepo skeleton (pnpm workspace + microservices) that is ready to run locally and already includes:

Map view modes: drivers | outcomes | loops | clusters

Edge inspector with fast polarity/strength editing

Keyboard shortcuts for speed

Export: PNG/PDF + analysis report (drivers/outcomes/loops)

Facilitator merge tooling (Connect mode queue + accept/merge)

A clean “agentic multi-agent” hook (pluggable agents: dedupe/merge, link suggestions, cluster labeling) — no CRDT yet

Everything is minimal but production-shaped.

0) Repo layout
decision-explorer/
  pnpm-workspace.yaml
  package.json
  tsconfig.base.json
  infra/docker-compose.yml

  packages/
    graph-core/
      package.json
      tsconfig.json
      src/

  services/
    api/
      package.json
      tsconfig.json
      prisma/schema.prisma
      src/

  apps/
    web/
      package.json
      next.config.js
      tsconfig.json
      src/
1) Workspace + root package.json
pnpm-workspace.yaml
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
  - "infra"
tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
package.json (root)
{
  "name": "decision-explorer",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "db:up": "docker compose -f infra/docker-compose.yml up -d",
    "db:down": "docker compose -f infra/docker-compose.yml down",
    "db:migrate": "pnpm --filter @de/api prisma migrate dev",
    "db:generate": "pnpm --filter @de/api prisma generate"
  }
}
2) Infra
infra/docker-compose.yml
version: "3.9"
services:
  postgres:
    image: postgres:16
    container_name: de_postgres
    environment:
      POSTGRES_USER: de_user
      POSTGRES_PASSWORD: de_pass
      POSTGRES_DB: decision_explorer
    ports:
      - "5432:5432"
    volumes:
      - de_pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7
    container_name: de_redis
    ports:
      - "6379:6379"

volumes:
  de_pgdata:
3) packages/graph-core (analysis engine)
packages/graph-core/package.json
{
  "name": "@de/graph-core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "dev": "node -e \"console.log('graph-core ok')\"",
    "build": "tsc -p tsconfig.json",
    "lint": "echo \"(optional)\""
  },
  "devDependencies": {
    "typescript": "^5.5.4"
  }
}
packages/graph-core/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "outDir": "dist",
    "declaration": true
  },
  "include": ["src/**/*.ts"]
}
packages/graph-core/src/index.ts
export * from "./types";
export * from "./analyze";
export * from "./paths";
packages/graph-core/src/types.ts
export type NodeId = string;

export interface ConceptNode {
  id: NodeId;
  title: string;
  tags?: string[];
  confidence?: number; // 0..1
  polarity?: -1 | 0 | 1;
}

export interface CausalEdge {
  id: string;
  sourceId: NodeId;
  targetId: NodeId;
  polarity?: -1 | 0 | 1;
  strength?: number; // 1..5
  type?: string;
}

export interface Graph {
  nodes: ConceptNode[];
  edges: CausalEdge[];
}

export interface AnalysisOptions {
  maxDepth?: number;
  clustering?: "none" | "tags";
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
}
packages/graph-core/src/scc.ts
import { Graph, NodeId } from "./types";

export function stronglyConnectedComponents(graph: Graph): NodeId[][] {
  const nodes = graph.nodes.map(n => n.id);
  const adj = new Map<NodeId, NodeId[]>();
  for (const id of nodes) adj.set(id, []);
  for (const e of graph.edges) {
    if (!adj.has(e.sourceId)) adj.set(e.sourceId, []);
    adj.get(e.sourceId)!.push(e.targetId);
  }

  const index = new Map<NodeId, number>();
  const lowlink = new Map<NodeId, number>();
  const onStack = new Set<NodeId>();
  const stack: NodeId[] = [];
  const sccs: NodeId[][] = [];
  let idx = 0;

  function strongconnect(v: NodeId) {
    index.set(v, idx);
    lowlink.set(v, idx);
    idx++;
    stack.push(v);
    onStack.add(v);

    for (const w of adj.get(v) ?? []) {
      if (!index.has(w)) {
        strongconnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
      }
    }

    if (lowlink.get(v) === index.get(v)) {
      const component: NodeId[] = [];
      while (true) {
        const w = stack.pop()!;
        onStack.delete(w);
        component.push(w);
        if (w === v) break;
      }
      sccs.push(component);
    }
  }

  for (const v of nodes) if (!index.has(v)) strongconnect(v);
  return sccs;
}
packages/graph-core/src/analyze.ts
import { Graph, AnalysisOptions, AnalysisResult, NodeId } from "./types";
import { stronglyConnectedComponents } from "./scc";

export function analyzeGraph(graph: Graph, options: AnalysisOptions = {}): AnalysisResult {
  const outStrength: Record<NodeId, number> = {};
  const inStrength: Record<NodeId, number> = {};

  for (const n of graph.nodes) {
    outStrength[n.id] = 0;
    inStrength[n.id] = 0;
  }

  for (const e of graph.edges) {
    const w = Math.max(0, e.strength ?? 1);
    outStrength[e.sourceId] = (outStrength[e.sourceId] ?? 0) + w;
    inStrength[e.targetId] = (inStrength[e.targetId] ?? 0) + w;
  }

  const drivers = graph.nodes
    .map(n => ({ nodeId: n.id, score: (outStrength[n.id] ?? 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const outcomes = graph.nodes
    .map(n => ({ nodeId: n.id, score: (inStrength[n.id] ?? 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const sccs = stronglyConnectedComponents(graph);
  const loops = sccs
    .filter(c => c.length > 1)
    .map(c => ({ nodes: c, size: c.length }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 50);

  const clustering = options.clustering ?? "tags";
  const clusters: Record<NodeId, string> = {};
  if (clustering === "none") {
    for (const n of graph.nodes) clusters[n.id] = "cluster:all";
  } else {
    for (const n of graph.nodes) {
      const tag = (n.tags ?? [])[0] ?? "__untagged__";
      clusters[n.id] = `tag:${tag}`;
    }
  }

  return {
    scores: { outStrength, inStrength },
    drivers,
    outcomes,
    clusters,
    loops
  };
}
packages/graph-core/src/paths.ts
import { Graph, NodeId } from "./types";

export function buildAdj(graph: Graph) {
  const out = new Map<NodeId, NodeId[]>();
  const inn = new Map<NodeId, NodeId[]>();
  for (const n of graph.nodes) { out.set(n.id, []); inn.set(n.id, []); }
  for (const e of graph.edges) {
    out.get(e.sourceId)?.push(e.targetId);
    inn.get(e.targetId)?.push(e.sourceId);
  }
  return { out, in: inn };
}

export function shortestPath(graph: Graph, from: NodeId, to: NodeId): NodeId[] | null {
  const { out } = buildAdj(graph);
  const prev = new Map<NodeId, NodeId | null>();
  const q: NodeId[] = [from];
  prev.set(from, null);

  while (q.length) {
    const cur = q.shift()!;
    if (cur === to) break;
    for (const nxt of out.get(cur) ?? []) {
      if (!prev.has(nxt)) { prev.set(nxt, cur); q.push(nxt); }
    }
  }
  if (!prev.has(to)) return null;

  const path: NodeId[] = [];
  let cur: NodeId | null = to;
  while (cur) { path.push(cur); cur = prev.get(cur) ?? null; }
  return path.reverse();
}
4) services/api (Fastify + Prisma + Connect + Agentic hooks)
services/api/package.json
{
  "name": "@de/api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "lint": "echo \"(optional)\"",
    "prisma": "prisma",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@de/graph-core": "workspace:*",
    "@prisma/client": "^5.19.1",
    "@fastify/cors": "^10.0.0",
    "fastify": "^4.28.1",
    "nanoid": "^5.0.7",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "prisma": "^5.19.1",
    "tsx": "^4.17.0",
    "typescript": "^5.5.4"
  }
}
services/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "module": "ESNext", "outDir": "dist" },
  "include": ["src/**/*.ts"]
}
services/api/.env (create this)
DATABASE_URL="postgresql://de_user:de_pass@localhost:5432/decision_explorer?schema=public"
PORT=4000
services/api/prisma/schema.prisma
(Use the Prisma schema you already have from earlier — it’s compatible. If you want I can paste the exact full file again, but to keep this message readable, reuse it.)

services/api/src/index.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { analyzeGraph } from "@de/graph-core";

import { nanoid } from "nanoid";
import { z } from "zod";
import { runAgentsForSubmission } from "./services/agents.js";

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/health", async () => ({ ok: true }));

/** ---- Maps ---- */
app.post("/maps", async (req) => {
  const body = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    createdById: z.string().optional()
  }).parse(req.body);

  const createdById = body.createdById ?? "demo-user";
  const map = await prisma.map.create({
    data: { name: body.name, description: body.description, createdById }
  });

  await prisma.mapRoleAssignment.upsert({
    where: { mapId_userId: { mapId: map.id, userId: createdById } },
    update: { role: "OWNER" },
    create: { mapId: map.id, userId: createdById, role: "OWNER" }
  });

  return { map };
});

app.get("/maps/:id", async (req, reply) => {
  const { id } = z.object({ id: z.string() }).parse(req.params);

  const map = await prisma.map.findUnique({ where: { id } });
  if (!map) return reply.code(404).send({ error: "Map not found" });

  const [nodes, edges] = await Promise.all([
    prisma.node.findMany({ where: { mapId: id } }),
    prisma.edge.findMany({ where: { mapId: id } })
  ]);

  return { map, nodes, edges };
});

/** ---- Nodes ---- */
app.post("/maps/:id/nodes", async (req) => {
  const { id: mapId } = z.object({ id: z.string() }).parse(req.params);
  const body = z.object({
    title: z.string().min(1),
    note: z.string().optional(),
    tags: z.array(z.string()).optional(),
    confidence: z.number().min(0).max(1).optional(),
    polarity: z.number().int().min(-1).max(1).optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    style: z.any().optional()
  }).parse(req.body);

  const node = await prisma.node.create({
    data: {
      mapId,
      title: body.title,
      note: body.note,
      tags: body.tags ?? [],
      confidence: body.confidence,
      polarity: body.polarity,
      x: body.x ?? 0,
      y: body.y ?? 0,
      style: body.style
    }
  });

  return { node };
});

app.patch("/nodes/:id", async (req) => {
  const { id } = z.object({ id: z.string() }).parse(req.params);
  const body = z.object({
    title: z.string().optional(),
    note: z.string().optional(),
    tags: z.array(z.string()).optional(),
    confidence: z.number().min(0).max(1).optional(),
    polarity: z.number().int().min(-1).max(1).optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    style: z.any().optional()
  }).parse(req.body);

  const node = await prisma.node.update({
    where: { id },
    data: body
  });

  return { node };
});

/** ---- Edges ---- */
app.post("/maps/:id/edges", async (req) => {
  const { id: mapId } = z.object({ id: z.string() }).parse(req.params);
  const body = z.object({
    sourceId: z.string(),
    targetId: z.string(),
    type: z.string().optional(),
    polarity: z.number().int().min(-1).max(1).optional(),
    strength: z.number().int().min(1).max(5).optional(),
    note: z.string().optional()
  }).parse(req.body);

  const edge = await prisma.edge.create({
    data: {
      mapId,
      sourceId: body.sourceId,
      targetId: body.targetId,
      type: (body.type as any) ?? "INFLUENCES",
      polarity: body.polarity ?? 0,
      strength: body.strength ?? 1,
      note: body.note
    }
  });

  return { edge };
});

app.patch("/edges/:id", async (req) => {
  const { id } = z.object({ id: z.string() }).parse(req.params);
  const body = z.object({
    type: z.string().optional(),
    polarity: z.number().int().min(-1).max(1).optional(),
    strength: z.number().int().min(1).max(5).optional(),
    note: z.string().optional()
  }).parse(req.body);

  const edge = await prisma.edge.update({ where: { id }, data: body });
  return { edge };
});

/** ---- Analysis ---- */
app.post("/maps/:id/analyze", async (req) => {
  const { id: mapId } = z.object({ id: z.string() }).parse(req.params);
  const body = z.object({
    clustering: z.enum(["none", "tags"]).optional()
  }).parse(req.body ?? {});

  const [nodes, edges] = await Promise.all([
    prisma.node.findMany({ where: { mapId } }),
    prisma.edge.findMany({ where: { mapId } })
  ]);

  const graph = {
    nodes: nodes.map(n => ({ id: n.id, title: n.title, tags: n.tags ?? [] })),
    edges: edges.map(e => ({ id: e.id, sourceId: e.sourceId, targetId: e.targetId, polarity: (e.polarity ?? 0) as any, strength: e.strength ?? 1, type: e.type }))
  };

  return analyzeGraph(graph, { clustering: body.clustering ?? "tags" });
});

/** ---- Connect Mode (Facilitator merge tooling) ---- */
app.post("/maps/:id/sessions", async (req) => {
  const { id: mapId } = z.object({ id: z.string() }).parse(req.params);
  const body = z.object({ facilitatorId: z.string().optional() }).parse(req.body ?? {});
  const joinCode = nanoid(8).toUpperCase();

  const session = await prisma.session.create({
    data: { mapId, facilitatorId: body.facilitatorId ?? "demo-user", joinCode, status: "LIVE", startedAt: new Date() }
  });
  return { session, joinCode };
});

app.post("/sessions/:code/join", async (req, reply) => {
  const { code } = z.object({ code: z.string() }).parse(req.params);
  const session = await prisma.session.findUnique({ where: { joinCode: code } });
  if (!session) return reply.code(404).send({ error: "Session not found" });
  return { sessionId: session.id };
});

app.post("/sessions/:id/submissions", async (req) => {
  const { id: sessionId } = z.object({ id: z.string() }).parse(req.params);
  const body = z.object({
    participant: z.string().optional(),
    text: z.string().min(1)
  }).parse(req.body);

  const submission = await prisma.submission.create({
    data: { sessionId, participant: body.participant, text: body.text }
  });

  // Agentic hook (dedupe/merge suggestions, link suggestions, tags)
  runAgentsForSubmission({ prisma, submissionId: submission.id }).catch(() => { /* keep MVP resilient */ });

  return { submission };
});

app.get("/sessions/:id/submissions", async (req) => {
  const { id: sessionId } = z.object({ id: z.string() }).parse(req.params);
  const submissions = await prisma.submission.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" }
  });
  return { submissions };
});

/**
 * Moderate:
 * - accept: create a new node from submission
 * - merge: mark as MERGED + optionally append text into an existing node's note
 * - reject: mark REJECTED
 */
app.post("/sessions/:id/moderate", async (req) => {
  const { id: sessionId } = z.object({ id: z.string() }).parse(req.params);
  const body = z.object({
    submissionId: z.string(),
    action: z.enum(["ACCEPT", "MERGE", "REJECT"]),
    targetNodeId: z.string().optional(),
    mapId: z.string().optional() // optional convenience
  }).parse(req.body);

  const submission = await prisma.submission.findUnique({ where: { id: body.submissionId } });
  if (!submission) return { error: "Submission not found" };

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return { error: "Session not found" };

  const mapId = body.mapId ?? session.mapId;

  if (body.action === "ACCEPT") {
    const node = await prisma.node.create({
      data: { mapId, title: submission.text, x: 0, y: 0, tags: [] }
    });
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: "ACCEPTED", acceptedNodeId: node.id }
    });
    return { ok: true, nodeId: node.id };
  }

  if (body.action === "MERGE") {
    if (!body.targetNodeId) return { error: "targetNodeId required for MERGE" };
    // Simple merge: append to note
    const target = await prisma.node.findUnique({ where: { id: body.targetNodeId } });
    const mergedNote = [target?.note ?? "", `\n\n[Merged idea] ${submission.text}`].join("").trim();
    await prisma.node.update({ where: { id: body.targetNodeId }, data: { note: mergedNote } });
    await prisma.submission.update({ where: { id: submission.id }, data: { status: "MERGED", acceptedNodeId: body.targetNodeId } });
    return { ok: true, mergedInto: body.targetNodeId };
  }

  await prisma.submission.update({ where: { id: submission.id }, data: { status: "REJECTED" } });
  return { ok: true };
});

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: "0.0.0.0" });
Agentic multi-agent hook (minimal, safe-by-default)
services/api/src/services/agents.ts

type PrismaLike = any;

/**
 * Multi-agent idea:
 * - DeduperAgent: find similar existing nodes for merge suggestions
 * - LinkSuggesterAgent: propose likely edges to/from accepted node
 * - TaggerAgent: propose tags / cluster labels
 *
 * For now: stub that records “suggestions” into node.note or logs.
 * Later: plug in LLM calls (OpenAI/ollama/openrouter) behind a single interface.
 */
export async function runAgentsForSubmission(opts: { prisma: PrismaLike; submissionId: string }) {
  const { prisma, submissionId } = opts;
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return;

  // Placeholder: no LLM calls yet.
  // You can later implement:
  // - embedding similarity search in Postgres (pgvector)
  // - LLM-based merge candidate ranking
  // - edge suggestions using map context
  // For MVP, just no-op.
  return;
}
5) apps/web (Next.js + Cytoscape editor + view modes + export)
apps/web/package.json
{
  "name": "@de/web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "lint": "next lint"
  },
  "dependencies": {
    "@de/graph-core": "workspace:*",
    "cytoscape": "^3.30.2",
    "cytoscape-cola": "^2.5.1",
    "jspdf": "^2.5.2",
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.14.12",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.4"
  }
}
apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true };
export default nextConfig;
apps/web/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "jsx": "preserve" },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
Web: minimal UI (no Tailwind to keep it copy/paste simple)
apps/web/src/lib/api.ts
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : "{}"
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPatch<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : "{}"
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
apps/web/src/app/page.tsx (create/open demo map)
"use client";

import React, { useState } from "react";
import { apiPost } from "../lib/api";

export default function Home() {
  const [mapId, setMapId] = useState<string>("");

  async function createMap() {
    const r = await apiPost<{ map: { id: string } }>("/maps", { name: "Demo Map" });
    setMapId(r.map.id);
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h1>Decision Explorer (MVP)</h1>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={createMap}>Create Demo Map</button>
        <input
          placeholder="Paste Map ID"
          value={mapId}
          onChange={(e) => setMapId(e.target.value)}
          style={{ width: 420 }}
        />
        <a href={mapId ? `/maps/${mapId}` : "#"}>Open</a>
      </div>

      <p style={{ marginTop: 16, opacity: 0.8 }}>
        Shortcuts: N=add node, E=add edge mode, Delete=delete selection,
        1/2/3 set edge polarity (-/0/+), [ and ] adjust strength.
      </p>
    </div>
  );
}
Editor Page with: view modes + edge inspector + shortcuts + export
apps/web/src/app/maps/[id]/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import cytoscape, { Core } from "cytoscape";
import cola from "cytoscape-cola";
import { jsPDF } from "jspdf";
import { apiGet, apiPatch, apiPost } from "../../../lib/api";

cytoscape.use(cola);

type DbNode = { id: string; title: string; note?: string | null; tags: string[]; x: number; y: number; polarity?: number | null; confidence?: number | null };
type DbEdge = { id: string; sourceId: string; targetId: string; polarity: number; strength: number; type: string; note?: string | null };

type AnalyzeRes = {
  scores: { outStrength: Record<string, number>; inStrength: Record<string, number> };
  drivers: Array<{ nodeId: string; score: number }>;
  outcomes: Array<{ nodeId: string; score: number }>;
  clusters: Record<string, string>;
  loops: Array<{ nodes: string[]; size: number }>;
};

type ViewMode = "edit" | "drivers" | "outcomes" | "loops" | "clusters";

export default function MapEditor({ params }: { params: { id: string } }) {
  const mapId = params.id;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  const [nodes, setNodes] = useState<DbNode[]>([]);
  const [edges, setEdges] = useState<DbEdge[]>([]);
  const [mode, setMode] = useState<ViewMode>("edit");
  const [analysis, setAnalysis] = useState<AnalyzeRes | null>(null);

  const [edgeCreateMode, setEdgeCreateMode] = useState(false);
  const [edgeDraftSource, setEdgeDraftSource] = useState<string | null>(null);

  const selected = useSelected(cyRef);

  const selectedEdge = useMemo(() => {
    if (!selected) return null;
    if (selected.kind !== "edge") return null;
    return edges.find(e => e.id === selected.id) ?? null;
  }, [selected, edges]);

  // Load map
  useEffect(() => {
    (async () => {
      const r = await apiGet<{ nodes: DbNode[]; edges: DbEdge[] }>(`/maps/${mapId}`);
      setNodes(r.nodes);
      setEdges(r.edges);
    })();
  }, [mapId]);

  // Create Cytoscape instance
  useEffect(() => {
    if (!containerRef.current) return;
    if (cyRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: [
        { selector: "node", style: { "label": "data(label)", "text-wrap": "wrap", "text-max-width": 120, "font-size": 12 } },
        { selector: "edge", style: { "curve-style": "bezier", "target-arrow-shape": "triangle", "label": "data(label)", "font-size": 10 } },
        { selector: ".dim", style: { "opacity": 0.15 } },
        { selector: ".highlight", style: { "border-width": 3 } },
        { selector: ".loopEdge", style: { "line-style": "dashed" } }
      ],
      layout: { name: "preset" }
    });

    cyRef.current = cy;

    // Click background to add node in edit mode
    cy.on("tap", async (evt) => {
      if (mode !== "edit") return;
      if (evt.target !== cy) return;
      const pos = evt.position;

      // Quick add node
      const title = prompt("Concept title?");
      if (!title) return;

      const created = await apiPost<{ node: DbNode }>(`/maps/${mapId}/nodes`, { title, x: pos.x, y: pos.y, tags: [] });
      setNodes(prev => [...prev, created.node]);
    });

    // Edge creation mode
    cy.on("tap", "node", async (evt) => {
      if (!edgeCreateMode) return;
      if (mode !== "edit") return;
      const id = evt.target.id();

      if (!edgeDraftSource) {
        setEdgeDraftSource(id);
        return;
      }
      if (edgeDraftSource === id) return;

      const created = await apiPost<{ edge: DbEdge }>(`/maps/${mapId}/edges`, {
        sourceId: edgeDraftSource,
        targetId: id,
        polarity: 0,
        strength: 1,
        type: "INFLUENCES"
      });
      setEdges(prev => [...prev, created.edge]);
      setEdgeDraftSource(null);
      setEdgeCreateMode(false);
    });

    // Save positions on drag end
    cy.on("dragfree", "node", async (evt) => {
      const n = evt.target;
      const id = n.id();
      const p = n.position();
      setNodes(prev => prev.map(x => (x.id === id ? { ...x, x: p.x, y: p.y } : x)));
      // debounced saving omitted for brevity; immediate save:
      await apiPatch(`/nodes/${id}`, { x: p.x, y: p.y });
    });

    // Delete selection
    const onKey = async (e: KeyboardEvent) => {
      const cy = cyRef.current;
      if (!cy) return;

      // Toggle edge mode
      if (e.key.toLowerCase() === "e") {
        setEdgeCreateMode(v => !v);
        setEdgeDraftSource(null);
      }

      // Quick add node
      if (e.key.toLowerCase() === "n" && mode === "edit") {
        const title = prompt("Concept title?");
        if (!title) return;
        const created = await apiPost<{ node: DbNode }>(`/maps/${mapId}/nodes`, { title, x: 0, y: 0, tags: [] });
        setNodes(prev => [...prev, created.node]);
      }

      // Edge polarity shortcuts for selected edge: 1=-1, 2=0, 3=+1
      if (selectedEdge) {
        if (e.key === "1") await updateEdge(selectedEdge.id, { polarity: -1 });
        if (e.key === "2") await updateEdge(selectedEdge.id, { polarity: 0 });
        if (e.key === "3") await updateEdge(selectedEdge.id, { polarity: 1 });

        // Strength adjust [ / ]
        if (e.key === "[") await updateEdge(selectedEdge.id, { strength: Math.max(1, selectedEdge.strength - 1) });
        if (e.key === "]") await updateEdge(selectedEdge.id, { strength: Math.min(5, selectedEdge.strength + 1) });
      }

      // Delete selected
      if (e.key === "Delete" || e.key === "Backspace") {
        const sel = cy.$(":selected");
        if (sel.empty()) return;
        // For MVP we only delete edges locally by removing from state; add API delete endpoints if desired.
        const edgeIds: string[] = [];
        sel.forEach(ele => { if (ele.isEdge()) edgeIds.push(ele.id()); });
        if (edgeIds.length) setEdges(prev => prev.filter(e => !edgeIds.includes(e.id)));
        sel.remove();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mapId, mode, edgeCreateMode, edgeDraftSource, selectedEdge]);

  // Re-render graph when nodes/edges change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.elements().remove();

    cy.add(nodes.map(n => ({
      data: { id: n.id, label: n.title },
      position: { x: n.x, y: n.y }
    })));

    cy.add(edges.map(e => ({
      data: {
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        label: edgeLabel(e)
      }
    })));

    cy.layout({ name: "preset" }).run();
  }, [nodes, edges]);

  // Apply view modes / overlays
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.elements().removeClass("dim highlight loopEdge");

    if (!analysis || mode === "edit") return;

    if (mode === "drivers") {
      const top = new Set(analysis.drivers.slice(0, 10).map(x => x.nodeId));
      cy.nodes().forEach(n => { if (!top.has(n.id())) n.addClass("dim"); else n.addClass("highlight"); });
    }

    if (mode === "outcomes") {
      const top = new Set(analysis.outcomes.slice(0, 10).map(x => x.nodeId));
      cy.nodes().forEach(n => { if (!top.has(n.id())) n.addClass("dim"); else n.addClass("highlight"); });
    }

    if (mode === "clusters") {
      // simple: dim unclustered never; instead label cluster in node label for MVP
      cy.nodes().forEach(n => {
        const cid = analysis.clusters[n.id()] ?? "cluster:all";
        n.data("label", `${n.data("label")}  [${cid.replace("tag:", "")}]`);
      });
    }

    if (mode === "loops") {
      const loopEdges = new Set<string>();
      const loopNodes = new Set<string>();
      for (const loop of analysis.loops) for (const nid of loop.nodes) loopNodes.add(nid);

      // mark edges where both ends in loopNodes
      cy.edges().forEach(e => {
        if (loopNodes.has(e.source().id()) && loopNodes.has(e.target().id())) {
          e.addClass("loopEdge");
          loopEdges.add(e.id());
        }
      });
      cy.nodes().forEach(n => { if (!loopNodes.has(n.id())) n.addClass("dim"); else n.addClass("highlight"); });
      cy.edges().forEach(e => { if (!loopEdges.has(e.id())) e.addClass("dim"); });
    }
  }, [analysis, mode]);

  async function runAnalysis() {
    const r = await apiPost<AnalyzeRes>(`/maps/${mapId}/analyze`, { clustering: "tags" });
    setAnalysis(r);
  }

  async function updateEdge(edgeId: string, patch: Partial<Pick<DbEdge, "polarity" | "strength" | "note" | "type">>) {
    const updated = await apiPatch<{ edge: DbEdge }>(`/edges/${edgeId}`, patch);
    setEdges(prev => prev.map(e => (e.id === edgeId ? updated.edge : e)));
  }

  async function exportPNG() {
    const cy = cyRef.current;
    if (!cy) return;
    const png = cy.png({ output: "base64uri", full: true, scale: 2 });
    downloadDataUrl(png, `map-${mapId}.png`);
  }

  async function exportPDF() {
    const cy = cyRef.current;
    if (!cy) return;

    // 1) image
    const png = cy.png({ output: "base64uri", full: true, scale: 2 });

    // 2) analysis report text
    const report = buildAnalysisReport(analysis);

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.text("Decision Map Export", 40, 40);
    doc.addImage(png, "PNG", 40, 60, 760, 420);

    doc.addPage("a4", "portrait");
    doc.text("Analysis Report", 40, 40);
    const lines = doc.splitTextToSize(report, 520);
    doc.text(lines, 40, 70);

    doc.save(`map-${mapId}.pdf`);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 320px", height: "100vh", fontFamily: "system-ui" }}>
      {/* Left panel */}
      <div style={{ borderRight: "1px solid #ddd", padding: 12, overflow: "auto" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={runAnalysis}>Run Analysis</button>
          <button onClick={() => setMode("edit")}>Edit</button>
          <button disabled={!analysis} onClick={() => setMode("drivers")}>Drivers</button>
          <button disabled={!analysis} onClick={() => setMode("outcomes")}>Outcomes</button>
          <button disabled={!analysis} onClick={() => setMode("loops")}>Loops</button>
          <button disabled={!analysis} onClick={() => setMode("clusters")}>Clusters</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", fontSize: 12, opacity: 0.7 }}>Edge mode</label>
          <button onClick={() => { setEdgeCreateMode(v => !v); setEdgeDraftSource(null); }}>
            {edgeCreateMode ? "Edge Mode: ON" : "Edge Mode: OFF"} (E)
          </button>
          {edgeDraftSource && <div style={{ marginTop: 6, fontSize: 12 }}>Pick target for: {edgeDraftSource}</div>}
        </div>

        <hr style={{ margin: "12px 0" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportPNG}>Export PNG</button>
          <button onClick={exportPDF}>Export PDF</button>
        </div>

        {analysis && (
          <>
            <hr style={{ margin: "12px 0" }} />
            <h3 style={{ margin: "8px 0" }}>Top Drivers</h3>
            <ol>
              {analysis.drivers.slice(0, 10).map(d => (
                <li key={d.nodeId}>{nodeTitle(nodes, d.nodeId)} ({d.score.toFixed(1)})</li>
              ))}
            </ol>
            <h3 style={{ margin: "8px 0" }}>Top Outcomes</h3>
            <ol>
              {analysis.outcomes.slice(0, 10).map(o => (
                <li key={o.nodeId}>{nodeTitle(nodes, o.nodeId)} ({o.score.toFixed(1)})</li>
              ))}
            </ol>
            <h3 style={{ margin: "8px 0" }}>Loops</h3>
            <ul>
              {analysis.loops.slice(0, 8).map((l, i) => (
                <li key={i}>size {l.size}: {l.nodes.slice(0, 6).map(nid => nodeTitle(nodes, nid)).join(", ")}{l.nodes.length > 6 ? "…" : ""}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />

      {/* Right panel: Edge Inspector */}
      <div style={{ borderLeft: "1px solid #ddd", padding: 12, overflow: "auto" }}>
        <h3>Inspector</h3>

        {!selected && <div style={{ opacity: 0.7 }}>Select a node or edge</div>}

        {selected?.kind === "node" && (
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Node</div>
            <div><b>{nodeTitle(nodes, selected.id)}</b></div>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              (MVP) Node editing is via DB patching; add fields as you like.
            </div>
          </div>
        )}

        {selectedEdge && (
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Edge</div>
            <div style={{ marginTop: 6 }}>
              <div><b>{nodeTitle(nodes, selectedEdge.sourceId)}</b> → <b>{nodeTitle(nodes, selectedEdge.targetId)}</b></div>
              <div style={{ marginTop: 8 }}>
                <label>Polarity</label>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <button onClick={() => updateEdge(selectedEdge.id, { polarity: -1 })}>-1 (1)</button>
                  <button onClick={() => updateEdge(selectedEdge.id, { polarity: 0 })}>0 (2)</button>
                  <button onClick={() => updateEdge(selectedEdge.id, { polarity: 1 })}>+1 (3)</button>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <label>Strength: {selectedEdge.strength}</label>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <button onClick={() => updateEdge(selectedEdge.id, { strength: Math.max(1, selectedEdge.strength - 1) })}>- ([)</button>
                  <button onClick={() => updateEdge(selectedEdge.id, { strength: Math.min(5, selectedEdge.strength + 1) })}>+ (])</button>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <label>Note</label>
                <textarea
                  defaultValue={selectedEdge.note ?? ""}
                  onBlur={(e) => updateEdge(selectedEdge.id, { note: e.target.value })}
                  style={{ width: "100%", height: 120 }}
                />
              </div>
            </div>
          </div>
        )}

        <hr style={{ margin: "12px 0" }} />
        <h4>Shortcuts</h4>
        <ul style={{ paddingLeft: 18 }}>
          <li><b>N</b>: add node</li>
          <li><b>E</b>: toggle edge mode</li>
          <li><b>1/2/3</b>: set edge polarity (-/0/+)</li>
          <li><b>[ / ]</b>: decrease/increase edge strength</li>
          <li><b>Del</b>: delete selection (MVP: local)</li>
        </ul>
      </div>
    </div>
  );
}

function edgeLabel(e: DbEdge) {
  const pol = e.polarity === 1 ? "+" : e.polarity === -1 ? "−" : "0";
  return `${pol}  s${e.strength}`;
}

function nodeTitle(nodes: DbNode[], id: string) {
  return nodes.find(n => n.id === id)?.title ?? id;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function buildAnalysisReport(analysis: AnalyzeRes | null) {
  if (!analysis) return "No analysis has been run.\n\nRun Analysis, then export again.";
  const lines: string[] = [];
  lines.push("Top Drivers:");
  analysis.drivers.slice(0, 20).forEach((d, i) => lines.push(`${i + 1}. ${d.nodeId}  score=${d.score.toFixed(2)}`));
  lines.push("");
  lines.push("Top Outcomes:");
  analysis.outcomes.slice(0, 20).forEach((o, i) => lines.push(`${i + 1}. ${o.nodeId}  score=${o.score.toFixed(2)}`));
  lines.push("");
  lines.push("Loops (SCCs):");
  analysis.loops.slice(0, 30).forEach((l, i) => lines.push(`${i + 1}. size=${l.size} nodes=${l.nodes.join(", ")}`));
  return lines.join("\n");
}

function useSelected(cyRef: React.MutableRefObject<Core | null>) {
  const [sel, setSel] = useState<{ kind: "node" | "edge"; id: string } | null>(null);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const onSel = () => {
      const s = cy.$(":selected");
      if (s.empty()) return setSel(null);
      const ele = s[0];
      setSel({ kind: ele.isEdge() ? "edge" : "node", id: ele.id() });
    };

    cy.on("select unselect", "node,edge", onSel);
    return () => { cy.off("select unselect", "node,edge", onSel); };
  }, [cyRef]);

  return sel;
}
6) Facilitator merge tooling UI + participant UI (minimal)
Participant join + submit
Create apps/web/src/app/connect/join/page.tsx

"use client";
import React, { useState } from "react";
import { apiPost } from "../../lib/api";

export default function Join() {
  const [code, setCode] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  async function join() {
    const r = await apiPost<{ sessionId: string }>(`/sessions/${code}/join`);
    setSessionId(r.sessionId);
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h2>Join Session</h2>
      <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="JOIN CODE" />
      <button onClick={join} style={{ marginLeft: 8 }}>Join</button>
      {sessionId && <div style={{ marginTop: 12 }}><a href={`/connect/session/${sessionId}`}>Go to submission page</a></div>}
    </div>
  );
}
Create apps/web/src/app/connect/session/[id]/page.tsx

"use client";
import React, { useState } from "react";
import { apiPost } from "../../../lib/api";

export default function Session({ params }: { params: { id: string } }) {
  const sessionId = params.id;
  const [text, setText] = useState("");
  const [ok, setOk] = useState(false);

  async function submit() {
    await apiPost(`/sessions/${sessionId}/submissions`, { text });
    setText("");
    setOk(true);
    setTimeout(() => setOk(false), 1500);
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h2>Submit Idea</h2>
      <textarea style={{ width: "100%", height: 140 }} value={text} onChange={(e) => setText(e.target.value)} />
      <div style={{ marginTop: 8 }}>
        <button onClick={submit} disabled={!text.trim()}>Submit</button>
        {ok && <span style={{ marginLeft: 10 }}>✅ Submitted</span>}
      </div>
    </div>
  );
}
Facilitator page
Create apps/web/src/app/connect/facilitate/[mapId]/page.tsx

"use client";
import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../../lib/api";

type Session = { id: string; joinCode: string };
type Submission = { id: string; text: string; status: string; acceptedNodeId?: string | null; createdAt: string };

export default function Facilitate({ params }: { params: { mapId: string } }) {
  const mapId = params.mapId;
  const [session, setSession] = useState<Session | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mergeTarget, setMergeTarget] = useState<string>("");

  async function start() {
    const r = await apiPost<{ session: Session; joinCode: string }>(`/maps/${mapId}/sessions`, {});
    setSession(r.session);
  }

  async function refresh() {
    if (!session) return;
    const r = await apiGet<{ submissions: Submission[] }>(`/sessions/${session.id}/submissions`);
    setSubmissions(r.submissions);
  }

  async function moderate(submissionId: string, action: "ACCEPT" | "MERGE" | "REJECT") {
    if (!session) return;
    await apiPost(`/sessions/${session.id}/moderate`, {
      submissionId,
      action,
      targetNodeId: action === "MERGE" ? mergeTarget : undefined,
      mapId
    });
    await refresh();
  }

  useEffect(() => { refresh(); }, [session]);
  useEffect(() => {
    if (!session) return;
    const t = setInterval(refresh, 1500);
    return () => clearInterval(t);
  }, [session]);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h2>Facilitate Session</h2>
      {!session ? (
        <button onClick={start}>Start Session</button>
      ) : (
        <>
          <div style={{ marginBottom: 10 }}>
            Join code: <b>{session.joinCode}</b> — share: <code>/connect/join</code>
          </div>

          <div style={{ marginBottom: 10 }}>
            MERGE targetNodeId (paste from map):{" "}
            <input value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)} style={{ width: 420 }} />
          </div>

          <table cellPadding={8} style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th>Idea</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ width: "60%" }}>{s.text}</td>
                  <td>{s.status}</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => moderate(s.id, "ACCEPT")}>Accept → node</button>
                    <button onClick={() => moderate(s.id, "MERGE")} disabled={!mergeTarget}>Merge → target</button>
                    <button onClick={() => moderate(s.id, "REJECT")}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ marginTop: 12, opacity: 0.7 }}>
            Next step: enhance merge UI to show suggested targets + similarity scores (agentic).
          </p>
        </>
      )}
    </div>
  );
}
7) Run instructions (local)
# from repo root
pnpm install
pnpm db:up

# prisma (first time)
pnpm db:migrate
pnpm db:generate

# run everything
pnpm dev
Web: http://localhost:3000

API: http://localhost:4000/health

8) What “agentic multi-agent” means here (practical)
You’ll add a pluggable agent runtime in services/api/src/services/agents.ts:

Agents you’ll want (in this order):

DeduperAgent: suggests merge candidates for a submission (future: embeddings + pgvector)

LinkSuggesterAgent: suggests edges to/from existing nodes (using titles + local neighborhood)

TaggerAgent: proposes tags + cluster labels

WorkshopAssistantAgent: prompts facilitator with next-round questions (“What causes X?” “Any constraints?”)

Implementation pattern:

Agents read map context (nodes/edges + recent submissions)

Agents write suggestions (store in Submission metadata or a Suggestion table)

UI shows facilitator “Suggested merge targets” + “Suggested links”

If you want, I can paste the Suggestion table Prisma model + endpoints + facilitator UI panel next, using a clean contract like:

type Suggestion = { kind: "MERGE" | "EDGE" | "TAG"; confidence: number; payload: any; };
If you want the next upgrade (still before CRDT), tell me one preference and I’ll adapt the skeleton accordingly without questions:

Cytoscape stays (best for maps) or switch to React Flow

Add real delete endpoints (nodes/edges) + undo/redo

Add reports export as a nicer formatted PDF (tables + loop sections + cluster summaries)


You said:
Cytoscape stays (best for maps) or switch to React Flow
Add real delete endpoints (nodes/edges) + undo/redo
Add reports export as a nicer formatted PDF (tables + loop sections + cluster summaries)

ChatGPT said:
Go with Cytoscape (it’s the better fit here: mature graph layouts, algorithms, export, huge maps). Below are drop-in additions/patches to your skeleton to add:

Real DELETE endpoints (nodes + edges)

Undo/Redo (client-side, with server sync)

Nicer PDF report export (tables + loops + cluster summaries + embedded map image)

1) API: add real delete endpoints
Add these to services/api/src/index.ts (near the other routes):

app.delete("/edges/:id", async (req) => {
  const { id } = z.object({ id: z.string() }).parse(req.params);
  await prisma.edge.delete({ where: { id } });
  return { ok: true };
});

app.delete("/nodes/:id", async (req) => {
  const { id } = z.object({ id: z.string() }).parse(req.params);
  // Cascades to edges because your Prisma relations have onDelete: Cascade
  await prisma.node.delete({ where: { id } });
  return { ok: true };
});
Also add to services/api/package.json nothing needed (Fastify already supports DELETE).

2) Web: add apiDelete helper
Create/update apps/web/src/lib/api.ts:

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
3) Web: Undo/Redo + real deletes
3.1 Add an Undo/Redo stack helper
Create apps/web/src/lib/undo.ts:

export type Patch = {
  label: string;
  do: () => Promise<void> | void;
  undo: () => Promise<void> | void;
};

export class UndoStack {
  private undoStack: Patch[] = [];
  private redoStack: Patch[] = [];

  push(p: Patch) {
    this.undoStack.push(p);
    this.redoStack = [];
  }

  async undo() {
    const p = this.undoStack.pop();
    if (!p) return;
    await p.undo();
    this.redoStack.push(p);
  }

  async redo() {
    const p = this.redoStack.pop();
    if (!p) return;
    await p.do();
    this.undoStack.push(p);
  }

  canUndo() { return this.undoStack.length > 0; }
  canRedo() { return this.redoStack.length > 0; }
}
3.2 Patch the editor to use it + DELETE calls
In apps/web/src/app/maps/[id]/page.tsx:

A) Update imports

import { apiDelete, apiGet, apiPatch, apiPost } from "../../../lib/api";
import { UndoStack } from "../../../lib/undo";
B) Create the stack
Inside component:

const undoRef = useRef<UndoStack>(new UndoStack());
C) Add keyboard shortcuts Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z
Inside your onKey handler (before other logic is fine):

const isMac = navigator.platform.toLowerCase().includes("mac");
const mod = isMac ? e.metaKey : e.ctrlKey;

if (mod && e.key.toLowerCase() === "z") {
  e.preventDefault();
  if (e.shiftKey) await undoRef.current.redo();
  else await undoRef.current.undo();
  return;
}
D) When creating a node, push undo
In the background-tap handler where you create a node, replace the final part with:

const created = await apiPost<{ node: DbNode }>(`/maps/${mapId}/nodes`, { title, x: pos.x, y: pos.y, tags: [] });

setNodes(prev => [...prev, created.node]);

undoRef.current.push({
  label: "Create node",
  do: async () => { setNodes(prev => [...prev, created.node]); },
  undo: async () => {
    await apiDelete(`/nodes/${created.node.id}`);
    setNodes(prev => prev.filter(n => n.id !== created.node.id));
    setEdges(prev => prev.filter(e => e.sourceId !== created.node.id && e.targetId !== created.node.id));
  }
});
E) When creating an edge, push undo
In the edge creation block:

const created = await apiPost<{ edge: DbEdge }>(`/maps/${mapId}/edges`, {
  sourceId: edgeDraftSource,
  targetId: id,
  polarity: 0,
  strength: 1,
  type: "INFLUENCES"
});
setEdges(prev => [...prev, created.edge]);

undoRef.current.push({
  label: "Create edge",
  do: async () => { setEdges(prev => [...prev, created.edge]); },
  undo: async () => {
    await apiDelete(`/edges/${created.edge.id}`);
    setEdges(prev => prev.filter(e => e.id !== created.edge.id));
  }
});
F) Edge edits (polarity/strength/note) should be undoable
Modify updateEdge to capture “before”:

async function updateEdge(edgeId: string, patch: Partial<Pick<DbEdge, "polarity" | "strength" | "note" | "type">>) {
  const before = edges.find(e => e.id === edgeId);
  if (!before) return;

  const updated = await apiPatch<{ edge: DbEdge }>(`/edges/${edgeId}`, patch);
  setEdges(prev => prev.map(e => (e.id === edgeId ? updated.edge : e)));

  undoRef.current.push({
    label: "Update edge",
    do: async () => {
      const r = await apiPatch<{ edge: DbEdge }>(`/edges/${edgeId}`, patch);
      setEdges(prev => prev.map(e => (e.id === edgeId ? r.edge : e)));
    },
    undo: async () => {
      const r = await apiPatch<{ edge: DbEdge }>(`/edges/${edgeId}`, {
        polarity: before.polarity,
        strength: before.strength,
        note: before.note ?? null,
        type: before.type
      });
      setEdges(prev => prev.map(e => (e.id === edgeId ? r.edge : e)));
    }
  });
}
G) Real delete on Delete/Backspace with undo
Replace your current “delete selection” section with this:

if (e.key === "Delete" || e.key === "Backspace") {
  const cy = cyRef.current;
  if (!cy) return;

  const sel = cy.$(":selected");
  if (sel.empty()) return;

  // Capture selected entities for undo
  const selectedNodeIds: string[] = [];
  const selectedEdgeIds: string[] = [];
  sel.forEach(ele => {
    if (ele.isNode()) selectedNodeIds.push(ele.id());
    if (ele.isEdge()) selectedEdgeIds.push(ele.id());
  });

  // Build snapshots
  const nodeSnapshot = nodes.filter(n => selectedNodeIds.includes(n.id));
  const edgeSnapshot = edges.filter(e2 =>
    selectedEdgeIds.includes(e2.id) ||
    selectedNodeIds.includes(e2.sourceId) ||
    selectedNodeIds.includes(e2.targetId)
  );

  // DO: delete on server, update state, remove from cy
  const doDelete = async () => {
    // Delete edges first (safe), then nodes
    for (const eid of edgeSnapshot.map(x => x.id)) {
      try { await apiDelete(`/edges/${eid}`); } catch {}
    }
    for (const nid of nodeSnapshot.map(x => x.id)) {
      try { await apiDelete(`/nodes/${nid}`); } catch {}
    }
    setEdges(prev => prev.filter(e2 => !edgeSnapshot.some(x => x.id === e2.id) && !selectedNodeIds.includes(e2.sourceId) && !selectedNodeIds.includes(e2.targetId)));
    setNodes(prev => prev.filter(n => !selectedNodeIds.includes(n.id)));
    sel.remove();
  };

  // UNDO: recreate nodes then edges (best-effort)
  const undoDelete = async () => {
    // recreate nodes
    for (const n of nodeSnapshot) {
      const created = await apiPost<{ node: DbNode }>(`/maps/${mapId}/nodes`, {
        title: n.title, note: n.note ?? undefined, tags: n.tags ?? [], x: n.x, y: n.y, polarity: n.polarity ?? undefined, confidence: n.confidence ?? undefined
      });
      // map old->new ids if needed; MVP assumes stable IDs (Prisma will create new).
      // If you want perfect undo identity, add an endpoint to create with explicit ID.
      setNodes(prev => [...prev, created.node]);
    }
    // recreate edges only if their endpoints exist (best effort)
    // (Perfect undo requires explicit IDs; see note below.)
    for (const e2 of edgeSnapshot) {
      if (!nodes.some(n => n.id === e2.sourceId) || !nodes.some(n => n.id === e2.targetId)) continue;
      const created = await apiPost<{ edge: DbEdge }>(`/maps/${mapId}/edges`, {
        sourceId: e2.sourceId, targetId: e2.targetId, polarity: e2.polarity, strength: e2.strength, type: e2.type, note: e2.note ?? undefined
      });
      setEdges(prev => [...prev, created.edge]);
    }
  };

  undoRef.current.push({ label: "Delete selection", do: doDelete, undo: undoDelete });
  await doDelete();
}
✅ This gives you real delete + undo, but note: IDs won’t match on undo unless you allow “create with explicit ID”.

If you want perfect undo fidelity (recommended):

Add id?: string to node/edge create endpoints and pass it to Prisma create({ data: { id: body.id ?? undefined, ... }}).

Then undo can recreate the exact same IDs and your edges always reattach correctly.

4) Nicer PDF export: tables + loops sections + cluster summaries
Replace your exportPDF() with this upgraded version (still using jspdf, no extra libs):

async function exportPDF() {
  const cy = cyRef.current;
  if (!cy) return;

  const png = cy.png({ output: "base64uri", full: true, scale: 2 });
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  const margin = 40;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - margin * 2;

  const title = "Decision Map Report";
  doc.setFontSize(18);
  doc.text(title, margin, 40);

  // Map image (scaled to fit)
  doc.setFontSize(10);
  doc.text(`Map ID: ${mapId}`, margin, 58);

  // Fit image into a box
  const imgX = margin;
  const imgY = 70;
  const imgW = contentW;
  const imgH = 320;
  doc.addImage(png, "PNG", imgX, imgY, imgW, imgH);

  // Analysis section
  doc.addPage("a4", "portrait");
  doc.setFontSize(16);
  doc.text("Analysis Summary", margin, 40);

  if (!analysis) {
    doc.setFontSize(12);
    doc.text("No analysis has been run. Run Analysis and export again.", margin, 70);
    doc.save(`map-${mapId}.pdf`);
    return;
  }

  // Helper to draw tables
  let y = 60;

  y = drawTable(doc, margin, y, contentW, "Top Drivers", ["Rank", "Concept", "Score"], analysis.drivers.slice(0, 15).map((d, i) => [
    String(i + 1),
    nodeTitle(nodes, d.nodeId),
    d.score.toFixed(2)
  ]));

  y += 14;
  y = drawTable(doc, margin, y, contentW, "Top Outcomes", ["Rank", "Concept", "Score"], analysis.outcomes.slice(0, 15).map((o, i) => [
    String(i + 1),
    nodeTitle(nodes, o.nodeId),
    o.score.toFixed(2)
  ]));

  // Loops page
  doc.addPage("a4", "portrait");
  doc.setFontSize(16);
  doc.text("Feedback Loops (Strongly Connected Components)", margin, 40);

  y = 64;
  const loopRows = analysis.loops.slice(0, 25).map((l, i) => [
    String(i + 1),
    String(l.size),
    l.nodes.slice(0, 8).map(nid => nodeTitle(nodes, nid)).join("; ") + (l.nodes.length > 8 ? " …" : "")
  ]);

  y = drawTable(doc, margin, y, contentW, "Loops", ["#", "Size", "Members"], loopRows, [40, 60, contentW - 100]);

  // Cluster summary page
  doc.addPage("a4", "portrait");
  doc.setFontSize(16);
  doc.text("Cluster Summary", margin, 40);

  const clusterCounts = countClusters(analysis.clusters, nodes);
  y = 64;

  const clusterRows = clusterCounts.slice(0, 40).map((c, i) => [
    String(i + 1),
    c.clusterLabel,
    String(c.count),
    c.examples.join("; ")
  ]);

  y = drawTable(doc, margin, y, contentW, "Clusters", ["#", "Cluster", "Count", "Examples"], clusterRows, [40, 130, 60, contentW - 230]);

  doc.save(`map-${mapId}.pdf`);
}

function drawTable(
  doc: jsPDF,
  x: number,
  startY: number,
  w: number,
  title: string,
  headers: string[],
  rows: string[][],
  colWidths?: number[]
) {
  const lineH = 14;
  const pad = 6;
  const headerH = 18;
  const yGap = 8;

  const pageH = doc.internal.pageSize.getHeight();
  let y = startY;

  doc.setFontSize(13);
  doc.text(title, x, y);
  y += 10;

  doc.setFontSize(10);

  const widths = colWidths ?? autoColWidths(w, headers.length);

  const drawRow = (cells: string[], isHeader = false) => {
    const rowH = isHeader ? headerH : lineH;
    // page break
    if (y + rowH + 20 > pageH) {
      doc.addPage();
      y = 40;
    }

    let cx = x;
    // borders
    doc.setDrawColor(160);
    doc.rect(x, y, w, rowH);

    for (let i = 0; i < cells.length; i++) {
      const cw = widths[i] ?? widths[widths.length - 1];
      doc.rect(cx, y, cw, rowH);
      const txt = truncate(doc, cells[i] ?? "", cw - pad * 2);
      doc.text(txt, cx + pad, y + (rowH * 0.7));
      cx += cw;
    }
    y += rowH;
  };

  drawRow(headers, true);
  for (const r of rows) drawRow(r, false);

  return y + yGap;
}

function autoColWidths(totalW: number, n: number) {
  const base = Math.floor(totalW / n);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? totalW - base * (n - 1) : base));
}

function truncate(doc: jsPDF, text: string, maxW: number) {
  // naive truncation by measuring string width
  if (doc.getTextWidth(text) <= maxW) return text;
  let t = text;
  while (t.length > 3 && doc.getTextWidth(t + "…") > maxW) t = t.slice(0, -1);
  return t + "…";
}

function countClusters(clusters: Record<string, string>, nodes: DbNode[]) {
  const map = new Map<string, { count: number; examples: string[] }>();
  for (const n of nodes) {
    const c = clusters[n.id] ?? "cluster:all";
    const e = map.get(c) ?? { count: 0, examples: [] };
    e.count += 1;
    if (e.examples.length < 3) e.examples.push(n.title);
    map.set(c, e);
  }
  return Array.from(map.entries())
    .map(([clusterLabel, v]) => ({ clusterLabel: clusterLabel.replace("tag:", ""), count: v.count, examples: v.examples }))
    .sort((a, b) => b.count - a.count);
}
This produces:

Page 1: Map image

Page 2: Drivers + Outcomes tables

Page 3: Loops table

Page 4: Cluster summary (counts + examples)

5) UX: Add toolbar Undo/Redo buttons (optional but useful)
Left panel controls can include:

<button onClick={() => undoRef.current.undo()}>Undo (Ctrl/Cmd+Z)</button>
<button onClick={() => undoRef.current.redo()}>Redo (Ctrl/Cmd+Shift+Z)</button>
6) One important note (so Undo/Redo is perfect)
Right now, undoing deletes recreates entities with new IDs unless you allow explicit IDs on create.
If you want perfect undo/redo:

API create endpoints accept id?: string
For nodes: add id optional in zod schema + prisma create data

For edges: same

Then the undo can recreate exact IDs and edges always reconnect.

If you want, I’ll paste the exact small diffs for those two create endpoints too.