import express from "express";
import { Router, Request, Response } from "express";
import { improveCodeWithOllama } from "../agent/ollamaAgent";
import { v4 as uuidv4 } from 'uuid';
import { handleConversation } from "../ai/conversationMemory";

const router = Router();

// Store active sessions for code improvement
const activeSessions = new Set<string>();
// Session memory: sessionId -> array of { prompt, response }
const improveSessionMemory = new Map<string, { prompt: string, response: string }[]>();

// Create a new improvement session
router.post("/improve-session", (req: Request, res: Response) => {
  const sessionId = uuidv4();
  activeSessions.add(sessionId);
  res.json({ sessionId });
});

router.post(
  "/improve-code",
  async (req: Request, res: Response): Promise<void> => {
    console.log("POST /api/improve-code was hit");
    const { sessionId, code } = req.body;
    if (!code) {
      res.status(400).json({ result: null, error: "Missing code input" });
      return;
    }
    if (!sessionId) {
      res.status(400).json({ result: null, error: "Missing sessionId" });
      return;
    }
    // Retrieve session history
    const history = improveSessionMemory.get(sessionId) || [];
    // Build context: concatenate previous prompts/responses
    let context = "";
    for (const entry of history) {
      context += `Previous prompt:\n${entry.prompt}\nPrevious improvement:\n${entry.response}\n\n`;
    }
    context += `Current prompt:\n${code}`;
    try {
      const result = await improveCodeWithOllama(context);
      // Save to session memory
      improveSessionMemory.set(sessionId, [...history, { prompt: code, response: result }]);
      res.status(200).json({ result });
    } catch (err) {
      console.error("🔥 Improve route error:", err);
      res.status(200).json({ result: null, error: "Failed to improve code" });
    }
  }
);

// Clear an improvement session
router.delete("/improve-session/:sessionId", (req: Request, res: Response) => {
  const { sessionId } = req.params;
  activeSessions.delete(sessionId);
  improveSessionMemory.delete(sessionId);
  res.json({ message: "Session cleared" });
});

// Add chat session creation route for frontend compatibility
router.post("/chat/session", (req, res) => {
  const sessionId = require('crypto').randomUUID();
  res.json({ sessionId });
});

// Add chat message route for frontend compatibility
router.post("/chat/message", async (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: "Missing sessionId or message" });
  }
  try {
    const aiResponse = await handleConversation(sessionId, message);
    res.json({ response: aiResponse.result || aiResponse });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

export default router;
