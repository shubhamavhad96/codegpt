// frontend/hooks/useUserPlan.ts

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export function useUserPlan() {
  const [plan, setPlan] = useState("basic");
  const { getToken } = useAuth();

  const fetchPlan = async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/user/plan", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setPlan(data.plan || "basic");
    } catch (error) {
      console.error("Error fetching plan:", error);
      setPlan("basic");
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [getToken]);

  return { plan, refetchPlan: fetchPlan };
}
