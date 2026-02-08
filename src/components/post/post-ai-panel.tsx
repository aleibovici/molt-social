"use client";

import { useState, useEffect, useRef } from "react";
import { useLlmChat } from "@/hooks/use-llm-chat";
import { useLlmSettings } from "@/hooks/use-llm-settings";
import { LlmSettingsModal } from "@/components/post/llm-settings-modal";
import { getProvider } from "@/lib/llm-providers";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PostAiPanelProps {
  postContent: string;
  onClose: () => void;
}

export function PostAiPanel({ postContent, onClose }: PostAiPanelProps) {
  const { data: settings, isLoading: settingsLoading } = useLlmSettings();
  const { messages, streaming, error, sendMessage, reset } =
    useLlmChat(postContent);
  const [input, setInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Auto-summarize on first mount when configured
  useEffect(() => {
    if (!initialized.current && settings?.configured && !messages.length) {
      initialized.current = true;
      sendMessage();
    }
  }, [settings?.configured, messages.length, sendMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    setInput("");
    sendMessage(trimmed);
  };

  const providerInfo = settings?.provider
    ? getProvider(settings.provider)
    : null;

  // Guest (not signed in) state
  if (!settingsLoading && settings?.authenticated === false) {
    return (
      <div className="border-t border-border bg-card/50 px-4 py-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium">AI Summary</p>
            <p className="mt-1 text-xs text-muted">
              Sign in to get AI-powered summaries and discuss post topics.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <Link
          href="/sign-in"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-cyan px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-cyan/90"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          Sign in
        </Link>
      </div>
    );
  }

  // Not configured state (authenticated but no LLM provider set up)
  if (!settingsLoading && !settings?.configured) {
    return (
      <div className="border-t border-border bg-card/50 px-4 py-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium">Set up AI</p>
            <p className="mt-1 text-xs text-muted">
              Configure your LLM provider to get AI-powered summaries and discuss post
              topics.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-cyan px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-cyan/90"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Configure AI Provider
        </button>
        <LlmSettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-card/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-cyan"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span className="text-xs font-medium text-cyan">AI Summary</span>
          {providerInfo && (
            <span className="text-xs text-muted">
              {providerInfo.name} · {settings?.model}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded p-1 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
            title="AI Settings"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded p-1 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
            title="Close"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="max-h-80 overflow-y-auto px-4 py-3">
        {settingsLoading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
            Loading...
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn("mb-3", msg.role === "user" && "flex justify-end")}
          >
            {msg.role === "user" ? (
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-cyan/15 px-3 py-2 text-sm">
                {msg.content}
              </div>
            ) : (
              <div className="text-sm leading-relaxed text-foreground/90 [&_strong]:font-semibold [&_em]:italic">
                {msg.content || (
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" />
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan [animation-delay:0.2s]" />
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan [animation-delay:0.4s]" />
                  </span>
                )}
                {streaming && i === messages.length - 1 && msg.content && (
                  <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-cyan" />
                )}
              </div>
            )}
          </div>
        ))}

        {error && (
          <p className="mb-3 rounded-lg bg-heart-red/10 px-3 py-2 text-xs text-heart-red">
            {error}
          </p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input for follow-up questions */}
      {messages.length > 0 && (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-border px-4 py-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question..."
            disabled={streaming}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className={cn(
              "rounded-full p-1.5 transition-colors",
              input.trim() && !streaming
                ? "text-cyan hover:bg-cyan/10"
                : "text-muted/40"
            )}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      )}

      <LlmSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
