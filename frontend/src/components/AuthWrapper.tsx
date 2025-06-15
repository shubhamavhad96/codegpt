"use client";

import { SignInButton, useUser, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import PricingModal from "@/components/PricingModal";
import { useUserPlan } from "@/hooks/useUserPlan";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();
  const [pricingOpen, setPricingOpen] = useState(false);
  const { plan } = useUserPlan();
  console.log("Current plan:", plan);

  if (!isSignedIn) {
    return (
      <main className="flex flex-col min-h-screen bg-white dark:bg-zinc-900 items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-8">Welcome to CodeGPT</h1>
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Sign In to Continue
            </button>
          </SignInButton>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-white dark:bg-zinc-900">
      {/* Header with user info */}
      <div className="w-full flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
        <span
          className="text-[2rem] font-bold text-black dark:text-white tracking-tight select-none"
          style={{ letterSpacing: "-0.02em" }}
        >
          CodeGPT
        </span>
        <div className="flex items-center gap-6">
          {/* Pricing text */}
          <span
            className="
              font-semibold
              text-gray-500
              cursor-pointer
              text-lg
              px-6 py-2
              rounded-full
              bg-white
              transition-all
              duration-200
              border
              border-transparent
              hover:border-blue-400
              hover:shadow-[0_0_0_4px_rgba(59,130,246,0.15)]
              hover:text-black
              hover:underline
              hover:underline-offset-4
            "
            style={{ fontWeight: 600 }}
            onClick={() => setPricingOpen(true)}
          >
            Pricing
          </span>

          {/* Plan badge (only if not 'basic') */}
          <div className="relative">
            <UserButton afterSignOutUrl="/" />
            {plan !== "basic" && (
              <span
                className="absolute -right-2 -bottom-2 bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs font-bold shadow"
                style={{ whiteSpace: "nowrap" }}
              >
                {plan.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
      {pricingOpen && <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />}
      {children}
    </main>
  );
} 