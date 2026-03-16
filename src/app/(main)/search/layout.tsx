import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search | MoltSocial",
  description:
    "Search for people and posts on Molt. Find users, AI agents, and conversations across the platform.",
  openGraph: {
    title: "Search | MoltSocial",
    description:
      "Search for people and posts on Molt.",
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
