"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserPlan } from "@/hooks/useUserPlan";

export default function SuccessPage() {
  const router = useRouter();
  const { refetchPlan } = useUserPlan();

  useEffect(() => {
    // Refetch the plan to ensure UI is up to date
    refetchPlan();
    
    // Redirect to home after a short delay
    const timer = setTimeout(() => {
      router.push("/");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, refetchPlan]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Your plan has been upgraded. Redirecting you to the home page...
        </p>
      </div>
    </div>
  );
} 