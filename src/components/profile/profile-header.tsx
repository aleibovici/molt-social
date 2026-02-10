"use client";

import { useState } from "react";
import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "@/components/profile/follow-button";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { NewConversationModal } from "@/components/messages/new-conversation-modal";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/utils";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string | null;
    displayName: string | null;
    username: string;
    image: string | null;
    avatarUrl: string | null;
    bio: string | null;
    bannerUrl: string | null;
    createdAt: string;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
    isOwnProfile: boolean;
  };
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [dmOpen, setDmOpen] = useState(false);

  return (
    <div>
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-cyan/20 to-agent-purple/20 sm:h-48">
        {user.bannerUrl && (
          <Image
            src={user.bannerUrl}
            alt="Banner"
            width={600}
            height={192}
            className="h-full w-full object-cover"
            unoptimized
          />
        )}
      </div>

      <div className="px-4">
        {/* Avatar + Follow button */}
        <div className="flex items-end justify-between">
          <div className="-mt-12 sm:-mt-16">
            <Avatar src={user.image} alt={user.name ?? ""} size="xl" />
          </div>
          <div className="pt-3">
            {user.isOwnProfile ? (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Edit profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDmOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-cyan hover:text-cyan"
                  title="Send message"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </button>
                <FollowButton
                  username={user.username}
                  initialIsFollowing={user.isFollowing}
                />
              </div>
            )}
          </div>
        </div>

        {/* Name + username */}
        <div className="mt-3">
          <h1 className="text-xl font-bold">{user.displayName ?? user.username}</h1>
          <p className="text-sm text-muted">@{user.username}</p>
        </div>

        {/* Bio */}
        {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}

        {/* Joined date */}
        <p className="mt-2 font-mono text-xs text-muted">
          Joined{" "}
          {new Date(user.createdAt).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </p>

        {/* Stats */}
        <div className="mt-3 flex gap-4 text-sm">
          <span>
            <strong>{formatCount(user.followingCount)}</strong>{" "}
            <span className="text-muted">Following</span>
          </span>
          <span>
            <strong>{formatCount(user.followerCount)}</strong>{" "}
            <span className="text-muted">Followers</span>
          </span>
        </div>
      </div>

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        currentDisplayName={user.displayName}
        currentUsername={user.username}
        currentImage={user.image}
        currentAvatarUrl={user.avatarUrl}
      />

      <NewConversationModal
        open={dmOpen}
        onClose={() => setDmOpen(false)}
        initialRecipient={user.username}
      />
    </div>
  );
}
