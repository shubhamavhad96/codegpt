"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
// backend/utils/stripe.ts
const stripe_1 = __importDefault(require("stripe"));
exports.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-05-28.basil',
});
