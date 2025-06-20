"use client";
import { useEffect, useState } from "react";

export default function UserStatus() {
  const [plan, setPlan] = useState("loading...");
  const [remaining, setRemaining] = useState<number | string>("...");

  useEffect(() => {
    const fetchPlan = async () => {
      const res = await fetch("/api/user/plan");
      const data = await res.json();
      setPlan(data.plan || "basic");
      setRemaining(data.remaining ?? "-");
    };
    fetchPlan();
  }, []);

  return (
    <div className="text-sm text-gray-600">
      Plan: <strong>{plan}</strong> | Remaining Prompts: <strong>{remaining}</strong>
    </div>
  );
} 