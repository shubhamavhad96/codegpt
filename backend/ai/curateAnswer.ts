import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";

const model = new ChatOllama({
  baseUrl: "http://localhost:11434", // make sure Ollama is running locally
  model: "llama3" // or llama3:8b if you're using that
});

const prompt = PromptTemplate.fromTemplate(`
You are a programming assistant.
Given the following StackOverflow answers, remove any outdated or deprecated information.
Return only the best and most up-to-date answer in a clean format.
If none are useful, return "No relevant solution found."

Answers:
{answers}
`);

export const curateAnswer = async (answers: string[]) => {
  const input = {
    answers: answers.map((a, i) => `Answer ${i + 1}: ${a}`).join("\n\n")
  };

  const chain = RunnableSequence.from([prompt, model]);
  const result = await chain.invoke(input);
  return result.content;
};
