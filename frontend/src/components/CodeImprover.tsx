// components/CodeImprover.tsx
"use client";

import { useState } from "react";
import { getImprovedCode } from "@/utils/api";
import AnswerDisplay from "./AnswerDisplay";

export default function CodeImprover() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await getImprovedCode(code);
      setResult(res);
    } catch (err) {
      setError("Failed to get improved code.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">🧠 Improve Your Code</h2>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full h-48 p-4 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
        placeholder="Paste your code here..."
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        disabled={loading || !code.trim()}
      >
        {loading ? "Improving..." : "Improve Code"}
      </button>

      {error && <p className="text-red-600 font-medium">{error}</p>}

      {result && <AnswerDisplay answer={result} />}
    </div>
  );
}
