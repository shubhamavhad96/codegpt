// backend/agent/ollamaAgent.ts
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables";
import { BufferMemory } from "langchain/memory";

const llm = new ChatOllama({
  model: "llama3",
  baseUrl: "http://localhost:11434",
  temperature: 0.4,
});

// In-memory store for chat sessions
const sessionStore = new Map<string, BufferMemory>();
function getSessionMemory(sessionId: string): BufferMemory {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, new BufferMemory({
      memoryKey: "history",
      returnMessages: true,
    }));
  }
  return sessionStore.get(sessionId)!;
}

// General QA Prompt Template
const qaPrompt = PromptTemplate.fromTemplate(`
You are a senior software engineer. Answer the following question clearly and include working code examples if possible.

Question:
{input}

Answer:
`);

const qaPipeline = RunnableSequence.from([qaPrompt, llm]);

const qaWithMemory = new RunnableWithMessageHistory({
  runnable: qaPipeline,
  getMessageHistory: async (sessionId: string) => getSessionMemory(sessionId).chatHistory,
  inputMessagesKey: "input",
  historyMessagesKey: "history",
  outputMessagesKey: "output",
});

export async function runOllamaAgent(query: string, sessionId: string): Promise<string> {
  if (!sessionId) throw new Error("sessionId is required");
  try {
    const memory = getSessionMemory(sessionId);
    await memory.saveContext({ input: query }, { output: "Processing..." });
    const memoryVariables = await memory.loadMemoryVariables({});
    const result = await qaWithMemory.invoke(
      { input: query, history: memoryVariables.history || "" },
      { configurable: { sessionId } }
    );
    const content = result?.content || (result as any)?.answer?.content;
    if (!content || typeof content !== "string") {
      return "LLM did not return a valid result.";
    }
    await memory.saveContext({ input: query }, { output: content });
    return content;
  } catch (err) {
    console.error("Ollama QA error:", err);
    return "Ollama failed to generate a QA response.";
  }
}

// 🔧 Code Improvement Section
const improvePrompt = PromptTemplate.fromTemplate(`
You are a senior software engineer helping another developer improve their code in a conversational, step-by-step manner.

Instructions:
- Always keep your response tightly focused on the user's last code and request. Do not introduce unrelated topics or objects unless the user mentioned them.
- Suggest improvements or explain key concepts clearly, referencing only the code and context provided so far.
- If it's code, rewrite it with improvements applied, using best practices for the language detected in the code.
- Respond in Markdown format:
  - Use **triple backticks** for large multi-line code blocks
  - Use **single backticks** for inline code (e.g., \`a\`, \`b + c\`)
- End your response with a developer-to-developer or tutor-like prompt for next steps, such as: "Would you like to generalize this further, add more error handling, or explore another concept?"

Context:
{input}
`);

function sanitizeMarkdown(md: string): string {
  return md.replace(/```(\w*)\n([^\n]{1,100})\n```/g, (_, _lang, code) => {
    if (!code.includes("\n")) return `\`${code.trim()}\``;
    return `\`\`\`${_lang}\n${code}\n\`\`\``;
  }).replace(/\`\`\`/g, "```");
}

const improvePipeline = RunnableSequence.from([improvePrompt, llm]);

export async function improveCodeWithOllama(input: string): Promise<string> {
  try {
    const result = await improvePipeline.invoke({ input });
    const content = result?.content || (result as any)?.answer?.content;
    if (!content || typeof content !== "string") {
      return "LLM did not return a valid improvement.";
    }
    return sanitizeMarkdown(content);
  } catch (err) {
    console.error("Ollama improvement error:", err);
    return "Ollama failed to improve the code.";
  }
}
