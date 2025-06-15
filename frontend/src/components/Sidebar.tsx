import { useState } from "react";
import { useUserPlan } from "@/hooks/useUserPlan";

const chats = [
  "StackOverflow AI Agent",
  "General",
  "Publish Novel on KDP",
  "Impressing Confident Bulgari...",
  "Chicken Biryani Ingredients",
  "Kotlin Codebase Understandi...",
  "Impressive AI Projects Guide",
  "AI Resume Generator Setup",
  "AI Study Planner Guide",
  "AI Pitch Deck Guide",
  "React Next.js Node Express",
  "Software for Android Develop...",
  "AI ML Career Roadmap",
  "AI Model Resume Project",
];

export default function Sidebar() {
  const [selectedChat, setSelectedChat] = useState(chats[0]);
  const { plan } = useUserPlan();

  return (
    <aside className="w-64 h-screen bg-white border-r flex flex-col">
      {/* Top Section */}
      <div className="p-4 border-b">
        <button className="w-full py-2 px-3 bg-blue-600 text-white rounded mb-2">+ New chat</button>
        <input
          className="w-full px-2 py-1 border rounded"
          placeholder="Search chats"
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <ul>
          {chats.map((chat) => (
            <li
              key={chat}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                selectedChat === chat ? "bg-gray-200 font-bold" : ""
              }`}
              onClick={() => setSelectedChat(chat)}
            >
              {chat}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex items-center gap-2">
        <span className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center font-bold text-gray-700">U</span>
        {plan === "pro" && (
          <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">PRO</span>
        )}
        {plan === "plus" && (
          <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">PLUS</span>
        )}
        <button className="ml-auto text-gray-600">View plans</button>
      </div>
    </aside>
  );
} 