import express from "express";
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

const router = Router();
const prisma = new PrismaClient();

// 🔹 GET /api/user/plan — Pro status, today's prompt count, last use
router.get(
  "/user/plan",
  ClerkExpressRequireAuth() as unknown as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).auth?.userId;

    if (!userId) {
      res.status(401).json({ plan: "basic" });
      return;
    }

    try {
      let user = await prisma.user.findUnique({ where: { userId } });

      // If user not found, create with default "basic"
      if (!user) {
        user = await prisma.user.create({
          data: {
            userId,
            plan: "basic",
            isPro: false,
          },
        });
      }

      res.status(200).json({
        plan: user.plan || "basic",
        isPro: user.plan === "pro",
        isPlus: user.plan === "plus",
        remaining: user.plan === "basic" ? Math.max(0, 10 - (user.promptsUsed ?? 0)) : Infinity
      });
    } catch (err) {
      console.error("Error fetching plan:", err);
      res.status(500).json({ plan: "basic" });
    }
  }
);

// 🔹 GET /api/user/profile — Full user info
router.get(
  "/profile",
  ClerkExpressRequireAuth() as unknown as express.RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).auth?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const user = await prisma.user.findUnique({ where: { userId } });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.status(200).json(user);
    } catch (err) {
      console.error("Error in /profile:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
