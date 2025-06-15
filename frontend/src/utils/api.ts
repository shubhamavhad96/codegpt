// frontend/src/utils/api.ts

// 👉 For answering dev questions (general AI)
export async function getAIAnswer(query: string) {
    const response = await fetch("http://localhost:4000/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
  
    if (!response.ok) {
      throw new Error("Failed to fetch AI answer");
    }
  
    const data = await response.json();
    return data.result;
  }
  
  // 🆕 For improving user-submitted code
  export async function getImprovedCode(code: string) {
    const response = await fetch("http://localhost:4000/api/improve-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  
    if (!response.ok) {
      throw new Error("Failed to improve code");
    }
  
    const data = await response.json();
    return data.result;
  }
  