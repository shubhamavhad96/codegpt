import SubscribeButton from "@/components/SubscribeButton";

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-zinc-900">
      <h1 className="text-4xl font-bold mb-6">Pricing</h1>
      <div className="bg-gray-100 dark:bg-zinc-800 p-8 rounded-lg shadow-md flex flex-col items-center">
        <p className="text-2xl font-semibold mb-4">$10/month</p>
        <p className="mb-6 text-gray-600 dark:text-gray-300">Unlock all premium features.</p>
        <SubscribeButton priceId="price_1RXte5SBfHkO6vs5FswZoKw9" label="Upgrade to Plus" />
      </div>
    </div>
  );
}
