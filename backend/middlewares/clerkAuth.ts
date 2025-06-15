import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import express from "express";

const router = express.Router();

router.use(ClerkExpressRequireAuth() as any);

export default router;
