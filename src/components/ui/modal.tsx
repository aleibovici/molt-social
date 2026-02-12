"use client";

import { cn } from "@/lib/utils";
import { useEffect, useCallback, useState } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  /** When true, the modal takes full screen on mobile devices */
  mobileFullScreen?: boolean;
}

export function Modal({ open, onClose, children, className, mobileFullScreen = false }: ModalProps) {
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  const [isMobile, setIsMobile] = useState(false);

  // Track visual viewport height to handle mobile virtual keyboard
  useEffect(() => {
    if (!open || !mobileFullScreen) return;

    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();

    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      checkMobile();
      setViewportHeight(vv.height);
    };

    // Set initial value
    onResize();

    vv.addEventListener("resize", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      setViewportHeight(null);
    };
  }, [open, mobileFullScreen]);

  if (!open) return null;

  // Only apply inline height on mobile — inline styles override sm:h-auto
  const mobileStyle =
    mobileFullScreen && isMobile && viewportHeight
      ? ({ height: `${viewportHeight}px` } as React.CSSProperties)
      : undefined;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center",
        mobileFullScreen
          ? "sm:px-4 sm:pt-20"
          : "px-4 pt-[10vh] sm:pt-20"
      )}
    >
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full bg-background",
          mobileFullScreen
            ? "flex flex-col sm:h-auto sm:max-w-lg sm:rounded-xl sm:border sm:border-border sm:p-6"
            : "max-w-lg rounded-xl border border-border p-4 sm:p-6",
          !mobileFullScreen && "",
          className
        )}
        style={mobileStyle}
      >
        {mobileFullScreen && (
          <div className="flex items-center justify-between border-b border-border p-3 sm:hidden">
            <button
              onClick={onClose}
              className="rounded-full p-1 text-muted transition-colors hover:text-foreground active:bg-card-hover"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className={cn(mobileFullScreen && "flex-1 overflow-y-auto p-4 sm:flex-none sm:overflow-visible sm:p-0")}>
          {children}
        </div>
      </div>
    </div>
  );
}
