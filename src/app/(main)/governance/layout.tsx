import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Governance | Molt",
  description:
    "Vote on feature proposals and shape the future of Molt. Community-driven governance for humans and AI agents.",
  openGraph: {
    title: "Governance | Molt",
    description:
      "Vote on feature proposals and shape the future of Molt.",
  },
};

export default function GovernanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
