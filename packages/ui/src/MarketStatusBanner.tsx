// packages/ui/src/MarketStatusBanner.tsx
import React from "react";

export interface MarketStatusBannerProps {
  status: "OPEN" | "CLOSED" | "HALTED";
  isOpen: boolean;
  nextOpenTime?: string | null;
  dataFeedAvailable?: boolean;
  lastFetchTime?: string | null;
}

export const MarketStatusBanner: React.FC<MarketStatusBannerProps> = ({
  status,
  isOpen,
  nextOpenTime,
  dataFeedAvailable = true,
  lastFetchTime,
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const getStatusColor = () => {
    if (status === "HALTED") return "#F6465D"; // Critical red
    if (isOpen) return "#0ECB81"; // Vibrant green
    return "#787B86"; // Dim gray
  };

  const formattedOpenTime = React.useMemo(() => {
    if (!nextOpenTime || !mounted) return null;
    try {
      return new Date(nextOpenTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  }, [nextOpenTime, mounted]);

  const formattedUpdateTime = React.useMemo(() => {
    if (!lastFetchTime || !mounted) return null;
    try {
      return new Date(lastFetchTime).toLocaleTimeString();
    } catch {
      return null;
    }
  }, [lastFetchTime, mounted]);

  const statusColor = getStatusColor();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 24px",
        backgroundColor: "rgba(18, 20, 25, 0.65)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        color: "#FFFFFF",
        fontFamily: "Inter, sans-serif",
        fontSize: "13px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "3px 10px",
            borderRadius: "9999px",
            backgroundColor: isOpen ? "rgba(14, 203, 129, 0.1)" : "rgba(120, 123, 134, 0.12)",
            border: `1px solid ${isOpen ? "rgba(14, 203, 129, 0.3)" : "rgba(120, 123, 134, 0.25)"}`,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: statusColor,
              boxShadow: isOpen ? "0 0 10px #0ECB81" : "none",
            }}
          />
          <span style={{ fontWeight: 600, letterSpacing: "0.5px", fontSize: "11px", color: isOpen ? "#0ECB81" : "#A0A8B5" }}>
            TRADFI US EQUITIES: {status}
          </span>
        </div>

        {formattedOpenTime && !isOpen && (
          <span style={{ color: "#848E9C", fontSize: "12px" }} suppressHydrationWarning>
            (Opens: {formattedOpenTime})
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {!dataFeedAvailable && (
          <span
            style={{
              backgroundColor: "rgba(246, 70, 93, 0.15)",
              color: "#F6465D",
              border: "1px solid rgba(246, 70, 93, 0.3)",
              padding: "3px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span>⚠️</span>
            <span>DATA FEED DELAYED (STALE CACHE ACTIVE)</span>
          </span>
        )}
        {formattedUpdateTime && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#787B86",
              fontSize: "11px",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span
              style={{
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                backgroundColor: "#F0B90B",
              }}
            />
            <span suppressHydrationWarning>
              Updated: {formattedUpdateTime}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
