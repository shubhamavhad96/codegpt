"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ollamaAgent_1 = require("../agent/ollamaAgent");
const uuid_1 = require("uuid");
const router = express_1.default.Router();
// Store active sessions
const activeSessions = new Set();
// Create a new chat session
router.post("/session", (req, res) => {
    const sessionId = (0, uuid_1.v4)();
    activeSessions.add(sessionId);
    res.json({ sessionId });
});
// Handle chat messages
router.post("/chat", async (req, res) => {
    const { message, sessionId } = req.body;
    if (!message || typeof message !== "string" || !sessionId || typeof sessionId !== "string") {
        res.status(400).json({ error: "Missing or invalid message/sessionId in request body" });
        return;
    }
    if (!activeSessions.has(sessionId)) {
        return res.status(404).json({ error: "Session not found" });
    }
    try {
        const response = await (0, ollamaAgent_1.runOllamaAgent)(message, sessionId);
        res.status(200).json({ result: response });
    }
    catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({ error: "Failed to generate chat response" });
    }
});
// Alias for /chat to support /message
router.post("/message", async (req, res) => {
    const { message, sessionId } = req.body;
    if (!message || typeof message !== "string" || !sessionId || typeof sessionId !== "string") {
        res.status(400).json({ error: "Missing or invalid message/sessionId in request body" });
        return;
    }
    if (!activeSessions.has(sessionId)) {
        return res.status(404).json({ error: "Session not found" });
    }
    try {
        const response = await (0, ollamaAgent_1.runOllamaAgent)(message, sessionId);
        res.status(200).json({ result: response });
    }
    catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({ error: "Failed to generate chat response" });
    }
});
// Clear a chat session
router.delete("/session/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    activeSessions.delete(sessionId);
    res.json({ message: "Session cleared" });
});
exports.default = router;
