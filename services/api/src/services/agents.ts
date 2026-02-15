type PrismaLike = any;

export async function runAgentsForSubmission(opts: { prisma: PrismaLike; submissionId: string }) {
    const { prisma, submissionId } = opts;
    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) return;
    // Placeholder: no LLM calls yet. Stub for future agent integration.
    return;
}
