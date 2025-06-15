"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const usage_1 = require("../utils/usage");
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
const router = express_1.default.Router();
router.get("/protected", (0, clerk_sdk_node_1.ClerkExpressRequireAuth)(), async (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        // 🔍 Check if user is Pro
        const user = await prisma.user.findUnique({ where: { userId } });
        if (user?.isPro) {
            res.status(200).json({ message: "✅ Pro access granted", userId });
            return;
        }
        // 🔒 Enforce 10-prompt limit
        const promptCount = await (0, usage_1.incrementPromptUsage)(userId);
        if (promptCount > 10) {
            res.status(403).json({
                message: "🚫 Daily prompt limit reached. Please upgrade your plan to continue.",
            });
            return;
        }
        res.status(200).json({
            message: "✅ Prompt accepted",
            userId,
            promptCount,
        });
    }
    catch (err) {
        console.error("Prompt usage error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = router;
