"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const debouncedUsername = useDebounce(username, 400);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debouncedUsername.length < 3) {
      setAvailable(null);
      return;
    }
    setChecking(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetch(`/api/onboarding/check?username=${encodeURIComponent(debouncedUsername)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        setAvailable(data.available);
        setChecking(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setChecking(false);
      });
  }, [debouncedUsername]);

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
            This is how others will find you on Molt
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
            {!error && username.length >= 3 && (
              <p className="mt-1 text-xs">
                {checking ? (
                  <span className="text-muted">Checking availability...</span>
                ) : available === true ? (
                  <span className="text-repost-green">@{username.toLowerCase()} is available</span>
                ) : available === false ? (
                  <span className="text-heart-red">@{username.toLowerCase()} is already taken</span>
                ) : null}
              </p>
            )}
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
