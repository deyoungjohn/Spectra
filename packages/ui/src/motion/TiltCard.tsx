// packages/ui/src/motion/TiltCard.tsx
// Inspired by beui.dev/components/motion/tilt-card & DESIGN.md
"use client";

import React, { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from "motion/react";
import { SPRING_MOUSE } from "./ease.js";
import { useHoverCapable } from "./use-hover-capable.js";

export interface TiltCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  max?: number;
  glare?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function TiltCard({
  children,
  max = 8,
  glare = true,
  className,
  style,
  onClick,
  ...rest
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const enabled = !reduce && canHover;

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);

  const srx = useSpring(rx, SPRING_MOUSE);
  const sry = useSpring(ry, SPRING_MOUSE);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !enabled) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    ry.set((px - 0.5) * max);
    rx.set((0.5 - py) * max);
    gx.set(px * 100);
    gy.set(py * 100);
  };

  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  const transform = useMotionTemplate`perspective(1000px) rotateX(${srx}deg) rotateY(${sry}deg)`;
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(240, 185, 11, 0.12), transparent 60%)`;

  return (
    <motion.div
      {...rest}
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.985, transition: { duration: 0.1 } }}
      style={{
        transform: enabled ? transform : undefined,
        transformStyle: "preserve-3d",
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
      className={className}
    >
      {children}
      {glare && enabled ? (
        <motion.div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: glareBg,
            pointerEvents: "none",
            borderRadius: "inherit",
          }}
        />
      ) : null}
    </motion.div>
  );
}
