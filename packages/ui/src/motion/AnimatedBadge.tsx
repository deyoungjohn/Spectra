// packages/ui/src/motion/AnimatedBadge.tsx
// From beui.dev/components/motion/animated-badge & DESIGN.md
"use client";

import React from "react";
import { motion } from "motion/react";

export interface AnimatedBadgeProps {
  status?: "success" | "warning" | "error" | "info" | "neutral";
  label: string;
  pulse?: boolean;
  size?: "sm" | "md";
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedBadge({
  status = "info",
  label,
  pulse = false,
  size = "md",
  className,
  style,
}: AnimatedBadgeProps) {
  const getTheme = () => {
    switch (status) {
      case "success":
        return {
          bg: "rgba(14, 203, 129, 0.12)",
          border: "rgba(14, 203, 129, 0.3)",
          text: "#0ECB81",
          dot: "#0ECB81",
        };
      case "warning":
        return {
          bg: "rgba(240, 185, 11, 0.12)",
          border: "rgba(240, 185, 11, 0.3)",
          text: "#F0B90B",
          dot: "#F0B90B",
        };
      case "error":
        return {
          bg: "rgba(246, 70, 93, 0.12)",
          border: "rgba(246, 70, 93, 0.3)",
          text: "#F6465D",
          dot: "#F6465D",
        };
      case "info":
        return {
          bg: "rgba(13, 116, 206, 0.12)",
          border: "rgba(13, 116, 206, 0.3)",
          text: "#47C2FF",
          dot: "#0D74CE",
        };
      case "neutral":
      default:
        return {
          bg: "rgba(255, 255, 255, 0.06)",
          border: "rgba(255, 255, 255, 0.12)",
          text: "#B0B4BA",
          dot: "#848E9C",
        };
    }
  };

  const theme = getTheme();
  const isSm = size === "sm";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: isSm ? "2px 8px" : "4px 10px",
        borderRadius: "9999px",
        backgroundColor: theme.bg,
        border: `1px solid ${theme.border}`,
        fontSize: isSm ? "10px" : "11px",
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        color: theme.text,
        letterSpacing: "0.4px",
        userSelect: "none",
        ...style,
      }}
      className={className}
    >
      <span style={{ position: "relative", display: "flex", width: "6px", height: "6px" }}>
        {pulse && (
          <motion.span
            animate={{ scale: [1, 2, 2], opacity: [0.8, 0, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              backgroundColor: theme.dot,
            }}
          />
        )}
        <span
          style={{
            position: "relative",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: theme.dot,
          }}
        />
      </span>
      <span>{label}</span>
    </div>
  );
}
