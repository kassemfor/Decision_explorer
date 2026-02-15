import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.upsert({
        where: { email: "demo@example.com" },
        update: {},
        create: { id: "demo-user", email: "demo@example.com", name: "Demo User" }
    });
    console.log("Seeded demo user:", user);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
