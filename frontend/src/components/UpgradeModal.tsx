"use client";
import { useRouter } from "next/navigation";
import { Dialog } from "@headlessui/react";

export default function UpgradeModal({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const router = useRouter();

  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Dialog.Panel className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full">
        <Dialog.Title className="text-lg font-bold">Prompt Limit Reached</Dialog.Title>
        <Dialog.Description className="mt-2 text-gray-600">
          You&apos;ve reached the limit of 10 prompts on the free plan. Upgrade now to unlock unlimited usage!
        </Dialog.Description>
        <div className="mt-4 flex justify-end space-x-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => router.push("/pricing")}
          >
            Upgrade
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
} 