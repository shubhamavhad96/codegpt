// backend/utils/usage.ts
import prisma from "../db/client";

export async function incrementPromptUsage(userId: string) {
  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const record = await prisma.userUsage.upsert({
    where: { userId_date: { userId, date } },
    update: { count: { increment: 1 } },
    create: { userId, date, count: 1 },
  });

  return record.count;
}
