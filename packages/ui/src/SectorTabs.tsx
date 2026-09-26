// packages/ui/src/SectorTabs.tsx
import React from "react";

export type SectorType = "ALL" | "MAG7" | "AI_CHIPS" | "ETFS" | "BUFFETT";

export interface SectorTabsProps {
  activeSector: SectorType;
  onSectorChange: (sector: SectorType) => void;
}

export const SectorTabs: React.FC<SectorTabsProps> = ({
  activeSector,
  onSectorChange,
}) => {
  const sectors: Array<{ id: SectorType; label: string; count?: string }> = [
    { id: "ALL", label: "All Tickers" },
    { id: "MAG7", label: "Magnificent 7" },
    { id: "AI_CHIPS", label: "AI Chips" },
    { id: "ETFS", label: "Index ETFs" },
    { id: "BUFFETT", label: "Buffett Portfolio" },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        borderBottom: "1px solid #23272E",
        padding: "0 4px",
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
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom: isActive ? "2px solid #F0B90B" : "2px solid transparent",
              color: isActive ? "#F0B90B" : "#848E9C",
              fontWeight: isActive ? 600 : 400,
              fontSize: "13px",
              cursor: "pointer",
              transition: "color 0.15s ease",
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
};
