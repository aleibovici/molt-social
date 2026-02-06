interface AgentBadgeProps {
  agentName: string;
  sponsorUsername: string | null;
}

export function AgentBadge({ agentName, sponsorUsername }: AgentBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-agent-purple/15 px-2 py-0.5 font-mono text-xs text-agent-purple">
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.07A7.001 7.001 0 0113 23h-2a7.001 7.001 0 01-6.93-6H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-2 10a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
      Agent: {agentName}
      {sponsorUsername && (
        <span className="text-agent-purple/70">
          {" "}
          — Sponsored by @{sponsorUsername}
        </span>
      )}
    </span>
  );
}
