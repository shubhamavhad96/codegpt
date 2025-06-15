// 1. Built-in modules
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

// 2. Config
dotenv.config();

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

// 5. Special Stripe webhook raw parser
// ✅ BEFORE express.json() or billingRoutes
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));

// 6. Middlewares
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json()); // 🚫 Don't affect webhook route

// 7. Routes
app.use("/api", agentRoutes);
app.use("/api", improveRoutes);
app.use("/api/protected", ClerkExpressWithAuth() as unknown as express.RequestHandler);
app.use("/api/user", ClerkExpressWithAuth() as unknown as express.RequestHandler);
app.use("/api/billing", billingRoutes);
app.use("/api", userRoutes);
app.use("/api/conversation", conversationRoutes);
// app.use("/api/chat", chatRouter);

// 8. Health Check
app.get("/api/health", (_req, res) => {
  res.status(200).json({ message: "Server is up" });
});

// 9. Listen
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});
