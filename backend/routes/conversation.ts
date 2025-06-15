import express, { Request, Response, Router, RequestHandler } from 'express';
import { handleConversation, clearConversationHistory } from '../ai/conversationMemory';
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import prisma from '../db/client';
import { incrementPromptUsage } from '../utils/usage';
import { PrismaClient } from "@prisma/client";

const router: Router = express.Router();
const prismaClient = new PrismaClient();

// Middleware to ensure user is authenticated
router.use(ClerkExpressRequireAuth() as any);

// Handle conversation
const chatHandler: RequestHandler = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.auth?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Get user plan
    let user = await prismaClient.user.findUnique({ where: { userId } });
    if (!user) {
      user = await prismaClient.user.create({ data: { userId, isPro: false } });
    }

    // Limit for basic plan
    if (user.isPro === false) {
      const promptCount = await incrementPromptUsage(userId);
      if (promptCount > 10) {
        res.status(403).json({
          error: 'You have reached the 10 message limit for the basic plan. Please purchase a plan to continue.',
          limitReached: true
        });
        return;
      }
    }

    const response = await handleConversation(userId, message);
    res.json({ result: response.result });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Clear conversation history
const clearHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    clearConversationHistory(userId);
    res.json({ message: 'Conversation history cleared' });
  } catch (error) {
    console.error('Error clearing conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.post('/chat', chatHandler);
router.post('/clear', clearHandler);

router.post("/conversation", async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ error: "Missing userId" });
    return;
  }

  try {
    let user = await prismaClient.user.findUnique({ where: { userId } });
    
    if (!user) {
      user = await prismaClient.user.create({
        data: {
          userId,
          isPro: false
        }
      });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("Conversation error:", err);
    res.status(500).json({ error: "Failed to create/get user" });
  }
});

export default router; 