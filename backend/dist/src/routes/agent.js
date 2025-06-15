"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ollamaAgent_1 = require("../../agent/ollamaAgent");
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
exports.default = router;
