"use client";

import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef, useEffect, useRef } from "react";

type TextareaAutoProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextareaAuto = forwardRef<HTMLTextAreaElement, TextareaAutoProps>(
  ({ className, onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const setRef = (el: HTMLTextAreaElement | null) => {
      internalRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    };

    const resize = () => {
      const el = internalRef.current;
      if (el) {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      }
    };

    useEffect(() => {
      resize();
    });

    return (
      <textarea
        ref={setRef}
        className={cn(
          "w-full resize-none bg-transparent text-foreground placeholder:text-muted focus:outline-none",
          className
        )}
        onChange={(e) => {
          resize();
          onChange?.(e);
        }}
        {...props}
      />
    );
  }
);

TextareaAuto.displayName = "TextareaAuto";
