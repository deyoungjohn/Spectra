// packages/ui/src/motion/AnimatedTabs.tsx
// From beui.dev/components/motion/tabs & DESIGN.md
"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { SPRING_LAYOUT } from "./ease.js";

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  layoutId?: string;
  variant?: "pill" | "segment";
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedTabs({
  tabs,
  activeTab,
  onChange,
  layoutId = "spectra-tab-pill",
  variant = "pill",
  accentColor = "#F0B90B",
  className,
  style,
}: AnimatedTabsProps) {
  const reduce = useReducedMotion();

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px",
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: variant === "pill" ? "9999px" : "12px",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        ...style,
      }}
      className={className}
    >
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(tab.id)}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 16px",
              borderRadius: variant === "pill" ? "9999px" : "8px",
              fontSize: "13px",
              fontWeight: isSelected ? 600 : 500,
              fontFamily: "'Inter', sans-serif",
              color: isSelected ? "#FFFFFF" : "#848E9C",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "color 0.15s ease",
              outline: "none",
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
          >
            {isSelected && (
              <motion.span
                layoutId={reduce ? undefined : layoutId}
                transition={SPRING_LAYOUT}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: variant === "pill" ? "9999px" : "8px",
                  backgroundColor: "#1E232B",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                  zIndex: 0,
                }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "9999px",
                    backgroundColor: isSelected ? "rgba(240, 185, 11, 0.2)" : "rgba(255, 255, 255, 0.08)",
                    color: isSelected ? accentColor : "#848E9C",
                  }}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "1px 5px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(240, 185, 11, 0.15)",
                    color: accentColor,
                    letterSpacing: "0.5px",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
