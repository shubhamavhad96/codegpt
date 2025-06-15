"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ollamaAgent_1 = require("../agent/ollamaAgent");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
// Store active sessions for code improvement
const activeSessions = new Set();
// Create a new improvement session
router.post("/improve-session", (req, res) => {
    const sessionId = (0, uuid_1.v4)();
    activeSessions.add(sessionId);
    res.json({ sessionId });
});
router.post("/improve-code", async (req, res) => {
    console.log("💡 /api/improve-code was hit");
    const { code, sessionId } = req.body;
    if (!code) {
        res.status(400).json({ result: null, message: "Missing code input" });
        return;
    }
    if (!sessionId || !activeSessions.has(sessionId)) {
        res.status(400).json({ result: null, message: "Invalid or missing session ID" });
        return;
    }
    try {
        console.log("📥 Code received:", code);
        const result = await (0, ollamaAgent_1.improveCodeWithOllama)(code, sessionId);
        res.status(200).json({ result });
    }
    catch (err) {
        console.error("🔥 Improve route error:", err);
        res.status(200).json({ result: null, error: "Failed to improve code" });
    }
});
// Clear an improvement session
router.delete("/improve-session/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    activeSessions.delete(sessionId);
    res.json({ message: "Session cleared" });
});
exports.default = router;
