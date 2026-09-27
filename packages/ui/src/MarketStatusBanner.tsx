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

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        backgroundColor: "#16181D",
        borderBottom: "1px solid #23272E",
        color: "#FFFFFF",
        fontFamily: "Inter, sans-serif",
        fontSize: "13px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: getStatusColor(),
            boxShadow: isOpen ? "0 0 8px #0ECB81" : "none",
          }}
        />
        <span style={{ fontWeight: 600, letterSpacing: "0.5px" }}>
          TRADFI US EQUITIES: {status}
        </span>
        {formattedOpenTime && !isOpen && (
          <span style={{ color: "#848E9C" }} suppressHydrationWarning>
            (Opens: {formattedOpenTime})
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {!dataFeedAvailable && (
          <span
            style={{
              backgroundColor: "rgba(246, 70, 93, 0.15)",
              color: "#F6465D",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            DATA FEED DELAYED (STALE CACHE ACTIVE)
          </span>
        )}
        {formattedUpdateTime && (
          <span style={{ color: "#5E6673", fontSize: "11px" }} suppressHydrationWarning>
            Updated: {formattedUpdateTime}
          </span>
        )}
      </div>
    </div>
  );
};
