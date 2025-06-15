// backend/routes/agent.ts
import express from "express";
import { Router, Request, Response } from "express";
import { runOllamaAgent } from "../agent/ollamaAgent";
import { clearConversationHistory } from "../ai/conversationMemory";
import { logUsage } from "../utils/logUsage";
import clerkAuth from '../middlewares/clerkAuth';

const router = Router();

router.post("/agent", async (req: Request, res: Response) => {
  const { query, sessionId } = req.body;

  if (!query || typeof query !== "string" || !sessionId || typeof sessionId !== "string") {
    res.status(400).json({ error: "Missing or invalid query/sessionId in request body" });
    return;
  }

  try {
    const result = await runOllamaAgent(query, sessionId);
    res.status(200).json({ result });
  } catch (err) {
    console.error("Agent error:", err);
    res.status(500).json({ error: "Agent failed to generate a response" });
  }
});

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

router.post(
  "/agent",
  clerkAuth,
  (async (req: Request, res: Response) => {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await logUsage(userId, "/agent");

    // 💡 Replace with your actual AI logic
    return res.json({ result: "Your AI answer goes here" });
  }) as unknown as express.RequestHandler
);

export default router;
