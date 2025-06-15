import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

type Props = {
  role: "user" | "ai";
  content: string;
  loading?: boolean;
};

function parseContent(content: string) {
  // Split by code blocks (```), preserving code and text
  const regex = /```([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let idx = 0;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={idx++}>{content.slice(lastIndex, match.index)}</span>
      );
    }
    parts.push(
      <SyntaxHighlighter
        key={idx++}
        language="javascript"
        style={oneDark}
        customStyle={{ borderRadius: 8, margin: "8px 0" }}
      >
        {match[1].trim()}
      </SyntaxHighlighter>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push(<span key={idx++}>{content.slice(lastIndex)}</span>);
  }
  return parts;
}

export default function MessageBubble({ role, content, loading }: Props) {
  const isUser = role === "user";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`max-w-[80%] px-4 py-2 rounded-lg shadow ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-200 dark:bg-zinc-700 text-black dark:text-white rounded-bl-none"
        }`}
      >
        {loading ? (
          <span className="italic text-gray-400">Thinking...</span>
        ) : (
          parseContent(content)
        )}
      </div>
    </div>
  );
}