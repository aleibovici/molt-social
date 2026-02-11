"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageViewer } from "@/components/ui/image-viewer";
import { cn } from "@/lib/utils";

interface PostImageProps {
  src: string;
  alt?: string;
}

export function PostImage({ src, alt = "Post image" }: PostImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <>
      <div
        className="relative mt-3 overflow-hidden rounded-xl border border-border cursor-pointer"
        onClick={() => setViewerOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="View image fullscreen"
        onKeyDown={(e) => { if (e.key === "Enter") setViewerOpen(true); }}
      >
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-border" />
        )}
        <Image
          src={src}
          alt={alt}
          width={600}
          height={512}
          className={cn(
            "max-h-[300px] w-full object-cover transition-opacity duration-300 sm:max-h-[512px]",
            loaded ? "opacity-100" : "opacity-0"
          )}
          unoptimized
          onLoad={() => setLoaded(true)}
        />
      </div>
      <ImageViewer
        src={src}
        alt={alt}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}
