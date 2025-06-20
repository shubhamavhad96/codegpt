import { Router, Request, Response } from "express";
import { handleConversation } from "../ai/conversationMemory";
import { v4 as uuidv4 } from 'uuid';
import { checkAndIncrementUsage } from "../lib/checkLimit";

const router = Router();

// Create a new chat session
router.post("/session", async (req: Request, res: Response) => {
  try {
    const sessionId = uuidv4();
    console.log("→ Created new session:", sessionId);
    return res.status(200).json({ sessionId });
  } catch (error) {
    console.error("❌ Error creating session:", error);
    return res.status(500).json({ error: "Failed to create session" });
  }
});

// Handle chat messages
router.post("/message", async (req: Request, res: Response) => {
  console.log("→ Received chat message request");
  console.log("→ Request body:", req.body);
  
  const { message, sessionId, userId } = req.body;

  if (!message || typeof message !== "string" || !sessionId || typeof sessionId !== "string" || !userId || typeof userId !== "string") {
    console.log("❌ Invalid request: missing or invalid message/sessionId/userId");
    return res.status(400).json({ 
      response: null, 
      error: "Missing or invalid message/sessionId/userId in request body" 
    });
  }

  // ✅ Check prompt usage limit
  try {
    const allowed = await checkAndIncrementUsage(userId);
    console.log(`checkAndIncrementUsage result: ${allowed}`);
    if (!allowed) {
      return res.status(403).json({ error: "Prompt limit reached" });
    }
  } catch (err) {
    console.error("❌ Error checking prompt usage:", err);
    return res.status(500).json({ error: "Failed to check prompt usage" });
  }

  try {
    console.log("→ Calling handleConversation with:", { sessionId, message });
    const response = await handleConversation(sessionId, message);
    console.log("→ Got response from handleConversation:", response);
    
    return res.status(200).json({ response: response.result });
  } catch (error) {
    console.error("❌ Error in chat endpoint:", error);
    if (error instanceof Error) {
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
    }
    return res.status(500).json({ error: "Failed to respond" });
  }
});

// Health check for chat routes
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

export default router; 