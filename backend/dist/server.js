"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 1. Built-in modules
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
// 2. Config
dotenv_1.default.config();
// 3. Custom routes
const agent_1 = __importDefault(require("./routes/agent"));
const improve_1 = __importDefault(require("./routes/improve"));
const billing_1 = __importDefault(require("./routes/billing"));
const user_1 = __importDefault(require("./routes/user"));
const conversation_1 = __importDefault(require("./routes/conversation"));
const chat_1 = __importDefault(require("./routes/chat"));
// 4. App setup
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// 5. Special Stripe webhook raw parser
// ✅ BEFORE express.json() or billingRoutes
app.use("/api/billing/webhook", express_1.default.raw({ type: "application/json" }));
// 6. Middlewares
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json()); // 🚫 Don't affect webhook route
// 7. Routes
app.use("/api", agent_1.default);
app.use("/api", improve_1.default);
app.use("/api/protected", (0, clerk_sdk_node_1.ClerkExpressWithAuth)());
app.use("/api/user", (0, clerk_sdk_node_1.ClerkExpressWithAuth)());
app.use("/api/billing", billing_1.default);
app.use("/api", user_1.default);
app.use("/api/conversation", conversation_1.default);
app.use("/api/chat", chat_1.default);
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
