// packages/ui/src/TickerTape.tsx
import React from "react";

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
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "36px",
        backgroundColor: "#16181D",
        borderTop: "1px solid #23272E",
        padding: "0 16px",
        fontSize: "11px",
        fontFamily: "'JetBrains Mono', monospace",
        color: "#848E9C",
        userSelect: "none",
        zIndex: 50,
      }}
    >
      {/* Left: Market Status & WS Pill */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        {/* Market Status */}
        <div
          data-testid="market-status-pill"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "2px 8px",
            borderRadius: "12px",
            backgroundColor: marketOpen
              ? "rgba(14, 203, 129, 0.12)"
              : "rgba(120, 123, 134, 0.12)",
            border: marketOpen ? "1px solid #0ECB81" : "1px solid #787B86",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: marketOpen ? "#0ECB81" : "#787B86",
              boxShadow: marketOpen ? "0 0 6px #0ECB81" : "none",
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
          gap: "16px",
          overflowX: "auto",
          padding: "0 16px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 800,
            color: "#F0B90B",
            letterSpacing: "0.5px",
            flexShrink: 0,
          }}
        >
          ACTIVE SIGNALS:
        </span>
        {displaySignals.map((sig) => {
          const isWarning = sig.severity === "WARNING" || sig.severity === "CRITICAL";
          return (
            <div
              key={sig.id}
              data-testid={`signal-pill-${sig.ticker.toLowerCase()}`}
              onClick={() => onSelectSignal?.(sig)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "2px 8px",
                borderRadius: "4px",
                backgroundColor: isWarning
                  ? "rgba(246, 70, 93, 0.12)"
                  : "#1E2329",
                border: isWarning ? "1px solid #F6465D" : "1px solid #2B313A",
                cursor: onSelectSignal ? "pointer" : "default",
                flexShrink: 0,
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
                  }}
                >
                  {sig.spreadBps}
                </span>
              )}
              <span
                style={{
                  color: "#848E9C",
                  fontSize: "10px",
                  maxWidth: "220px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {sig.message}
              </span>
            </div>
          );
        })}
      </div>

      {/* Right: Network Metrics & Timestamp */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
          fontSize: "10px",
        }}
      >
        <span>Gas: {gasGwei}</span>
        <span>•</span>
        <span>Block: 3.0s</span>
        <span>•</span>
        <span data-testid="last-updated">{lastUpdated}</span>
      </div>
    </div>
  );
};
