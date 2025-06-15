"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.curateAnswer = void 0;
const ollama_1 = require("@langchain/community/chat_models/ollama");
const runnables_1 = require("@langchain/core/runnables");
const prompts_1 = require("@langchain/core/prompts");
const model = new ollama_1.ChatOllama({
    baseUrl: "http://localhost:11434", // make sure Ollama is running locally
    model: "llama3" // or llama3:8b if you're using that
});
const prompt = prompts_1.PromptTemplate.fromTemplate(`
You are a programming assistant.
Given the following StackOverflow answers, remove any outdated or deprecated information.
Return only the best and most up-to-date answer in a clean format.
If none are useful, return "No relevant solution found."

Answers:
{answers}
`);
const curateAnswer = async (answers) => {
    const input = {
        answers: answers.map((a, i) => `Answer ${i + 1}: ${a}`).join("\n\n")
    };
    const chain = runnables_1.RunnableSequence.from([prompt, model]);
    const result = await chain.invoke(input);
    return result.content;
};
exports.curateAnswer = curateAnswer;
