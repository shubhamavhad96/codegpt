"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConversation = handleConversation;
exports.getHistory = getHistory;
exports.startNewConversation = startNewConversation;
exports.clearConversationHistory = clearConversationHistory;
const ollama_1 = require("@langchain/community/chat_models/ollama");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const messages_1 = require("@langchain/core/messages");
const runnables_1 = require("@langchain/core/runnables");
const memory_1 = require("langchain/memory");
const prompts_1 = require("@langchain/core/prompts");
// Initialize the Ollama model
const model = new ollama_1.ChatOllama({
    baseUrl: "http://localhost:11434",
    model: "llama2",
    temperature: 0.7,
});
// Enhanced system prompt for better context retention
const SYSTEM_PROMPT = `You are a senior software engineer with perfect context awareness. You MUST maintain context between questions and handle follow-ups intelligently.

CRITICAL INSTRUCTIONS:
1. If this is a follow-up question (like "how do I use X in it?"), you MUST:
   - Start your response with "Building on our previous discussion about [previous topic]..."
   - Explicitly reference the previous context
   - Keep the response focused on the new aspect while maintaining continuity
2. For new questions, provide a comprehensive answer with examples
3. Always include working code examples when relevant
4. Keep responses concise but ensure they maintain perfect context continuity

Remember: You are having a continuous conversation. Each message builds on the previous ones.`;
// Create the prompt template
const promptTemplate = prompts_1.PromptTemplate.fromTemplate(`${SYSTEM_PROMPT}

Current Context:
{history}

User: {input}
Assistant:`);
// Create the chain
const chain = promptTemplate.pipe(model);
// Store conversation IDs and message histories for users
const userConversations = new Map();
const sessionHistories = new Map();
// Enhanced follow-up detection
function isFollowUp(message) {
    const followUpPatterns = [
        "how do I do that",
        "what about",
        "and also",
        "how to use",
        "how do i use",
        "can you explain",
        "in it",
        "more info",
        "continue",
        "elaborate",
        "tell me more",
        "what's next",
        "how does that work",
        "can you show me",
        "give me an example",
        "what do you mean",
        "how do you",
        "what if",
        "is there a way to",
        "can I",
        "should I",
        "do I need to",
        "why do I need",
        "when should I",
        "where do I",
        "which one",
        "what's the difference",
        "how is it different",
        "what are the benefits",
        "what are the drawbacks"
    ];
    const messageLower = message.toLowerCase();
    return followUpPatterns.some(pattern => messageLower.includes(pattern));
}
// Get or create conversation ID for a user
function getConversationId(userId) {
    if (!userConversations.has(userId)) {
        userConversations.set(userId, (0, uuid_1.v4)());
    }
    return userConversations.get(userId);
}
// Get or create message history for a session
function getMessageHistory(sessionId) {
    if (!sessionHistories.has(sessionId)) {
        sessionHistories.set(sessionId, new memory_1.BufferMemory().chatHistory);
    }
    return sessionHistories.get(sessionId);
}
// Create the chain with message history
const chainWithMemory = new runnables_1.RunnableWithMessageHistory({
    runnable: chain,
    getMessageHistory: async (sessionId) => {
        return getMessageHistory(sessionId);
    },
    inputMessagesKey: "input",
    historyMessagesKey: "history",
});
// Save message to database
async function saveMessage(userId, conversationId, role, content) {
    await db_1.db.insert(schema_1.messages).values({
        userId,
        conversationId,
        role,
        content,
    });
}
// Get conversation history from database
async function getConversationHistory(userId, conversationId) {
    const history = await db_1.db
        .select()
        .from(schema_1.messages)
        .where((0, drizzle_orm_1.eq)(schema_1.messages.conversationId, conversationId))
        .orderBy(schema_1.messages.createdAt);
    return history.map(m => m.role === "user"
        ? new messages_1.HumanMessage(m.content)
        : new messages_1.AIMessage(m.content));
}
// Main conversation handler
async function handleConversation(userId, userInput) {
    try {
        const conversationId = getConversationId(userId);
        const isFollowUpQuestion = isFollowUp(userInput);
        // Save user message
        await saveMessage(userId, conversationId, "user", userInput);
        // Get AI response with memory
        const result = await chainWithMemory.invoke({
            input: userInput,
            history: "" // The history will be populated by the RunnableWithMessageHistory
        }, { configurable: { sessionId: conversationId } });
        const responseContent = typeof result.content === 'string'
            ? result.content
            : JSON.stringify(result.content);
        // Save assistant response
        await saveMessage(userId, conversationId, "assistant", responseContent);
        // Get updated history
        const updatedHistory = await getConversationHistory(userId, conversationId);
        return {
            result: responseContent
        };
    }
    catch (error) {
        console.error("Error in conversation handler:", error);
        throw error;
    }
}
// Get conversation history for a user
async function getHistory(userId) {
    const conversationId = getConversationId(userId);
    return getConversationHistory(userId, conversationId);
}
// Start a new conversation
function startNewConversation(userId) {
    const newConversationId = (0, uuid_1.v4)();
    userConversations.set(userId, newConversationId);
    sessionHistories.delete(userId); // Clear the message history
    return newConversationId;
}
// Clear conversation history for a user
function clearConversationHistory(userId) {
    userConversations.delete(userId);
    sessionHistories.delete(userId);
}
