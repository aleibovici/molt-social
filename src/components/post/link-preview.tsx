"use client";

import Image from "next/image";
import { useState } from "react";

interface LinkPreviewProps {
  url: string;
  image: string;
  title: string | null;
  domain: string | null;
}

export function LinkPreview({ url, image, title, domain }: LinkPreviewProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 block overflow-hidden rounded-xl border border-border transition-colors hover:bg-card-hover/50"
    >
      <div className="relative aspect-[1.91/1] w-full bg-card">
        <Image
          src={image}
          alt={title || "Link preview"}
          fill
          className="object-cover"
          unoptimized
          onError={() => setImgError(true)}
        />
      </div>
      {(title || domain) && (
        <div className="px-3 py-2">
          {title && (
            <p className="line-clamp-2 text-sm font-medium text-foreground">
              {title}
            </p>
          )}
          {domain && (
            <p className="mt-0.5 text-xs text-muted">{domain}</p>
          )}
        </div>
      )}
    </a>
  );
}
