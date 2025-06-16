// 1. Built-in modules
import express from "express";
import cors from "cors";
import 'dotenv/config';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import bodyParser from "body-parser";
import { rawBodyMiddleware } from './middleware/rawBodyMiddleware';
import { stripe } from './utils/stripe';
import { PrismaClient } from '@prisma/client';

// 2. Config

// 3. Custom routes
import agentRoutes from "./routes/agent";
import improveRoutes from "./routes/improve";
import protectedRoutes from "./routes/protected";
import billingRoutes from "./routes/billing";
import userRoutes from "./routes/user";
import conversationRoutes from "./routes/conversation";
// import chatRouter from "./routes/chat";

// 4. App setup
const app = express();
const PORT = process.env.PORT || 4000;
const prisma = new PrismaClient();

// 5. Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// 6. ✅ Stripe Webhook Route - MUST BE FIRST
app.post("/api/billing/webhook", rawBodyMiddleware, async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  console.log("Webhook Secret in use:", webhookSecret);
  console.log("typeof req.body:", typeof req.body);
  console.log("is Buffer:", Buffer.isBuffer(req.body));

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    console.log("✅ Stripe Event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      console.log("✅ Stripe session completed:", session.id);

      const userId = session.metadata?.userId;
      const email = session.customer_email;

      if (!userId) {
        console.error("❌ No user ID in Stripe session metadata");
        return res.status(400).json({ error: "Missing userId" });
      }

      let plan = "basic";
      if (session.metadata?.priceId === "price_1RXte5SBfHkO6vs5FswZoKw9") {
        plan = "plus";
      } else if (session.metadata?.priceId === "price_1RXtf3SBfHkO6vs59OvTjs79") {
        plan = "pro";
      }

      try {
        const user = await prisma.user.upsert({
          where: { userId },
          update: { plan, isPro: plan !== "basic" },
          create: { userId, plan, isPro: plan !== "basic" },
        });
        console.log(`✅ User ${userId} upgraded to ${plan}`);
      } catch (err) {
        console.error("❌ DB update failed:", err);
        return res.status(500).json({ error: "DB update failed" });
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// 7. All other middleware and routes AFTER webhook
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());

// 8. Routes
app.use("/api", agentRoutes);
app.use("/api", improveRoutes);
app.use("/api/protected", ClerkExpressWithAuth() as unknown as express.RequestHandler);
app.use("/api/user", ClerkExpressWithAuth() as unknown as express.RequestHandler);
app.use("/api/billing", billingRoutes);
app.use("/api", userRoutes);
app.use("/api/conversation", conversationRoutes);
// app.use("/api/chat", chatRouter);

// 9. Health Check
app.get("/api/health", (_req, res) => {
  res.status(200).json({ message: "Server is up" });
});

// 10. Listen
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
