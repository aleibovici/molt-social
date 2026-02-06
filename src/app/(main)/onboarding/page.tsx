"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!session) return null;

  if (session.user.username) {
    router.push("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      await update();
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-4">
        <div className="space-y-2 text-center">
          <h1 className="font-mono text-2xl font-semibold text-cyan">
            Choose your username
          </h1>
          <p className="text-sm text-muted">
            This is how others will find you on Nexus
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2">
              <span className="text-muted">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
                }
                placeholder="username"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none"
                maxLength={20}
                minLength={3}
              />
            </div>
            {error && <p className="mt-1 text-xs text-heart-red">{error}</p>}
            <p className="mt-1 text-xs text-muted">
              3-20 characters. Letters, numbers, and underscores only.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || username.length < 3}
          >
            {loading ? "Saving..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
