"use client";
import { useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useUserPlan } from "@/hooks/useUserPlan";
import { toast } from 'react-hot-toast';

export default function PricingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [planType, setPlanType] = useState<"Personal" | "Business">("Personal");
  const { user } = useUser();
  const { getToken } = useAuth();
  const { plan: userPlan, refetchPlan } = useUserPlan();
  
  console.log("Current user plan:", userPlan); // Debug log

  const handleSubscribe = async (priceId: string) => {
    const token = await getToken();
    
    const res = await fetch("http://localhost:4000/api/billing/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: user?.primaryEmailAddress?.emailAddress,
        priceId,
        userId: user?.id,
      }),
    });
  
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ API error response:", errorText);
      return;
    }
  
    const data = await res.json();
    if (data?.url) {
      window.location.href = data.url;
    }
  };

  // Cancel subscription handler
  const handleCancelSubscription = async () => {
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:4000/api/billing/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Subscription canceled successfully.");
        await refetchPlan();
      } else {
        toast.error(`Cancel failed: ${data.error}`);
      }
    } catch (err) {
      toast.error("Error cancelling subscription.");
      console.error("❌ Cancel error:", err);
    }
  };

  if (!open) return null;

  const plans = [
    {
      name: "Basic",
      price: "Free",
      priceId: "price_1RXtcySBfHkO6vs5sihyZ7v1",
      period: "",
      description: "Get started with 10 free prompts per month.",
      current: userPlan === "basic",
      features: [
        "10 prompts per month",
        "Access to basic Ollama models (e.g., llama2, mistral)",
        "No credit card required",
      ],
      cta: userPlan === "basic" ? "Your current plan" : "Current plan",
      ctaDisabled: userPlan === "basic",
      planKey: "basic",
    },
    {
      name: "Plus",
      price: "$10",
      priceId: "price_1RXte5SBfHkO6vs5FswZoKw9",
      period: "month",
      description: "Unlock unlimited prompts and access to more advanced Ollama models.",
      current: userPlan === "plus",
      features: [
        "Unlimited prompts",
        "Priority support",
        "Access to advanced Ollama models (e.g., llama3, codellama, phi3)",
        "All Basic features",
      ],
      cta: userPlan === "plus" ? "Your current plan" : "Upgrade to Plus",
      ctaDisabled: userPlan === "plus",
      planKey: "plus",
    },
    {
      name: "Pro",
      price: "$50",
      priceId: "price_1RXtf3SBfHkO6vs59OvTjs79",
      period: "month",
      description: "For power users and teams who need the best Ollama models and features.",
      current: userPlan === "pro",
      features: [
        "Unlimited prompts",
        "Early access to new Ollama models and features",
        "Access to all available Ollama models (including large and experimental)",
        "Priority support",
        "All Plus features",
      ],
      cta: userPlan === "pro" ? "Your current plan" : "Upgrade to Pro",
      ctaDisabled: userPlan === "pro",
      planKey: "pro",
    },
  ];

  return (
    <>
      <button
        onClick={async () => {
          const token = await getToken();
          console.log('Clerk JWT:', token);
          alert(token);
        }}
        className="fixed top-4 left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded shadow"
      >
        Show Clerk Token
      </button>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-95">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 shadow-2xl w-full max-w-5xl relative">
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white text-2xl"
            onClick={onClose}
          >
            &times;
          </button>
          <h2 className="text-3xl font-bold mb-8 text-center">Upgrade your plan</h2>

          {/* Toggle */}
          <div className="flex justify-center mb-8">
            <button
              className={`px-4 py-1 rounded-full font-semibold mr-2 ${
                planType === "Personal" ? "bg-black text-white" : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setPlanType("Personal")}
            >
              Personal
            </button>
            <button
              className={`px-4 py-1 rounded-full font-semibold ${
                planType === "Business" ? "bg-black text-white" : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setPlanType("Business")}
              disabled
            >
              Business
            </button>
          </div>

          {/* Plans */}
          <div className="flex gap-8 justify-center">
            {plans.map((planObj) => {
              const isCurrent = planObj.name.toLowerCase() === userPlan;
              return (
                <div
                  key={planObj.name}
                  className={`bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-md flex flex-col items-start w-80 border ${
                    isCurrent ? "border-blue-500" : "border-gray-200 dark:border-zinc-700"
                  }`}
                >
                  <h3 className="text-2xl font-bold mb-2">{planObj.name}</h3>
                  <div className="flex items-end mb-2">
                    <span className="text-4xl font-bold">${planObj.price.replace("$", "")}</span>
                    <span className="ml-1 text-base text-gray-500 font-semibold">USD</span>
                    <span className="ml-1 text-base text-gray-500 font-normal">/ {planObj.period}</span>
                  </div>
                  <p className="mb-4 text-gray-700 dark:text-gray-300">{planObj.description}</p>
                  {/* UI logic for plan actions */}
                  {planObj.name === "Basic" ? (
                    userPlan === "basic" ? (
                      <button
                        className="w-full mb-4 py-2 rounded-lg bg-gray-100 text-gray-500 font-semibold cursor-not-allowed"
                        disabled
                      >
                        Your current plan
                      </button>
                    ) : null
                  ) : isCurrent ? (
                    <>
                      <div className="w-full mb-2 py-2 rounded-lg bg-gray-100 text-gray-500 text-center font-semibold">
                        Your current plan
                      </div>
                      <button
                        onClick={handleCancelSubscription}
                        className="w-full mb-4 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-900 transition mt-2"
                      >
                        Cancel Subscription
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(planObj.priceId)}
                      className="w-full mb-4 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-900 transition"
                      disabled={planObj.ctaDisabled}
                    >
                      {planObj.cta}
                    </button>
                  )}
                  <ul className="mb-2 text-gray-700 dark:text-gray-300 text-left text-sm">
                    {planObj.features.map((f) => (
                      <li key={f} className="mb-1 flex items-start">
                        <span className="mr-2 text-green-600 font-bold">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href="#" className="mt-2 text-xs text-gray-500 underline">
                    I need help with a billing issue
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
