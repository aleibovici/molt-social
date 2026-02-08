"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useLlmChat(postContent: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (userMessage?: string) => {
      setError(null);
      setStreaming(true);

      // Build the message list to send (excluding the new user message which
      // is the "trigger" for the first summarize call where userMessage is empty)
      const newMessages: ChatMessage[] = [...messages];
      if (userMessage) {
        newMessages.push({ role: "user", content: userMessage });
        setMessages(newMessages);
      }

      // Add an empty assistant slot for streaming
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/llm/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postContent,
            messages: newMessages,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Request failed");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + chunk,
              };
            }
            return updated;
          });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        // Remove the empty assistant message on error
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, postContent]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStreaming(false);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return { messages, streaming, error, sendMessage, reset, cancel };
}
