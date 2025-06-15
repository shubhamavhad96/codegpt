"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOllamaAgent = runOllamaAgent;
exports.improveCodeWithOllama = improveCodeWithOllama;
// backend/agent/ollamaAgent.ts
const ollama_1 = require("@langchain/community/chat_models/ollama");
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
const memoryStore_1 = require("./memoryStore");
const client_1 = require("@prisma/client");
const llm = new ollama_1.ChatOllama({
    model: "llama3",
    baseUrl: "http://localhost:11434",
    temperature: 0.4,
});
const prisma = new client_1.PrismaClient();
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
const qaPrompt = prompts_1.PromptTemplate.fromTemplate(`${SYSTEM_PROMPT}

Current Context:
{history}

User: {input}
Assistant:`);
const qaPipeline = runnables_1.RunnableSequence.from([qaPrompt, llm]);
// Pipeline with memory support
const qaWithMemory = new runnables_1.RunnableWithMessageHistory({
    runnable: qaPipeline,
    getMessageHistory: async (sessionId) => {
        return (0, memoryStore_1.getSessionHistory)(sessionId).chatHistory;
    },
    inputMessagesKey: "input",
    historyMessagesKey: "history",
});
async function runOllamaAgent(query, sessionId) {
    if (!sessionId) {
        throw new Error("sessionId is required");
    }
    try {
        // Get the memory for this session
        const memory = (0, memoryStore_1.getSessionHistory)(sessionId);
        await memory.saveContext({ input: query }, { output: "Processing..." });
        const memoryVariables = await memory.loadMemoryVariables({});
        const result = await qaWithMemory.invoke({
            input: query,
            history: memoryVariables.history || ""
        }, { configurable: { sessionId } });
        if (!result || typeof result.content !== "string") {
            console.error("Invalid result format:", result);
            return "LLM did not return a valid result.";
        }
        await memory.saveContext({ input: query }, { output: result.content });
        return result.content;
    }
    catch (err) {
        console.error("Ollama QA error:", err);
        return `Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`;
    }
}
// 🆕 Code Improvement Prompt
// ✅ FIXED PromptTemplate using valid schema
const improvePrompt = prompts_1.PromptTemplate.fromTemplate(`
You are a senior software engineer. Review and improve the following code. You MUST maintain context between improvements and handle follow-up requests intelligently.

Previous Context:
{history}

Current Code or Request:
{input}

CRITICAL INSTRUCTIONS:
1. If this is a follow-up request (like "make it more functional", "add type safety", or "give me full code"), you MUST:
   - Reference the previous improvements
   - Build upon the existing code
   - Keep the improvements consistent with previous changes
   - If asked for "full code", show the complete implementation with all previous improvements
2. For new code, provide comprehensive improvements with explanations
3. Always include working code examples
4. Keep responses concise but ensure they maintain perfect context continuity
5. When showing full code:
   - Include all previous improvements
   - Add proper type definitions
   - Include necessary imports
   - Add comments for clarity
   - Show the complete implementation

Improved code with explanations:
`);
function sanitizeMarkdown(md) {
    // Replace all single-line triple-backtick blocks with inline code
    return md.replace(/```(\w*)\n([^\n]{1,100})\n```/g, (_, _lang, code) => {
        // If there's NO newline inside the code, treat it as inline
        if (!code.includes("\n")) {
            return `\`${code.trim()}\``;
        }
        // Otherwise keep it as a proper code block
        return `\`\`\`${_lang}\n${code}\n\`\`\``;
    });
}
const improvePipeline = runnables_1.RunnableSequence.from([improvePrompt, llm]);
// Pipeline with memory support for code improvements
const improveWithMemory = new runnables_1.RunnableWithMessageHistory({
    runnable: improvePipeline,
    getMessageHistory: async (sessionId) => {
        return (0, memoryStore_1.getSessionHistory)(sessionId).chatHistory;
    },
    inputMessagesKey: "input",
    historyMessagesKey: "history",
});
async function improveCodeWithOllama(code, sessionId) {
    if (!sessionId) {
        throw new Error("sessionId is required");
    }
    try {
        console.log("🔍 Starting code improvement for session:", sessionId);
        console.log("📝 Code to improve:", code);
        // Get the memory for this session
        const memory = (0, memoryStore_1.getSessionHistory)(sessionId);
        console.log("💾 Got memory for session");
        // Add the code to memory
        await memory.saveContext({ input: code }, { output: "" } // We'll update this after getting the response
        );
        console.log("💾 Saved code to memory");
        const memoryVariables = await memory.loadMemoryVariables({});
        const result = await improveWithMemory.invoke({
            input: code,
            history: memoryVariables.history || "" // Load the conversation history
        }, { configurable: { sessionId } });
        console.log("🤖 Got result from LLM:", result);
        if (!result || typeof result.content !== "string") {
            console.error("❌ Invalid improvement result:", result);
            return "LLM did not return a valid improvement.";
        }
        // Save the improvement to memory
        await memory.saveContext({ input: code }, { output: result.content });
        console.log("💾 Saved improvement to memory");
        const sanitizedResult = sanitizeMarkdown(result.content);
        console.log("✨ Final sanitized result:", sanitizedResult);
        return sanitizedResult;
    }
    catch (err) {
        console.error("🔥 Ollama improvement error:", err);
        return `Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`;
    }
}
