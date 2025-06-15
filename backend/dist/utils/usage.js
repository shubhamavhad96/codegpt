"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementPromptUsage = incrementPromptUsage;
// backend/utils/usage.ts
const client_1 = __importDefault(require("../db/client"));
async function incrementPromptUsage(userId) {
    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const record = await client_1.default.userUsage.upsert({
        where: { userId_date: { userId, date } },
        update: { count: { increment: 1 } },
        create: { userId, date, count: 1 },
    });
    return record.count;
}
