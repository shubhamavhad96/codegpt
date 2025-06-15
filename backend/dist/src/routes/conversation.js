"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.post("/conversation", async (req, res) => {
    const { userId } = req.body;
    if (!userId || typeof userId !== "string") {
        res.status(400).json({ error: "Missing or invalid userId in request body" });
        return;
    }
    try {
        let user = await prisma.user.findUnique({ where: { userId } });
        if (!user) {
            user = await prisma.user.create({
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
        res.status(500).json({ error: "Failed to create/find user" });
    }
});
exports.default = router;
