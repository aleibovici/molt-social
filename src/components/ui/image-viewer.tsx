"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ImageViewerProps {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export function ImageViewer({ src, alt = "Image", open, onClose }: ImageViewerProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const initialDistance = useRef<number | null>(null);
  const initialScale = useRef(1);
  const lastPan = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const reset = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    initialDistance.current = null;
    initialScale.current = 1;
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, reset]);

  const getDistance = (t1: React.Touch, t2: React.Touch) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches[0], e.touches[1]);
      initialScale.current = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      isDragging.current = true;
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance.current !== null) {
      e.preventDefault();
      const dist = getDistance(e.touches[0], e.touches[1]);
      const newScale = Math.min(Math.max(initialScale.current * (dist / initialDistance.current), 1), 5);
      setScale(newScale);
      if (newScale === 1) setTranslate({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging.current && scale > 1) {
      e.preventDefault();
      const dx = e.touches[0].clientX - lastPan.current.x;
      const dy = e.touches[0].clientY - lastPan.current.y;
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialDistance.current = null;
    }
    if (e.touches.length === 0) {
      isDragging.current = false;
    }
  };

  // Double-tap to zoom/reset
  const lastTap = useRef(0);
  const handleTap = (e: React.TouchEvent) => {
    if (e.touches.length > 0) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (scale > 1) {
        reset();
      } else {
        setScale(2.5);
      }
    }
    lastTap.current = now;
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      onClick={(e) => {
        if (e.target === e.currentTarget && scale <= 1) onClose();
      }}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/80"
        aria-label="Close image viewer"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div
        className="h-full w-full touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          handleTouchEnd(e);
          handleTap(e);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="h-full w-full object-contain transition-transform duration-100"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
