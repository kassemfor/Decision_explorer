const MAP_ID = "cmln3c8y60000uy9p5oadnsvk";
const API = "http://localhost:4000";

async function post(path, body) {
    const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
    });
    return res.json();
}

async function main() {
    const nodes = [
        { id: "n1", title: "Brand Reputation", tags: ["brand"], x: 100, y: 200 },
        { id: "n2", title: "Product Quality", tags: ["product"], x: 100, y: 400 },
        { id: "n3", title: "Customer Loyalty", tags: ["customer"], x: 350, y: 300 },
        { id: "n4", title: "Market Share", tags: ["market"], x: 600, y: 200 },
        { id: "n5", title: "Pricing Power", tags: ["pricing"], x: 600, y: 400 },
        { id: "n6", title: "Innovation Capability", tags: ["innovation"], x: 350, y: 100 },
        { id: "n7", title: "Customer Acquisition Cost", tags: ["cost"], x: 850, y: 200 },
        { id: "n8", title: "Revenue Growth", tags: ["revenue"], x: 850, y: 400 },
        { id: "n9", title: "Word of Mouth", tags: ["marketing"], x: 350, y: 500 },
        { id: "n10", title: "R&D Investment", tags: ["innovation"], x: 100, y: 100 },
    ];

    for (const n of nodes) {
        const r = await post(`/maps/${MAP_ID}/nodes`, n);
        console.log(`Node: ${n.title} -> ${r.node?.id ?? "ERROR"}`);
    }

    const edges = [
        { sourceId: "n1", targetId: "n3", polarity: 1, strength: 3 },  // Brand -> Loyalty
        { sourceId: "n2", targetId: "n3", polarity: 1, strength: 3 },  // Quality -> Loyalty
        { sourceId: "n2", targetId: "n1", polarity: 1, strength: 2 },  // Quality -> Brand
        { sourceId: "n3", targetId: "n4", polarity: 1, strength: 3 },  // Loyalty -> Market Share
        { sourceId: "n3", targetId: "n5", polarity: 1, strength: 2 },  // Loyalty -> Pricing Power
        { sourceId: "n3", targetId: "n9", polarity: 1, strength: 3 },  // Loyalty -> Word of Mouth
        { sourceId: "n6", targetId: "n2", polarity: 1, strength: 3 },  // Innovation -> Quality
        { sourceId: "n6", targetId: "n1", polarity: 1, strength: 2 },  // Innovation -> Brand
        { sourceId: "n4", targetId: "n7", polarity: -1, strength: 2 }, // Market Share -> Lower CAC
        { sourceId: "n5", targetId: "n8", polarity: 1, strength: 3 },  // Pricing Power -> Revenue
        { sourceId: "n4", targetId: "n8", polarity: 1, strength: 3 },  // Market Share -> Revenue
        { sourceId: "n9", targetId: "n3", polarity: 1, strength: 2 },  // WoM -> Loyalty (loop!)
        { sourceId: "n9", targetId: "n7", polarity: -1, strength: 2 }, // WoM -> Lower CAC
        { sourceId: "n10", targetId: "n6", polarity: 1, strength: 3 }, // R&D -> Innovation
        { sourceId: "n8", targetId: "n10", polarity: 1, strength: 2 }, // Revenue -> R&D (loop!)
    ];

    for (const e of edges) {
        const r = await post(`/maps/${MAP_ID}/edges`, e);
        console.log(`Edge: ${e.sourceId} -> ${e.targetId} (${r.edge?.id ?? "ERROR"})`);
    }

    console.log(`\nDone! View at http://localhost:3001/maps/${MAP_ID}`);
}

main().catch(console.error);
