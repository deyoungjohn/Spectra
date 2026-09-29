// packages/ui/src/SectorTabs.tsx
import React from "react";
import { motion } from "motion/react";
import { SPRING_LAYOUT } from "./lib/ease.js";

export type SectorType = "ALL" | "MAG7" | "AI_CHIPS" | "ETFS" | "BUFFETT";

export interface SectorTabsProps {
  activeSector: SectorType;
  onSectorChange: (sector: SectorType) => void;
}

export const SectorTabs: React.FC<SectorTabsProps> = ({
  activeSector,
  onSectorChange,
}) => {
  const sectors: Array<{ id: SectorType; label: string; icon?: string }> = [
    { id: "ALL", label: "All Tickers", icon: "🌐" },
    { id: "MAG7", label: "Magnificent 7", icon: "⭐" },
    { id: "AI_CHIPS", label: "AI Chips", icon: "⚡" },
    { id: "ETFS", label: "Index ETFs", icon: "📊" },
    { id: "BUFFETT", label: "Buffett Portfolio", icon: "💎" },
  ];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px",
        backgroundColor: "rgba(22, 24, 29, 0.75)",
        backdropFilter: "blur(10px)",
        borderRadius: "10px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {sectors.map((s) => {
        const isActive = activeSector === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSectorChange(s.id)}
            style={{
              position: "relative",
              padding: "7px 14px",
              background: "transparent",
              border: "none",
              color: isActive ? "#F0B90B" : "#848E9C",
              fontWeight: isActive ? 600 : 500,
              fontSize: "13px",
              cursor: "pointer",
              borderRadius: "8px",
              outline: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.15s ease",
            }}
          >
            {isActive && (
              <motion.span
                layoutId="activeSectorPill"
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(240, 185, 11, 0.12)",
                  borderRadius: "8px",
                  border: "1px solid rgba(240, 185, 11, 0.35)",
                  boxShadow: "0 2px 8px rgba(240, 185, 11, 0.1)",
                  zIndex: 0,
                }}
                transition={SPRING_LAYOUT}
              />
            )}
            <span style={{ position: "relative", zIndex: 1, fontSize: "12px" }}>{s.icon}</span>
            <span style={{ position: "relative", zIndex: 1 }}>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
};
