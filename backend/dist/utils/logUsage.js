"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logUsage = logUsage;
const client_1 = __importDefault(require("../db/client"));
async function logUsage(userId, endpoint) {
    await client_1.default.usageLog.create({
        data: {
            userId,
            endpoint,
        },
    });
}
