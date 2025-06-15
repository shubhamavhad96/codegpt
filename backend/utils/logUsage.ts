import prisma from "../db/client";

export async function logUsage(userId: string, endpoint: string) {
  await prisma.usageLog.create({
    data: {
      userId,
      endpoint,
    },
  });
}
