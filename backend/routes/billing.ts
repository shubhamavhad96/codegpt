// backend/routes/billing.ts

import express, { Request, Response } from 'express';
import { stripe } from '../utils/stripe';
import clerkAuth from '../middlewares/clerkAuth';
import { PrismaClient } from "@prisma/client";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

const router = express.Router();
const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId?: string;
      };
    }
  }
}

// ✅ Create Checkout Session (Dynamic priceId support)
router.post('/create-checkout-session', async (req: Request, res: Response) => {
  const { email, priceId, userId } = req.body;
  console.log("Received request for Stripe session:", { email, priceId, userId });

  if (!email || !priceId) {
    res.status(400).json({ message: "Missing email or priceId" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
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
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({
      message: "Stripe session creation failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// ⚙️ Stripe Webhook (raw body required)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('❌ Stripe webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.metadata?.userId;
    const priceId = session.metadata?.priceId;
    let plan = "basic";
    if (priceId === "price_1RXte5SBfHkO6vs5FswZoKw9") {
      plan = "plus";
    } else if (priceId === "price_1RXtf3SBfHkO6vs59OvTjs79") {
      plan = "pro";
    }
    if (userId) {
      await prisma.user.upsert({
        where: { userId },
        update: { plan, isPro: plan !== "basic" },
        create: { userId, plan, isPro: plan !== "basic" },
      });
    }
  }
  res.status(200).json({ received: true });
});

router.post("/billing/upgrade", async (req: Request, res: Response) => {
  const { userId, plan } = req.body;
  if (!userId || !plan) {
    res.status(400).json({ error: "Missing userId or plan" });
    return;
  }
  try {
    const user = await prisma.user.upsert({
      where: { userId },
      update: { plan, isPro: plan !== "basic" },
      create: { userId, plan, isPro: plan !== "basic" }
    });
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("Upgrade error:", err);
    res.status(500).json({ error: "Failed to upgrade user" });
  }
});

export default router;
