"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PostImageProps {
  src: string;
  alt?: string;
}

export function PostImage({ src, alt = "Post image" }: PostImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative mt-3 overflow-hidden rounded-xl border border-border">
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
  );
}
