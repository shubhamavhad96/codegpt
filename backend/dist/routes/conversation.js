"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const conversationMemory_1 = require("../ai/conversationMemory");
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const usage_1 = require("../utils/usage");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prismaClient = new client_1.PrismaClient();
// Middleware to ensure user is authenticated
router.use((0, clerk_sdk_node_1.ClerkExpressRequireAuth)());
// Handle conversation
const chatHandler = async (req, res, next) => {
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
            const promptCount = await (0, usage_1.incrementPromptUsage)(userId);
            if (promptCount > 10) {
                res.status(403).json({
                    error: 'You have reached the 10 message limit for the basic plan. Please purchase a plan to continue.',
                    limitReached: true
                });
                return;
            }
        }
        const response = await (0, conversationMemory_1.handleConversation)(userId, message);
        res.json({ result: response.result });
    }
    catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// Clear conversation history
const clearHandler = async (req, res, next) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        (0, conversationMemory_1.clearConversationHistory)(userId);
        res.json({ message: 'Conversation history cleared' });
    }
    catch (error) {
        console.error('Error clearing conversation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
router.post('/chat', chatHandler);
router.post('/clear', clearHandler);
router.post("/conversation", async (req, res) => {
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
    }
    catch (err) {
        console.error("Conversation error:", err);
        res.status(500).json({ error: "Failed to create/get user" });
    }
});
exports.default = router;
