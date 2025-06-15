"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ollamaAgent_1 = require("../../agent/ollamaAgent");
const router = (0, express_1.Router)();
router.post("/chat", async (req, res) => {
    const { message, sessionId } = req.body;
    if (!message || typeof message !== "string" || !sessionId || typeof sessionId !== "string") {
        res.status(400).json({ error: "Missing or invalid message/sessionId in request body" });
        return;
    }
    try {
        const response = await (0, ollamaAgent_1.runOllamaAgent)(message, sessionId);
        res.status(200).json({ response });
    }
    catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({ error: "Failed to generate chat response" });
    }
});
exports.default = router;
