"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stackoverflow_1 = require("../scraper/stackoverflow");
const router = (0, express_1.Router)();
router.get("/search", async (req, res, _next) => {
    const query = req.query.q;
    if (!query) {
        res.status(400).json({ error: "Missing query parameter ?q=" });
        return;
    }
    try {
        const results = await (0, stackoverflow_1.scrapeStackOverflow)(query);
        res.status(200).json({ results });
    }
    catch (error) {
        console.error("Scraping error:", error);
        res.status(500).json({ error: "Failed to scrape StackOverflow" });
    }
});
exports.default = router;
