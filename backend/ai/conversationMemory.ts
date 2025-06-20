import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { v4 as uuidv4 } from 'uuid';
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { BaseMessage } from "@langchain/core/messages";
import { BaseChatMessageHistory } from "@langchain/core/chat_history";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import prisma from "../db/client";

// Initialize the Ollama model
const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "llama3",
  temperature: 0.7,
});

// Enhanced system prompt for strict TypeScript follow-up
const SYSTEM_PROMPT = `You are a programming expert capable of helping with any language including JavaScript, TypeScript, Java, Python, C++, and C#. You maintain perfect context and handle follow-up questions intelligently.

INSTRUCTIONS:
1. If a follow-up is detected, reference the last programming language used (e.g., if the last question was about Java, continue with Java).
2. NEVER switch to another language unless explicitly asked.
3. Always include valid code examples in the same language.
4. Avoid generic phrases like "in general" – stay specific to the context.
5. End responses naturally or with a helpful follow-up question.
`;

// Create the prompt template
const promptTemplate = PromptTemplate.fromTemplate(
  `${SYSTEM_PROMPT}

Current Context:
{history}

User: {input}
Assistant:`
);

// Create the chain
const chain = promptTemplate.pipe(model);

// Store conversation IDs and message histories for users
const userConversations = new Map<string, string>();
const sessionHistories = new Map<string, BufferMemory>();

// Enhanced follow-up detection
export const FOLLOW_UP_PHRASES = [
  "more",
  "explain more",
  "continue",
  "elaborate",
  "give me more",
  "go on",
  "add more",
  "tell me more",
  "and?",
  "why?",
  "how?",
  "what else?",
  // existing patterns
  "how do I do that",
  "what about",
  "and also",
  "how to use",
  "how do i use",
  "can you explain",
  "in it",
  "more info",
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

function isFollowUp(message: string): boolean {
  const messageLower = message.toLowerCase();
  return FOLLOW_UP_PHRASES.some(phrase => messageLower.includes(phrase));
}

// Get or create conversation ID for a user
function getConversationId(userId: string): string {
  if (!userConversations.has(userId)) {
    userConversations.set(userId, uuidv4());
  }
  return userConversations.get(userId)!;
}

// Get or create BufferMemory for a session
function getSessionMemory(sessionId: string): BufferMemory {
  if (!sessionHistories.has(sessionId)) {
    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "history",
      inputKey: "input",
      outputKey: "content",
    });
    sessionHistories.set(sessionId, memory);
  }
  return sessionHistories.get(sessionId)!;
}

// Create the chain with message history
const chainWithMemory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: async (sessionId: string) => {
    // Return the chatHistory for RunnableWithMessageHistory
    return getSessionMemory(sessionId).chatHistory;
  },
  inputMessagesKey: "input",
  historyMessagesKey: "history",
  outputMessagesKey: "content",
});

// Save message to database
async function saveMessage(userId: string, conversationId: string, role: "user" | "assistant", content: string) {
  try {
    console.log("[saveMessage] Saving message for userId:", userId);
    await prisma.message.create({
      data: {
        userId,
        conversationId,
        role,
        content,
      },
    });
    console.log("→ Saved message to database:", { userId, conversationId, role });
  } catch (error) {
    console.error("❌ Error saving message to database:", error);
    throw error;
  }
}

// Get conversation history from database
async function getConversationHistory(userId: string, conversationId: string): Promise<BaseMessage[]> {
  try {
    const history = await prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return history.map((m: { role: string; content: string }) => 
      m.role === "user" 
        ? new HumanMessage(m.content)
        : new AIMessage(m.content)
    );
  } catch (error) {
    console.error("❌ Error getting conversation history:", error);
    throw error;
  }
}

// Main conversation handler
export async function handleConversation(userId: string, userInput: string) {
  try {
    if (!userInput.trim()) throw new Error("Empty prompt");
    const conversationId = getConversationId(userId);
    await saveMessage(userId, conversationId, "user", userInput);
    const memory = getSessionMemory(conversationId);
    const messages = await memory.chatHistory.getMessages();
    let inputForLLM = userInput;
    if (isFollowUp(userInput)) {
      if (messages.length === 0) throw new Error("No previous context for follow-up");
      // Find the last non-follow-up user message as the topic
      let lastTopic = "the previous topic";
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (
          msg._getType() === "human" &&
          typeof msg.content === "string" &&
          !isFollowUp(msg.content)
        ) {
          lastTopic = msg.content;
          break;
        }
      }
      inputForLLM = `This is a follow-up. Continue from your previous answer about: ${lastTopic}. User says: \"${userInput}\"`;
    }
    const result = await chainWithMemory.invoke(
      { input: inputForLLM } as any,
      { configurable: { sessionId: conversationId } }
    );
    const responseContent = typeof result.content === 'string'
      ? result.content
      : JSON.stringify(result);
    await saveMessage(userId, conversationId, "assistant", responseContent);
    return {
      result: responseContent
    };
  } catch (error) {
    console.error("❌ Error in conversation handler:", error);
    throw error;
  }
}

// Get conversation history for a user
export async function getHistory(userId: string) {
  const conversationId = getConversationId(userId);
  return getConversationHistory(userId, conversationId);
}

// Start a new conversation
export function startNewConversation(userId: string) {
  const newConversationId = uuidv4();
  userConversations.set(userId, newConversationId);
  sessionHistories.delete(userId); // Clear the message history
  return newConversationId;
}

// Clear conversation history for a user
export function clearConversationHistory(userId: string) {
  userConversations.delete(userId);
  sessionHistories.delete(userId);
} 