// backend/routes/agent.ts
import express from "express";
import { Router, Request, Response } from "express";
import { runOllamaAgent } from "../agent/ollamaAgent";
import { clearConversationHistory } from "../ai/conversationMemory";
import { logUsage } from "../utils/logUsage";
import clerkAuth from '../middlewares/clerkAuth';
import { checkAndIncrementUsage } from "../lib/checkLimit";

const router = Router();

// Unified /agent route with Clerk auth and prompt limit
router.post(
  "/agent",
  clerkAuth,
  async (req: Request, res: Response) => {
    const userId = (req as any).auth?.userId;
    const { query, sessionId } = req.body;

    if (!query || !sessionId || typeof query !== "string" || typeof sessionId !== "string") {
      return res.status(400).json({ error: "Missing or invalid query/sessionId" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check prompt usage
    const allowed = await checkAndIncrementUsage(userId);
    if (!allowed) {
      return res.status(403).json({ error: "Prompt limit reached" });
    }

    await logUsage(userId, "/agent");

    try {
      const result = await runOllamaAgent(query, sessionId);
      return res.status(200).json({ result });
    } catch (err) {
      console.error("Agent error:", err);
      return res.status(500).json({ error: "Agent failed to respond" });
    }
  }
);

// Add route to clear conversation history
router.post("/agent/clear", async (req: Request, res: Response) => {
  const { sessionId } = req.body;

  if (!sessionId || typeof sessionId !== "string") {
    res.status(400).json({ error: "Missing or invalid sessionId in request body" });
    return;
  }

  try {
    clearConversationHistory(sessionId);
    res.status(200).json({ message: "Conversation history cleared successfully" });
  } catch (err) {
    console.error("Error clearing conversation history:", err);
    res.status(500).json({ error: "Failed to clear conversation history" });
  }
});

export default router;
