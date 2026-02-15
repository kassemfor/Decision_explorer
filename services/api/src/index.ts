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

// ─── Maps ─────────────────────────────────────────────────────
app.get("/maps", async () => {
    const maps = await prisma.map.findMany({ orderBy: { createdAt: "desc" } });
    return { maps };
});

app.post("/maps", async (req) => {
    const body = z.object({ name: z.string().min(1), description: z.string().optional(), createdById: z.string().optional() }).parse(req.body);
    const createdById = body.createdById ?? "demo-user";
    const map = await prisma.map.create({ data: { name: body.name, description: body.description, createdById } });
    await prisma.mapRoleAssignment.upsert({ where: { mapId_userId: { mapId: map.id, userId: createdById } }, update: { role: "OWNER" }, create: { mapId: map.id, userId: createdById, role: "OWNER" } });
    return { map };
});

app.get("/maps/:id", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const map = await prisma.map.findUnique({ where: { id } });
    if (!map) return reply.code(404).send({ error: "Map not found" });
    const [nodes, edges] = await Promise.all([prisma.node.findMany({ where: { mapId: id } }), prisma.edge.findMany({ where: { mapId: id } })]);
    return { map, nodes, edges };
});

app.delete("/maps/:id", async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await prisma.map.delete({ where: { id } });
    return { ok: true };
});

// ─── Nodes ────────────────────────────────────────────────────
app.post("/maps/:id/nodes", async (req) => {
    const { id: mapId } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ id: z.string().optional(), title: z.string().min(1), note: z.string().optional(), tags: z.array(z.string()).optional(), confidence: z.number().min(0).max(1).optional(), polarity: z.number().int().min(-1).max(1).optional(), x: z.number().optional(), y: z.number().optional(), style: z.any().optional() }).parse(req.body);
    const node = await prisma.node.create({ data: { ...(body.id ? { id: body.id } : {}), mapId, title: body.title, note: body.note, tags: body.tags ?? [], confidence: body.confidence, polarity: body.polarity, x: body.x ?? 0, y: body.y ?? 0, style: body.style } });
    return { node };
});

app.patch("/nodes/:id", async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ title: z.string().optional(), note: z.string().optional(), tags: z.array(z.string()).optional(), confidence: z.number().min(0).max(1).optional(), polarity: z.number().int().min(-1).max(1).optional(), x: z.number().optional(), y: z.number().optional(), style: z.any().optional() }).parse(req.body);
    const node = await prisma.node.update({ where: { id }, data: body });
    return { node };
});

app.delete("/nodes/:id", async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await prisma.node.delete({ where: { id } });
    return { ok: true };
});

// ─── Edges ────────────────────────────────────────────────────
app.post("/maps/:id/edges", async (req) => {
    const { id: mapId } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ id: z.string().optional(), sourceId: z.string(), targetId: z.string(), type: z.string().optional(), polarity: z.number().int().min(-1).max(1).optional(), strength: z.number().int().min(1).max(5).optional(), note: z.string().optional() }).parse(req.body);
    const edge = await prisma.edge.create({ data: { ...(body.id ? { id: body.id } : {}), mapId, sourceId: body.sourceId, targetId: body.targetId, type: (body.type as any) ?? "INFLUENCES", polarity: body.polarity ?? 0, strength: body.strength ?? 1, note: body.note } });
    return { edge };
});

app.patch("/edges/:id", async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ type: z.string().optional(), polarity: z.number().int().min(-1).max(1).optional(), strength: z.number().int().min(1).max(5).optional(), note: z.string().optional() }).parse(req.body);
    const edge = await prisma.edge.update({ where: { id }, data: body });
    return { edge };
});

app.delete("/edges/:id", async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await prisma.edge.delete({ where: { id } });
    return { ok: true };
});

// ─── Analysis ─────────────────────────────────────────────────
app.post("/maps/:id/analyze", async (req) => {
    const { id: mapId } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ clustering: z.enum(["none", "tags"]).optional() }).parse(req.body ?? {});
    const [nodes, edges] = await Promise.all([prisma.node.findMany({ where: { mapId } }), prisma.edge.findMany({ where: { mapId } })]);
    const graph = { nodes: nodes.map(n => ({ id: n.id, title: n.title, tags: n.tags ?? [] })), edges: edges.map(e => ({ id: e.id, sourceId: e.sourceId, targetId: e.targetId, polarity: (e.polarity ?? 0) as any, strength: e.strength ?? 1, type: e.type })) };
    return analyzeGraph(graph, { clustering: body.clustering ?? "tags" });
});

// ─── Connect Mode ─────────────────────────────────────────────
app.post("/maps/:id/sessions", async (req) => {
    const { id: mapId } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ facilitatorId: z.string().optional() }).parse(req.body ?? {});
    const joinCode = nanoid(8).toUpperCase();
    const session = await prisma.session.create({ data: { mapId, facilitatorId: body.facilitatorId ?? "demo-user", joinCode, status: "LIVE", startedAt: new Date() } });
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
    const body = z.object({ participant: z.string().optional(), text: z.string().min(1) }).parse(req.body);
    const submission = await prisma.submission.create({ data: { sessionId, participant: body.participant, text: body.text } });
    runAgentsForSubmission({ prisma, submissionId: submission.id }).catch(() => { });
    return { submission };
});

app.get("/sessions/:id/submissions", async (req) => {
    const { id: sessionId } = z.object({ id: z.string() }).parse(req.params);
    const submissions = await prisma.submission.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" } });
    return { submissions };
});

app.post("/sessions/:id/moderate", async (req) => {
    const { id: sessionId } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ submissionId: z.string(), action: z.enum(["ACCEPT", "MERGE", "REJECT"]), targetNodeId: z.string().optional(), mapId: z.string().optional() }).parse(req.body);
    const submission = await prisma.submission.findUnique({ where: { id: body.submissionId } });
    if (!submission) return { error: "Submission not found" };
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return { error: "Session not found" };
    const mapId = body.mapId ?? session.mapId;

    if (body.action === "ACCEPT") {
        const node = await prisma.node.create({ data: { mapId, title: submission.text, x: 0, y: 0, tags: [] } });
        await prisma.submission.update({ where: { id: submission.id }, data: { status: "ACCEPTED", acceptedNodeId: node.id } });
        return { ok: true, nodeId: node.id };
    }
    if (body.action === "MERGE") {
        if (!body.targetNodeId) return { error: "targetNodeId required for MERGE" };
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
