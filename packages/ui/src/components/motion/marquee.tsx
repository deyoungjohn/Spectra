"use client";
// beui.dev/components/motion/marquee
import React, { Children, type ReactNode } from "react";
import { cn } from "../../lib/utils.js";

export interface MarqueeProps {
  children: ReactNode;
  direction?: "left" | "right";
  speed?: number;
  pauseOnHover?: boolean;
  gap?: string;
  className?: string;
  fade?: boolean;
}

export function Marquee({
  children,
  direction = "left",
  speed = 28,
  pauseOnHover = true,
  gap = "1.25rem",
  className,
  fade = true,
}: MarqueeProps) {
  const reverse = direction === "right";
  const items = Children.toArray(children);

  return (
    <div
      className={cn(
        "group relative flex overflow-hidden w-full",
        fade && "[mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]",
        className,
      )}
      style={{ gap } as React.CSSProperties}
    >
      {[0, 1].map((dup) => (
        <div
          key={dup}
          aria-hidden={dup === 1}
          style={{
            animationDuration: `${speed}s`,
            animationDirection: reverse ? "reverse" : "normal",
            display: "flex",
            flexShrink: 0,
            alignItems: "center",
            gap,
          }}
          className={cn(
            "flex shrink-0 items-center animate-marquee",
            pauseOnHover && "hover:[animation-play-state:paused]",
          )}
        >
          {items.map((child, i) => {
            if (dup === 1 && React.isValidElement(child)) {
              return (
                <div key={i} className="shrink-0 flex items-center">
                  {React.cloneElement(child as React.ReactElement<{ "data-testid"?: string }>, {
                    "data-testid": undefined,
                  })}
                </div>
              );
            }
            return (
              <div key={i} className="shrink-0 flex items-center">
                {child}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
