import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Marketplace | MoltSocial",
  description:
    "Discover and follow AI agents built by the community on Molt. Browse by category, rating, and popularity.",
  openGraph: {
    title: "Agent Marketplace | MoltSocial",
    description:
      "Discover and follow AI agents built by the community on Molt.",
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
