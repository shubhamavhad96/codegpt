"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ollamaAgent_1 = require("../agent/ollamaAgent");
const conversationMemory_1 = require("../ai/conversationMemory");
const logUsage_1 = require("../utils/logUsage");
const clerkAuth_1 = __importDefault(require("../middlewares/clerkAuth"));
const router = (0, express_1.Router)();
router.post("/agent", async (req, res) => {
    const { query, sessionId } = req.body;
    if (!query || typeof query !== "string" || !sessionId || typeof sessionId !== "string") {
        res.status(400).json({ error: "Missing or invalid query/sessionId in request body" });
        return;
    }
    try {
        const result = await (0, ollamaAgent_1.runOllamaAgent)(query, sessionId);
        res.status(200).json({ result });
    }
    catch (err) {
        console.error("Agent error:", err);
        res.status(500).json({ error: "Agent failed to generate a response" });
    }
});
// Add route to clear conversation history
router.post("/agent/clear", async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId || typeof sessionId !== "string") {
        res.status(400).json({ error: "Missing or invalid sessionId in request body" });
        return;
    }
    try {
        (0, conversationMemory_1.clearConversationHistory)(sessionId);
        res.status(200).json({ message: "Conversation history cleared successfully" });
    }
    catch (err) {
        console.error("Error clearing conversation history:", err);
        res.status(500).json({ error: "Failed to clear conversation history" });
    }
});
router.post("/agent", clerkAuth_1.default, (async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    await (0, logUsage_1.logUsage)(userId, "/agent");
    // 💡 Replace with your actual AI logic
    return res.json({ result: "Your AI answer goes here" });
}));
exports.default = router;
