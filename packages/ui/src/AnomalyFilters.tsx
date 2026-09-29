// packages/ui/src/AnomalyFilters.tsx
import React from "react";
import { motion } from "motion/react";
import { SPRING_PRESS } from "./lib/ease.js";

export type AnomalyFilterType =
  | "ALL"
  | "ORACLE_DIVERGENCE"
  | "WEEKEND_PREMIUM"
  | "CROSS_PLATFORM_BASIS"
  | "RATIO_DRIFT";

export interface AnomalyFiltersProps {
  activeFilter: AnomalyFilterType;
  onFilterChange: (filter: AnomalyFilterType) => void;
  weekendPremiumEnabled?: boolean;
}

export const AnomalyFilters: React.FC<AnomalyFiltersProps> = ({
  activeFilter,
  onFilterChange,
  weekendPremiumEnabled = false,
}) => {
  const filters: Array<{ id: AnomalyFilterType; label: string; locked?: boolean; badge?: string }> = [
    { id: "ALL", label: "All Equities" },
    { id: "ORACLE_DIVERGENCE", label: "Oracle Divergence (>10 bps)", badge: "10 bps" },
    {
      id: "WEEKEND_PREMIUM",
      label: "Weekend Premium (±100 bps)",
      locked: !weekendPremiumEnabled,
    },
    { id: "CROSS_PLATFORM_BASIS", label: "Cross-Platform Basis (>20 bps)", badge: "Basis" },
    { id: "RATIO_DRIFT", label: "Ratio Drift Alerts", badge: "Drift" },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        overflowX: "auto",
        padding: "6px 0",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {filters.map((f) => {
        const isActive = activeFilter === f.id;
        return (
          <motion.button
            key={f.id}
            whileTap={{ scale: 0.96 }}
            transition={SPRING_PRESS}
            onClick={() => onFilterChange(f.id)}
            style={{
              padding: "6px 14px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              border: isActive
                ? "1px solid rgba(240, 185, 11, 0.5)"
                : "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: isActive
                ? "rgba(240, 185, 11, 0.12)"
                : "rgba(22, 24, 29, 0.65)",
              color: isActive ? "#F0B90B" : "#848E9C",
              boxShadow: isActive ? "0 0 12px rgba(240, 185, 11, 0.1)" : "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              backdropFilter: "blur(8px)",
              transition: "border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease",
            }}
          >
            <span>{f.label}</span>
            {f.locked && (
              <span
                style={{
                  fontSize: "9px",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#787B86",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                }}
              >
                LOCKED
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
