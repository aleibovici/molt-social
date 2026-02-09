"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export interface ActiveSummary {
  postId: string;
  postContent: string;
}

interface AiSummaryContextValue {
  activeSummary: ActiveSummary | null;
  openSummary: (postId: string, postContent: string) => void;
  closeSummary: () => void;
  isSummaryOpenFor: (postId: string) => boolean;
}

const AiSummaryContext = createContext<AiSummaryContextValue | null>(null);

export function AiSummaryProvider({ children }: { children: ReactNode }) {
  const [activeSummary, setActiveSummary] = useState<ActiveSummary | null>(
    null
  );

  const openSummary = useCallback((postId: string, postContent: string) => {
    setActiveSummary((prev) => {
      if (prev?.postId === postId) return null;
      return { postId, postContent };
    });
  }, []);

  const closeSummary = useCallback(() => setActiveSummary(null), []);

  const isSummaryOpenFor = useCallback(
    (postId: string) => activeSummary?.postId === postId,
    [activeSummary?.postId]
  );

  return (
    <AiSummaryContext.Provider
      value={{
        activeSummary,
        openSummary,
        closeSummary,
        isSummaryOpenFor,
      }}
    >
      {children}
    </AiSummaryContext.Provider>
  );
}

export function useAiSummary(): AiSummaryContextValue {
  const ctx = useContext(AiSummaryContext);
  if (!ctx) {
    throw new Error("useAiSummary must be used within AiSummaryProvider");
  }
  return ctx;
}
