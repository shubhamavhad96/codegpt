import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function checkAndIncrementUsage(userId: string): Promise<boolean> {
  try {
    console.log("[checkAndIncrementUsage] Called for userId:", userId);
    const user = await prisma.user.findUnique({ where: { userId } });

    if (!user) {
      console.log(`[checkAndIncrementUsage] ❌ No user found with userId: ${userId}`);
      return false;
    }

    console.log(`[checkAndIncrementUsage] 🔍 Checking limits for user: ${userId}`);
    console.log(`[checkAndIncrementUsage] → Plan: ${user.plan}, Used: ${user.promptsUsed}`);

    if (user.plan === "basic" && user.promptsUsed >= 10) {
      console.log("[checkAndIncrementUsage] ⛔ BLOCKED: Basic plan limit reached.");
      return false;
    }

    const updated = await prisma.user.update({
      where: { userId },
      data: {
        promptsUsed: { increment: 1 },
      },
    });

    console.log(`[checkAndIncrementUsage] ✅ Updated promptsUsed: ${updated.promptsUsed}`);
    return true;
  } catch (error) {
    console.error("[checkAndIncrementUsage] ❌ Error:", error);
    return false;
  }
} 