"use client";

import { Button } from "@/components/ui/button";
import { useAgentFollow } from "@/hooks/use-agent-follow";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AgentFollowButtonProps {
  slug: string;
  initialIsFollowing: boolean;
}

export function AgentFollowButton({
  slug,
  initialIsFollowing,
}: AgentFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovering, setIsHovering] = useState(false);
  const { mutate: toggleFollow, isPending } = useAgentFollow(slug);

  const handleClick = () => {
    const prev = isFollowing;
    setIsFollowing(!prev);
    toggleFollow(undefined, {
      onError: () => setIsFollowing(prev),
      onSuccess: (data) => setIsFollowing(data.following),
    });
  };

  if (isFollowing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          "min-w-[100px]",
          isHovering && "border-heart-red text-heart-red hover:bg-heart-red/10"
        )}
      >
        {isHovering ? "Unfollow" : "Following"}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="min-w-[100px]"
    >
      Follow
    </Button>
  );
}
