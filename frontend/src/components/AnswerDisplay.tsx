import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

export default function AnswerDisplay({ answer }: { answer: string }) {
  // Detect dark mode (optional, for SSR-safe you may want to use a prop or context)
  const isDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const codeBg = isDark ? "#262626" : "#f7f7f8";

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Prevent hydration warning
        pre({ children }) {
          return <>{children}</>;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        code({ inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          if (!inline) {
            return (
              <SyntaxHighlighter
                language={match ? match[1] : "javascript"}
                PreTag="div"
                customStyle={{
                  borderRadius: "0.75rem",
                  background: codeBg,
                  fontSize: "1rem",
                  padding: "1rem",
                  margin: "0.5rem 0",
                  maxWidth: "100%",
                  width: "100%",
                  overflowX: "auto",
                  boxSizing: "border-box",
                }}
                codeTagProps={{ style: { background: "transparent" } }}
                wrapLongLines={true}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          }
          return (
            <code
              className="bg-gray-200 text-pink-800 rounded px-1 py-0.5 text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        li({ children, ...props }: any) {
          const checked = props.checked;
          if (typeof checked === "boolean") {
            return (
              <li className="ml-6 list-none flex items-center mb-4">
                <span className="mr-2">{checked ? "✅" : "⬜"}</span>
                <span>{children}</span>
              </li>
            );
          }
          return <li className="ml-6 list-disc mb-4">{children}</li>;
        },
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        // Use <div> instead of <p> to avoid <div> inside <p> hydration errors
        p: ({ children }) => <div className="mb-2">{children}</div>,
        h2: ({ children }) => (
          <h2 className="text-xl font-bold mt-6 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>
        ),
      }}
    >
      {answer}
    </ReactMarkdown>
  );
}
