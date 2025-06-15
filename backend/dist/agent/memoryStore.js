"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionHistory = getSessionHistory;
exports.clearSessionHistory = clearSessionHistory;
exports.getAllSessions = getAllSessions;
exports.getSessionMessages = getSessionMessages;
const memory_1 = require("langchain/memory");
// In-memory store for chat sessions
const sessionStore = new Map();
function getSessionHistory(sessionId) {
    if (!sessionStore.has(sessionId)) {
        sessionStore.set(sessionId, new memory_1.BufferMemory());
    }
    return sessionStore.get(sessionId);
}
function clearSessionHistory(sessionId) {
    sessionStore.delete(sessionId);
}
function getAllSessions() {
    return Array.from(sessionStore.keys());
}
async function getSessionMessages(sessionId) {
    const history = getSessionHistory(sessionId);
    return await history.chatHistory.getMessages();
}
