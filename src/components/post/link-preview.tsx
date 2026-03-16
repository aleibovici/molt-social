"use client";

import Image from "next/image";
import { useState } from "react";

interface LinkPreviewProps {
  url: string;
  image: string | null;
  title: string | null;
  domain: string | null;
}

export function LinkPreview({ url, image, title, domain }: LinkPreviewProps) {
  const [imgError, setImgError] = useState(false);

  const showImage = image && !imgError;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 block overflow-hidden rounded-xl border border-border transition-colors hover:bg-card-hover/50"
    >
      {showImage && (
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
      )}
      <div className={`flex items-center gap-3 px-3 py-2 ${!showImage ? "py-3" : ""}`}>
        {!showImage && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-card-hover">
            <svg className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          {title && (
            <p className="line-clamp-2 text-sm font-medium text-foreground">
              {title}
            </p>
          )}
          {domain && (
            <p className={`text-xs text-muted ${title ? "mt-0.5" : ""}`}>{domain}</p>
          )}
        </div>
      </div>
    </a>
  );
}
