"use client";

import { useState, useRef, useEffect } from "react";
import { FiArrowUp, FiPlus } from "react-icons/fi";
import AnswerDisplay from "@/components/AnswerDisplay";
import AuthWrapper from "@/components/AuthWrapper";
import { useUser } from "@clerk/nextjs";

type Message = { role: "user" | "ai", content: string };

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [improveSessionId, setImproveSessionId] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const firstName = user?.firstName || "there";
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isMax, setIsMax] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  // Create new sessions when the component mounts
  useEffect(() => {
    async function createSessions() {
      try {
        // Create chat session
        await fetch("http://localhost:4000/api/chat/session", {
          method: "POST",
        });

        // Create improvement session
        const improveResponse = await fetch("http://localhost:4000/api/improve-session", {
          method: "POST",
        });
        const improveData = await improveResponse.json();
        setImproveSessionId(improveData.sessionId);
      } catch (error) {
        console.error("Failed to create sessions:", error);
      }
    }
    createSessions();
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const createSession = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/chat/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: "demo-user" }), // or use your auth user ID
        });
        const data = await res.json();
        sessionIdRef.current = data.sessionId;
        console.log("✅ Session initialized:", data.sessionId);
      } catch (err) {
        console.error("❌ Failed to initialize session", err);
      }
    };
    createSession();
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log("handleSend called");
    if (!input.trim()) return;
    if (!sessionIdRef.current) {
      console.error("❌ No active session ID");
      return;
    }
    const userMessage = input.trim();
    setInput("");
    // Always reset textarea height after sending
    if (inputRef.current) {
      inputRef.current.style.height = '44px'; // min-h-[44px]
      setIsMax(false);
    }
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    try {
      // Check if the input looks like code (contains function, class, or code-like syntax)
      const isCode = /function|class|=>|const|let|var|import|export|return|if|for|while|try|catch/.test(userMessage);
      if (isCode) {
        if (!improveSessionId) {
          throw new Error("No active improvement session");
        }
        const response = await fetch("http://localhost:4000/api/improve-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            sessionId: improveSessionId,
            code: userMessage 
          }),
        });
        const data = await response.json();
        if (!data.result) {
          throw new Error("No improvement suggestions received");
        }
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: data.result }
        ]);
      } else {
        const response = await fetch("http://localhost:4000/api/chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            message: userMessage,
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.response) {
          throw new Error(data.error || "Failed to get response");
        }
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: data.response }
        ]);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "❌ Failed to get response. Try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWrapper>
      {/* Chat area (no sticky header) */}
      <div
        className="flex-1 w-full max-w-2xl mx-auto px-2 pb-48 flex flex-col gap-4 mt-8"
        ref={chatRef}
      >
        {messages.length === 0 && (
          <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-center text-gray-900 dark:text-white mt-12">
            Hey {firstName}, what&apos;s bugging you today?
          </h1>
        )}
        {messages.map((msg, idx) =>
          msg.role === "user" ? (
            <div key={idx} className="flex justify-end">
              <pre className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-none max-w-[70%] break-words whitespace-pre-wrap font-sans text-base">
                {msg.content}
              </pre>
            </div>
          ) : (
            <div key={idx} className="flex justify-start">
              <div>
                <AnswerDisplay answer={msg.content} />
              </div>
            </div>
          )
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-zinc-700 text-black dark:text-white px-4 py-2 rounded-2xl rounded-bl-none max-w-[70%] italic">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input bar fixed at bottom */}
      <form
        onSubmit={handleSend}
        className="fixed bottom-0 left-0 w-full bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700 p-4 flex justify-center"
        style={{ zIndex: 10 }}
      >
        <div className="max-w-2xl w-full flex flex-col gap-0 rounded-2xl shadow-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 px-6 pt-3 pb-2">
          {/* Textarea wrapper */}
          <div className="flex-1 w-full">
            <textarea
              ref={inputRef}
              className={`w-full bg-transparent outline-none text-lg placeholder-gray-400 dark:placeholder-gray-500 resize-none min-h-[44px] max-h-40 pr-2 pt-3 ${isMax && input ? 'overflow-y-auto' : 'overflow-y-hidden'}`}
              placeholder="Ask anything"
              value={input}
              onChange={e => {
                setInput(e.target.value);
                if (inputRef.current) {
                  inputRef.current.style.height = 'auto';
                  const scrollHeight = inputRef.current.scrollHeight;
                  const maxHeight = 160; // 40 * 4 (rem to px)
                  const newHeight = Math.min(scrollHeight, maxHeight);
                  inputRef.current.style.height = newHeight + 'px';
                  setIsMax(newHeight === maxHeight);
                }
              }}
              disabled={loading}
              rows={1}
              style={{ lineHeight: '2.25', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          {/* Buttons row always at the bottom */}
          <div className="flex flex-row items-center justify-between mt-2">
            <button
              type="button"
              tabIndex={-1}
              className="text-gray-500 hover:text-blue-600 focus:outline-none"
              aria-label="Add"
            >
              <FiPlus className="text-2xl" />
            </button>
            {input.trim() && (
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-black text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl disabled:opacity-50 transition-opacity"
                aria-label="Send"
              >
                <FiArrowUp />
              </button>
            )}
          </div>
        </div>
      </form>
    </AuthWrapper>
  );
}