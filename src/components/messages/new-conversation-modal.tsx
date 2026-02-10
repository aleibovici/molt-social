"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useStartConversation } from "@/hooks/use-start-conversation";
import { useUserSearch } from "@/hooks/use-user-search";
import { useAgentProfiles } from "@/hooks/use-agent-profiles";

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  initialRecipient?: string;
}

export function NewConversationModal({
  open,
  onClose,
  initialRecipient,
}: NewConversationModalProps) {
  const router = useRouter();
  const [recipient, setRecipient] = useState(initialRecipient ?? "");
  const [message, setMessage] = useState("");
  const [isAgent, setIsAgent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const startConversation = useStartConversation();

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // User search (debounced)
  const { data: userSearchData, isLoading: userSearchLoading } =
    useUserSearch(isAgent ? "" : recipient);

  // Agent profiles (for agent mode)
  const { data: agentData } = useAgentProfiles();

  useEffect(() => {
    if (initialRecipient) {
      setRecipient(initialRecipient);
      setIsAgent(false);
    }
  }, [initialRecipient]);

  // Compute dropdown items
  const userResults = userSearchData?.results ?? [];
  const agentResults = (agentData?.profiles ?? []).filter((a) => {
    if (!recipient.trim()) return true;
    const q = recipient.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q)
    );
  });

  const items = isAgent ? agentResults : userResults;
  const showDropdown =
    dropdownOpen && !initialRecipient && (items.length > 0 || (isAgent ? false : userSearchLoading));

  // Reset highlight when items change
  useEffect(() => {
    setHighlightIndex(-1);
  }, [items.length, isAgent, recipient]);

  // Click-outside to close dropdown
  useEffect(() => {
    if (!showDropdown) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [showDropdown]);

  const selectUser = useCallback(
    (username: string) => {
      setRecipient(username);
      setDropdownOpen(false);
      setHighlightIndex(-1);
    },
    []
  );

  const selectAgent = useCallback(
    (slug: string) => {
      setRecipient(slug);
      setDropdownOpen(false);
      setHighlightIndex(-1);
    },
    []
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < items.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : items.length - 1
      );
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      const item = items[highlightIndex];
      if (isAgent && "slug" in item) {
        selectAgent(item.slug);
      } else if ("username" in item && item.username) {
        selectUser(item.username);
      }
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
      setHighlightIndex(-1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedRecipient = recipient.trim().replace(/^@/, "").toLowerCase();
    const trimmedMessage = message.trim();

    if (!trimmedRecipient || !trimmedMessage) return;

    try {
      const result = await startConversation.mutateAsync({
        ...(isAgent
          ? { recipientAgentSlug: trimmedRecipient }
          : { recipientUsername: trimmedRecipient }),
        content: trimmedMessage,
      });

      setRecipient("");
      setMessage("");
      onClose();
      router.push(`/messages/${result.conversationId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start conversation"
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="mb-4 text-lg font-semibold">
        {initialRecipient ? `Message @${initialRecipient}` : "New Message"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!initialRecipient && (
          <>
            {/* Radio chips with icons */}
            <div className="flex items-center gap-2">
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  !isAgent
                    ? "border-cyan bg-cyan/10 text-cyan"
                    : "border-border text-muted hover:border-muted"
                )}
              >
                <input
                  type="radio"
                  name="recipientType"
                  checked={!isAgent}
                  onChange={() => {
                    setIsAgent(false);
                    setRecipient("");
                    setDropdownOpen(false);
                  }}
                  className="sr-only"
                />
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                User
              </label>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  isAgent
                    ? "border-agent-purple bg-agent-purple/10 text-agent-purple"
                    : "border-border text-muted hover:border-muted"
                )}
              >
                <input
                  type="radio"
                  name="recipientType"
                  checked={isAgent}
                  onChange={() => {
                    setIsAgent(true);
                    setRecipient("");
                    setDropdownOpen(false);
                  }}
                  className="sr-only"
                />
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                Agent
              </label>
            </div>

            {/* Autocomplete input */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={isAgent ? "Search your agents..." : "Search users..."}
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-cyan focus:outline-none"
              />

              {/* Dropdown */}
              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-lg border border-border bg-background shadow-lg"
                >
                  {!isAgent && userSearchLoading && (
                    <div className="flex justify-center p-3">
                      <Spinner className="h-4 w-4" />
                    </div>
                  )}

                  {!isAgent && !userSearchLoading && items.length === 0 && recipient.trim() && (
                    <div className="px-3 py-2 text-sm text-muted">
                      No users found
                    </div>
                  )}

                  {isAgent && items.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted">
                      No agents found
                    </div>
                  )}

                  {items.map((item, idx) => {
                    if (isAgent && "slug" in item) {
                      const agent = item as (typeof agentResults)[number];
                      return (
                        <button
                          key={agent.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectAgent(agent.slug)}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-card-hover",
                            idx === highlightIndex && "bg-card-hover"
                          )}
                        >
                          {agent.avatarUrl ? (
                            <Avatar
                              src={agent.avatarUrl}
                              alt={agent.name}
                              size="sm"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-agent-purple/20 text-agent-purple">
                              <svg
                                className="h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-medium text-agent-purple">
                              {agent.name}
                            </div>
                            <div className="truncate text-xs text-muted">
                              /{agent.slug}
                            </div>
                          </div>
                        </button>
                      );
                    }

                    const user = item as (typeof userResults)[number];
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          user.username && selectUser(user.username)
                        }
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-card-hover",
                          idx === highlightIndex && "bg-card-hover"
                        )}
                      >
                        <Avatar
                          src={user.image}
                          alt={user.displayName ?? user.username ?? ""}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {user.displayName ?? user.username}
                          </div>
                          {user.username && (
                            <div className="truncate text-xs text-muted">
                              @{user.username}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {isAgent && (
                <p className="mt-1 text-xs text-muted">
                  You can only message agents you own.
                </p>
              )}
            </div>
          </>
        )}

        <textarea
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-cyan focus:outline-none"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              !recipient.trim() ||
              !message.trim() ||
              startConversation.isPending
            }
          >
            {startConversation.isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              "Send"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
