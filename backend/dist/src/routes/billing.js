"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.post("/billing/upgrade", async (req, res) => {
    const { userId } = req.body;
    if (!userId || typeof userId !== "string") {
        res.status(400).json({ error: "Missing or invalid userId in request body" });
        return;
    }
    try {
        const user = await prisma.user.upsert({
            where: { userId },
            update: { isPro: true },
            create: { userId, isPro: true }
        });
        res.status(200).json({ user });
    }
    catch (err) {
        console.error("Billing error:", err);
        res.status(500).json({ error: "Failed to upgrade user" });
    }
});
exports.default = router;
