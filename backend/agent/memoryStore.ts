import { BufferMemory } from "langchain/memory";
import { BaseMessage } from "@langchain/core/messages";

// In-memory store for chat sessions
const sessionStore = new Map<string, BufferMemory>();

const memoryMap = new Map<string, BufferMemory>();

export function getSessionHistory(sessionId: string): BufferMemory {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, new BufferMemory());
  }
  return sessionStore.get(sessionId)!;
}

export function clearSessionHistory(sessionId: string): void {
  sessionStore.delete(sessionId);
}

export function getAllSessions(): string[] {
  return Array.from(sessionStore.keys());
}

export async function getSessionMessages(sessionId: string): Promise<BaseMessage[]> {
  const history = getSessionHistory(sessionId);
  return await history.chatHistory.getMessages();
}

export async function getMemory(sessionId: string) {
  if (!memoryMap.has(sessionId)) {
    const memory = new BufferMemory({
      memoryKey: "chat_history",
      returnMessages: true,
    });
    memoryMap.set(sessionId, memory);
  }
  return memoryMap.get(sessionId)!;
} 