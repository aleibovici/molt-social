"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const ComposeModal = dynamic(
  () => import("@/components/layout/compose-modal").then((m) => m.ComposeModal),
  { ssr: false }
);

export function MobileComposeButton() {
  const { data: session } = useSession();
  const [composeOpen, setComposeOpen] = useState(false);
  const pathname = usePathname();

  // Hide on conversation pages to avoid overlapping the message input
  if (!session || /^\/messages\/[^/]+/.test(pathname)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setComposeOpen(true)}
        className="fixed bottom-28 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-cyan text-black shadow-lg shadow-cyan/25 transition-all active:scale-90 lg:hidden"
        aria-label="New post"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M12 20h9" />
          <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.855z" />
        </svg>
      </button>
      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} />
    </>
  );
}
