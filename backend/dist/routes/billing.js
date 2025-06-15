"use strict";
// backend/routes/billing.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stripe_1 = require("../utils/stripe");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// ✅ Create Checkout Session (Dynamic priceId support)
router.post('/create-checkout-session', async (req, res) => {
    const { email, priceId, userId } = req.body;
    console.log("Received request for Stripe session:", { email, priceId, userId });
    if (!email || !priceId) {
        res.status(400).json({ message: "Missing email or priceId" });
        return;
    }
    try {
        const session = await stripe_1.stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel',
            metadata: {
                userId,
                priceId
            },
        });
        console.log("Stripe session created:", session.url);
        res.status(200).json({ url: session.url });
    }
    catch (err) {
        console.error("Stripe error:", err);
        res.status(500).json({
            message: "Stripe session creation failed",
            error: err instanceof Error ? err.message : String(err),
        });
    }
});
// ⚙️ Stripe Webhook (raw body required)
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    console.log("🔔 Webhook received!");
    console.log("Signature:", sig);
    console.log("Webhook secret:", webhookSecret);
    let event;
    try {
        event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        console.log("Event type:", event.type);
    }
    catch (err) {
        console.error('❌ Stripe webhook error:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        console.log("✅ Raw session:", session.id);
        // Fetch full session with line items from Stripe
        const fullSession = await stripe_1.stripe.checkout.sessions.retrieve(session.id, {
            expand: ['line_items.data.price.product'],
        });
        const priceId = fullSession.line_items?.data?.[0]?.price?.id;
        let plan = "basic";
        if (priceId === "price_1RXte5SBfHkO6vs5FswZoKw9") {
            plan = "plus";
        }
        else if (priceId === "price_1RXtf3SBfHkO6vs59OvTjs79") {
            plan = "pro";
        }
        console.log(`✅ Detected plan: ${plan}`);
        if (userId) {
            await prisma.user.upsert({
                where: { userId },
                update: { isPro: true },
                create: { userId, isPro: true },
            });
        }
    }
    res.status(200).json({ received: true });
});
router.post("/billing/upgrade", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        res.status(400).json({ error: "Missing userId" });
        return;
    }
    try {
        const user = await prisma.user.upsert({
            where: { userId },
            update: { isPro: true },
            create: { userId, isPro: true }
        });
        res.status(200).json({ success: true, user });
    }
    catch (err) {
        console.error("Upgrade error:", err);
        res.status(500).json({ error: "Failed to upgrade user" });
    }
});
exports.default = router;
