"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// 🔹 GET /api/user/plan — Pro status, today's prompt count, last use
router.get("/user/plan", (0, clerk_sdk_node_1.ClerkExpressRequireAuth)(), async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
        res.status(401).json({ plan: "basic" });
        return;
    }
    try {
        let user = await prisma.user.findUnique({ where: { userId } });
        // Create user if they don't exist
        if (!user) {
            user = await prisma.user.create({
                data: {
                    userId,
                    isPro: false
                }
            });
        }
        if (!user) {
            res.status(500).json({ plan: "basic" });
            return;
        }
        console.log("User from DB:", user);
        res.status(200).json({ user });
    }
    catch (err) {
        console.error("Error fetching user plan:", err);
        res.status(500).json({ plan: "basic" });
    }
});
// 🔹 GET /api/user/profile — Full user info
router.get("/profile", (0, clerk_sdk_node_1.ClerkExpressRequireAuth)(), async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const user = await prisma.user.findUnique({ where: { userId } });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json(user);
    }
    catch (err) {
        console.error("Error in /profile:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = router;
