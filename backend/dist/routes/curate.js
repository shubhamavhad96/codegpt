"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const curateAnswer_1 = require("../ai/curateAnswer");
const router = (0, express_1.Router)();
router.post("/curate", async (req, res, _next) => {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
        res.status(400).json({ error: "Invalid or missing 'answers' array" });
        return;
    }
    try {
        const result = await (0, curateAnswer_1.curateAnswer)(answers);
        res.status(200).json({ curated: result });
    }
    catch (err) {
        console.error("LLM error:", err);
        res.status(500).json({ error: "AI processing failed" });
    }
});
exports.default = router;
