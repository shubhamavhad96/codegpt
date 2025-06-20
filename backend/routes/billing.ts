// backend/routes/billing.ts

import express, { Request, Response } from 'express';
import clerkAuth from '../middlewares/clerkAuth';
import { PrismaClient } from "@prisma/client";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import bodyParser from "body-parser";
import Stripe from 'stripe';

console.log("✅ Mounted billing routes");

const router = express.Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

router.post('/cancel', ClerkExpressRequireAuth(), async (req, res) => {
  // Log the Authorization header for debugging
  console.log("🔑 Authorization header:", req.headers.authorization);
  const userId = (req.auth as any).userId;
  console.log("🔍 User ID from auth:", userId);

  if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

  const user = await prisma.user.findUnique({ where: { userId } });
  console.log("🔍 User from database:", user);

  if (!user?.stripeCustomerId) {
    console.log("❌ No stripeCustomerId found for user:", userId);
    
    // Fallback: If user has Pro/Plus plan but no stripeCustomerId, just update their plan to basic
    if (user && (user.plan === 'pro' || user.plan === 'plus')) {
      console.log("🔄 Fallback: Updating user plan to basic since no stripeCustomerId found");
      await prisma.user.update({
        where: { userId },
        data: { plan: 'basic', isPro: false },
      });
      console.log("✅ User plan updated to basic");
      return res.json({ message: 'Subscription canceled (plan updated to basic)' });
    }
    
    return res.status(404).json({ error: 'User or Stripe customer not found' });
  }

  console.log("🔍 Stripe customer ID:", user.stripeCustomerId);

  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: 'active',
  });

  console.log("🔍 Found subscriptions:", subscriptions.data.length);

  const subscription = subscriptions.data[0];

  if (!subscription) {
    console.log("❌ No active subscription found");
    return res.status(400).json({ error: 'No active subscription found' });
  }

  console.log("🔍 Canceling subscription:", subscription.id);

  await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
  });

  await prisma.user.update({
    where: { userId },
    data: { plan: 'basic', isPro: false },
  });

  console.log("✅ Subscription canceled successfully");
  res.json({ message: 'Subscription canceled' });
});

export default router;
