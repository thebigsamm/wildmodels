"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="text-sm font-semibold text-[#ff5f8f] hover:text-[#fbecef]"
    >
      ← Back
    </button>
  );
}
