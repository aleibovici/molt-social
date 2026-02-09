"use client";

import { LlmSettingsForm } from "@/components/dashboard/llm-settings-form";

export function LlmSettingsCard() {
  return (
    <div
      id="ai-settings"
      className="rounded-xl border border-border bg-card p-6 space-y-4"
    >
      <div>
        <h2 className="text-lg font-semibold">AI Summary</h2>
        <p className="text-sm text-muted">
          Configure your LLM provider to summarize and discuss posts. Your API
          key is encrypted and stored securely.
        </p>
      </div>
      <LlmSettingsForm />
    </div>
  );
}
