import express, { Request, Response } from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { incrementPromptUsage } from "../utils/usage";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();
const router = express.Router();

router.get(
  "/protected",
  ClerkExpressRequireAuth() as unknown as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).auth?.userId as string;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      // 🔍 Check if user is Pro
      const user = await prisma.user.findUnique({ where: { userId } });

      if (user?.isPro) {
        res.status(200).json({ message: "✅ Pro access granted", userId });
        return;
      }

      // 🔒 Enforce 10-prompt limit
      const promptCount = await incrementPromptUsage(userId);

      if (promptCount > 10) {
        res.status(403).json({
          message:
            "🚫 Daily prompt limit reached. Please upgrade your plan to continue.",
        });
        return;
      }

      res.status(200).json({
        message: "✅ Prompt accepted",
        userId,
        promptCount,
      });
    } catch (err) {
      console.error("Prompt usage error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
