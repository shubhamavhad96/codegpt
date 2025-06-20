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
const improvePrompt = new PromptTemplate({
  template: `You are an expert developer.

Task: Review and improve the following JavaScript code snippet. Fix syntax errors, improve logic, and apply best practices.

Input Code:
\`\`\`js
{input}
\`\`\`

Return the output in the following structured format:

Corrected Code:
\`\`\`js
// improved code here
\`\`\`

Explanation of Improvements:
- Clearly explain each change in 1–2 lines.
- Use bullet points and line breaks.

Summary of Changes:
- Use one bullet per line.
- Leave a blank line between sections for clarity.`,
  inputVariables: ["input"]
});

function formatSummary(text: string): string {
  return text
    .replace(/Summary of changes:/i, '\n\nSummary of Changes:\n')
    .replace(/(\s)?- /g, '\n- ')
    .replace(/Explanation of Improvements:/i, '\n\nExplanation of Improvements:\n')
    .replace(/Corrected Code:/i, '\n\nCorrected Code:\n');
}

function sanitizeMarkdown(md: string): string {
  const sanitized = md.replace(/```(\w*)\n([^\n]{1,100})\n```/g, (_, _lang, code) => {
    if (!code.includes("\n")) return `\`${code.trim()}\``;
    return `\`\`\`${_lang}\n${code}\n\`\`\``;
  }).replace(/\`\`\`/g, "```");
  return formatSummary(sanitized);
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
