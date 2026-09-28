// packages/ui/src/SectorTabs.tsx
"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { SPRING_LAYOUT, SPRING_PRESS } from "./motion/ease.js";

export type SectorType = "ALL" | "MAG7" | "AI_CHIPS" | "ETFS" | "BUFFETT";

export interface SectorTabsProps {
  activeSector: SectorType;
  onSectorChange: (sector: SectorType) => void;
}

export const SectorTabs: React.FC<SectorTabsProps> = ({
  activeSector,
  onSectorChange,
}) => {
  const reduce = useReducedMotion();
  const sectors: Array<{ id: SectorType; label: string }> = [
    { id: "ALL", label: "All Tickers" },
    { id: "MAG7", label: "Magnificent 7" },
    { id: "AI_CHIPS", label: "AI Chips" },
    { id: "ETFS", label: "Index ETFs" },
    { id: "BUFFETT", label: "Buffett Portfolio" },
  ];

  return (
    <div
      role="tablist"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px",
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "9999px",
        fontFamily: "'Inter', sans-serif",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {sectors.map((s) => {
        const isActive = activeSector === s.id;
        return (
          <motion.button
            key={s.id}
            role="tab"
            aria-selected={isActive}
            whileTap={reduce ? undefined : { scale: 0.96 }}
            transition={SPRING_PRESS}
            onClick={() => onSectorChange(s.id)}
            style={{
              position: "relative",
              padding: "7px 16px",
              background: "none",
              border: "none",
              borderRadius: "9999px",
              color: isActive ? "#FFFFFF" : "#848E9C",
              fontWeight: isActive ? 600 : 500,
              fontSize: "13px",
              cursor: "pointer",
              outline: "none",
              whiteSpace: "nowrap",
              transition: "color 0.15s ease",
            }}
          >
            {isActive && (
              <motion.span
                layoutId={reduce ? undefined : "active-sector-indicator"}
                transition={SPRING_LAYOUT}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "9999px",
                  backgroundColor: "#1E232B",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.35)",
                  zIndex: 0,
                }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>{s.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};
