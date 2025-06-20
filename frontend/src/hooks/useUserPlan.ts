// frontend/hooks/useUserPlan.ts

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

// Custom event to notify all components when plan changes
const PLAN_UPDATE_EVENT = 'plan-updated';

export function useUserPlan() {
  const [plan, setPlan] = useState("basic");
  const [isPro, setIsPro] = useState(false);
  const [isPlus, setIsPlus] = useState(false);
  const { getToken } = useAuth();

  const fetchPlan = async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/user/plan", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setPlan(data.plan || "basic");
      setIsPro(!!data.isPro);
      setIsPlus(!!data.isPlus);
    } catch (error) {
      console.error("Error fetching plan:", error);
      setPlan("basic");
      setIsPro(false);
      setIsPlus(false);
    }
  };

  const refetchPlan = async () => {
    await fetchPlan();
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent(PLAN_UPDATE_EVENT));
  };

  useEffect(() => {
    fetchPlan();
    
    // Listen for plan update events from other components
    const handlePlanUpdate = () => {
      fetchPlan();
    };
    
    window.addEventListener(PLAN_UPDATE_EVENT, handlePlanUpdate);
    
    return () => {
      window.removeEventListener(PLAN_UPDATE_EVENT, handlePlanUpdate);
    };
  }, [getToken]);

  return { plan, isPro, isPlus, refetchPlan, setPlan };
}
