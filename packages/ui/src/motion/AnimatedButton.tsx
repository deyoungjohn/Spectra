// packages/ui/src/motion/AnimatedButton.tsx
// From beui.dev/components/motion/button & DESIGN.md
"use client";

import React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { SPRING_PRESS } from "./ease.js";

export interface AnimatedButtonProps extends Omit<HTMLMotionProps<"button">, "children" | "style"> {
  variant?: "primary" | "secondary" | "gold" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function AnimatedButton({
  variant = "primary",
  size = "md",
  icon,
  children,
  style,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const reduce = useReducedMotion();

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "gold":
        return {
          backgroundColor: "#F0B90B",
          color: "#000000",
          fontWeight: 700,
          border: "1px solid #F0B90B",
          boxShadow: "0 4px 14px rgba(240, 185, 11, 0.25)",
        };
      case "secondary":
        return {
          backgroundColor: "#1E232B",
          color: "#FFFFFF",
          fontWeight: 600,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          color: "#848E9C",
          fontWeight: 500,
          border: "1px solid transparent",
        };
      case "danger":
        return {
          backgroundColor: "rgba(246, 70, 93, 0.15)",
          color: "#F6465D",
          fontWeight: 600,
          border: "1px solid rgba(246, 70, 93, 0.3)",
        };
      case "primary":
      default:
        return {
          backgroundColor: "#000000",
          color: "#FFFFFF",
          fontWeight: 600,
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case "sm":
        return { padding: "6px 12px", fontSize: "12px", height: "32px", borderRadius: "8px" };
      case "lg":
        return { padding: "12px 24px", fontSize: "15px", height: "48px", borderRadius: "14px" };
      case "md":
      default:
        return { padding: "9px 18px", fontSize: "14px", height: "40px", borderRadius: "10px" };
    }
  };

  return (
    <motion.button
      whileHover={reduce || disabled ? undefined : { y: -1.5, transition: { duration: 0.15 } }}
      whileTap={reduce || disabled ? undefined : { scale: 0.97 }}
      transition={SPRING_PRESS}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        fontFamily: "'Inter', sans-serif",
        outline: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </motion.button>
  );
}
