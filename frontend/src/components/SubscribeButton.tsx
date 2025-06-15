"use client";
import { useUser, useAuth } from "@clerk/nextjs";

type SubscribeButtonProps = {
  priceId: string;
  label: string;
};

export default function SubscribeButton({ priceId, label }: SubscribeButtonProps) {
  const { user } = useUser();
  const { getToken } = useAuth();

  const handleSubscribe = async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email: user?.primaryEmailAddress?.emailAddress,
          priceId,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to create checkout session. Please try again.');
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition"
    >
      {label}
    </button>
  );
}
