// packages/ui/src/TickerTape.tsx
import React from "react";
import { Marquee } from "./components/motion/marquee.js";

export interface TickerTapeSignal {
  id: string;
  ticker: string;
  type: string;
  spreadBps?: string;
  message: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  timestamp?: number;
}

export interface TickerTapeProps {
  signals?: TickerTapeSignal[];
  wsStatus?: "CONNECTED" | "CONNECTING" | "DISCONNECTED";
  marketOpen?: boolean;
  lastUpdated?: string;
  gasGwei?: string;
  onSelectSignal?: (signal: TickerTapeSignal) => void;
}

export const TickerTape: React.FC<TickerTapeProps> = ({
  signals = [],
  wsStatus = "CONNECTED",
  marketOpen = true,
  lastUpdated = "Just now",
  gasGwei = "3 Gwei",
  onSelectSignal,
}) => {
  const defaultSignals: TickerTapeSignal[] = [
    {
      id: "sig-tsla",
      ticker: "TSLA",
      type: "ORACLE_DIVERGENCE",
      spreadBps: "+105 bps",
      message: "TSLA on-chain at +105 bps premium vs TradFi close",
      severity: "WARNING",
    },
    {
      id: "sig-nvda",
      ticker: "NVDA",
      type: "CROSS_PLATFORM_BASIS",
      spreadBps: "38 bps",
      message: "bStocks NVDA is 38 bps cheaper than Ondo NVDA",
      severity: "INFO",
    },
    {
      id: "sig-aapl",
      ticker: "AAPL",
      type: "FLOW_ACCUMULATION",
      spreadBps: "+$125k",
      message: "3 BSC whale wallets accumulated Ondo AAPL in last 4h",
      severity: "INFO",
    },
    {
      id: "sig-mstr",
      ticker: "MSTR",
      type: "RATIO_DRIFT",
      spreadBps: "12 bps",
      message: "MSTR dividend multiplier drift detected",
      severity: "INFO",
    },
  ];

  const displaySignals = signals.length > 0 ? signals : defaultSignals;

  return (
    <div
      data-testid="ticker-tape"
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "40px",
        backgroundColor: "rgba(18, 20, 24, 0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "0 16px",
        fontSize: "11px",
        fontFamily: "'JetBrains Mono', monospace",
        color: "#848E9C",
        userSelect: "none",
        zIndex: 50,
      }}
    >
      {/* Left: Market Status & WS Pill */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        {/* Market Status */}
        <div
          data-testid="market-status-pill"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 10px",
            borderRadius: "9999px",
            backgroundColor: marketOpen
              ? "rgba(14, 203, 129, 0.12)"
              : "rgba(120, 123, 134, 0.12)",
            border: marketOpen
              ? "1px solid rgba(14, 203, 129, 0.35)"
              : "1px solid rgba(120, 123, 134, 0.35)",
            boxShadow: marketOpen ? "0 0 10px rgba(14, 203, 129, 0.1)" : "none",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: marketOpen ? "#0ECB81" : "#787B86",
              boxShadow: marketOpen ? "0 0 8px #0ECB81" : "none",
            }}
          />
          <span
            style={{
              color: marketOpen ? "#0ECB81" : "#787B86",
              fontWeight: 700,
              fontSize: "10px",
              letterSpacing: "0.5px",
            }}
          >
            {marketOpen ? "US MARKET OPEN" : "MARKET CLOSED (FROZEN)"}
          </span>
        </div>

        {/* WebSocket Status */}
        <div
          data-testid="ws-status-badge"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            borderRadius: "6px",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            color:
              wsStatus === "CONNECTED"
                ? "#0ECB81"
                : wsStatus === "CONNECTING"
                ? "#F0B90B"
                : "#F6465D",
            fontSize: "10px",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              backgroundColor: "currentColor",
              boxShadow: wsStatus === "CONNECTED" ? "0 0 6px rgba(14, 203, 129, 0.6)" : "none",
            }}
          />
          <span>WS: {wsStatus}</span>
        </div>
      </div>

      {/* Middle: Signals Marquee / Feed */}
      <div
        data-testid="signals-stream"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flex: 1,
          margin: "0 16px",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 800,
            color: "#F0B90B",
            letterSpacing: "0.5px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>⚡</span>
          <span>SIGNALS:</span>
        </span>
        <Marquee speed={32} pauseOnHover gap="12px" className="flex-1">
          {displaySignals.map((sig) => {
            const isWarning = sig.severity === "WARNING" || sig.severity === "CRITICAL";
            return (
              <div
                key={sig.id}
                data-testid={`signal-pill-${sig.ticker.toLowerCase()}`}
                onClick={() => onSelectSignal?.(sig)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "3px 10px",
                  borderRadius: "6px",
                  backgroundColor: isWarning
                    ? "rgba(246, 70, 93, 0.12)"
                    : "rgba(30, 35, 41, 0.8)",
                  border: isWarning
                    ? "1px solid rgba(246, 70, 93, 0.35)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  cursor: onSelectSignal ? "pointer" : "default",
                  transition: "all 0.15s ease",
                }}
              >
                <span
                  style={{
                    fontWeight: 800,
                    color: isWarning ? "#F6465D" : "#F0B90B",
                  }}
                >
                  {sig.ticker}
                </span>
                {sig.spreadBps && (
                  <span
                    style={{
                      color: isWarning ? "#F6465D" : "#0ECB81",
                      fontWeight: 600,
                      backgroundColor: "rgba(0,0,0,0.2)",
                      padding: "1px 4px",
                      borderRadius: "3px",
                    }}
                  >
                    {sig.spreadBps}
                  </span>
                )}
                <span
                  style={{
                    color: "#A0A8B5",
                    fontSize: "10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sig.message}
                </span>
              </div>
            );
          })}
        </Marquee>
      </div>

      {/* Right: Network Metrics & Timestamp */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
          fontSize: "10px",
        }}
      >
        <span style={{ color: "#EAECEF", backgroundColor: "rgba(255,255,255,0.04)", padding: "2px 6px", borderRadius: "4px" }}>
          Gas: {gasGwei}
        </span>
        <span style={{ color: "#5E6673" }}>•</span>
        <span style={{ color: "#848E9C" }}>Block: 3.0s</span>
        <span style={{ color: "#5E6673" }}>•</span>
        <span data-testid="last-updated" style={{ color: "#F0B90B" }}>{lastUpdated}</span>
      </div>
    </div>
  );
};
