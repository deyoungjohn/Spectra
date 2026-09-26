// packages/ui/src/AnomalyFilters.tsx
import React from "react";

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
  const filters: Array<{ id: AnomalyFilterType; label: string; locked?: boolean }> = [
    { id: "ALL", label: "All Equities" },
    { id: "ORACLE_DIVERGENCE", label: "Oracle Divergence (>10 bps)" },
    {
      id: "WEEKEND_PREMIUM",
      label: "Weekend Premium (±100 bps)",
      locked: !weekendPremiumEnabled,
    },
    { id: "CROSS_PLATFORM_BASIS", label: "Cross-Platform Basis (>20 bps)" },
    { id: "RATIO_DRIFT", label: "Ratio Drift Alerts" },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        overflowX: "auto",
        padding: "8px 0",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {filters.map((f) => {
        const isActive = activeFilter === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            style={{
              padding: "6px 12px",
              borderRadius: "16px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              border: isActive ? "1px solid #F0B90B" : "1px solid #2B313A",
              backgroundColor: isActive ? "rgba(240, 185, 11, 0.12)" : "#16181D",
              color: isActive ? "#F0B90B" : "#848E9C",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            {f.label}
            {f.locked && (
              <span
                style={{
                  fontSize: "9px",
                  padding: "1px 4px",
                  borderRadius: "4px",
                  backgroundColor: "#2B313A",
                  color: "#787B86",
                }}
              >
                LOCKED
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
