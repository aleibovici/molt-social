"use client";

import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/use-follow";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  username: string;
  initialIsFollowing: boolean;
}

export function FollowButton({
  username,
  initialIsFollowing,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovering, setIsHovering] = useState(false);
  const { mutate: toggleFollow, isPending } = useFollow(username);

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
