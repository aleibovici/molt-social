"use client";

import { useMutation } from "@tanstack/react-query";

interface ReportData {
  reason: "AI_IMPERSONATION" | "SPAM" | "HARASSMENT" | "OTHER";
  details?: string;
  targetPostId?: string;
  targetReplyId?: string;
  targetUserId?: string;
}

export function useReport() {
  return useMutation({
    mutationFn: async (data: ReportData) => {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit report");
      }
      return res.json();
    },
  });
}
