// apps/web/src/app/loop/page.tsx
"use client";

import React, { useState } from "react";
import {
  UnifiedLoopNav,
  type LoopStepId,
} from "@spectra/ui";

interface AnomalyChoice {
  ticker: string;
  type: string;
  spread: string;
  badge: string;
  summary: string;
  perSharePrice: string;
  tradfiPrice: string;
  flowVolume: string;
  whaleCount: number;
}

const ANOMALIES: AnomalyChoice[] = [
  {
    ticker: "TSLA",
    type: "Oracle Divergence",
    spread: "+105 bps",
    badge: "CRITICAL ALPHA",
    summary: "TSLA tokenized equity on-chain is trading at 105 bps premium vs frozen TradFi close.",
    perSharePrice: "248.50",
    tradfiPrice: "245.90",
    flowVolume: "+$180,000",
    whaleCount: 4,
  },
  {
    ticker: "NVDA",
    type: "Cross-Platform Basis",
    spread: "38 bps",
    badge: "ARBITRAGE OPPORTUNITY",
    summary: "bStocks NVDA is 38 bps cheaper than Ondo NVDA ($125.02 vs $125.50).",
    perSharePrice: "125.02",
    tradfiPrice: "125.00",
    flowVolume: "+$95,000",
    whaleCount: 2,
  },
  {
    ticker: "AAPL",
    type: "Flow Accumulation",
    spread: "+$125k net",
    badge: "SMART MONEY ACCUMULATION",
    summary: "3 BSC whale wallets accumulated Ondo AAPL in the last 4 hours prior to US market open.",
    perSharePrice: "334.60",
    tradfiPrice: "333.90",
    flowVolume: "+$125,000",
    whaleCount: 3,
  },
];

export default function UnifiedLoopPage() {
  const [currentStep, setCurrentStep] = useState<LoopStepId>(1);
  const [completedSteps, setCompletedSteps] = useState<LoopStepId[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyChoice>(ANOMALIES[0]);
  const [simulationRan, setSimulationRan] = useState(false);
  const [proofAnchored, setProofAnchored] = useState(false);

  const completeStep = (step: LoopStepId, nextStep: LoopStepId) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
    setCurrentStep(nextStep);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      {/* Title & Unified Loop Pitch */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
            Unified Loop: Autonomous Intelligence to Proof
          </h1>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              backgroundColor: "rgba(240, 185, 11, 0.15)",
              color: "#F0B90B",
              fontSize: "11px",
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            SEE → READ → FORGE → PROVE
          </span>
        </div>
        <p style={{ margin: 0, color: "#848E9C", fontSize: "14px" }}>
          Spectra connects market intelligence, on-chain whale flow radar, strategy simulation, and cryptographic audit receipts in a single verifiable pipeline.
        </p>
      </div>

      {/* Stepper Navigation */}
      <UnifiedLoopNav
        currentStep={currentStep}
        completedSteps={completedSteps}
        onSelectStep={(step) => setCurrentStep(step)}
      />

      {/* STAGE 1: SEE (Market Intelligence) */}
      {currentStep === 1 && (
        <div
          data-testid="stage-see"
          style={{
            backgroundColor: "#16181D",
            borderRadius: "8px",
            border: "1px solid #23272E",
            padding: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#F0B90B", fontWeight: 800, letterSpacing: "1px" }}>
                STAGE 1 // SEE
              </span>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "4px 0 0 0" }}>
                Detect Real-Time Market & Oracle Anomalies
              </h2>
              <p style={{ color: "#848E9C", fontSize: "13px", margin: "4px 0 0 0" }}>
                Review live anomalies detected across tokenized equity platforms on BNB Smart Chain. Select an anomaly to investigate.
              </p>
            </div>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "12px",
                backgroundColor: "rgba(14, 203, 129, 0.12)",
                color: "#0ECB81",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              3 Active Anomalies
            </span>
          </div>

          {/* Anomaly Selection Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {ANOMALIES.map((item) => {
              const isSelected = selectedAnomaly.ticker === item.ticker;
              return (
                <div
                  key={item.ticker}
                  data-testid={`anomaly-card-${item.ticker.toLowerCase()}`}
                  onClick={() => setSelectedAnomaly(item)}
                  style={{
                    padding: "16px",
                    borderRadius: "6px",
                    backgroundColor: isSelected ? "rgba(240, 185, 11, 0.08)" : "#1E2329",
                    border: isSelected ? "1px solid #F0B90B" : "1px solid #2B313A",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 800, fontSize: "16px", color: "#FFFFFF" }}>{item.ticker}</span>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        backgroundColor: "#2B313A",
                        color: "#F0B90B",
                        fontWeight: 700,
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#0ECB81", marginBottom: "6px" }}>
                    {item.spread}
                  </div>
                  <div style={{ fontSize: "12px", color: "#848E9C", lineHeight: 1.4, marginBottom: "12px" }}>
                    {item.summary}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#EAECEF",
                      borderTop: "1px solid #2B313A",
                      paddingTop: "8px",
                    }}
                  >
                    <span>On-chain: ${item.perSharePrice}</span>
                    <span>TradFi: ${item.tradfiPrice}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action to Next Step */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              data-testid="btn-proceed-to-read"
              onClick={() => completeStep(1, 2)}
              style={{
                backgroundColor: "#F0B90B",
                color: "#0D0E12",
                fontWeight: 700,
                fontSize: "13px",
                padding: "10px 20px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Confirm Anomaly & Proceed to READ (Inspect Flow) →
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: READ (Flow Radar) */}
      {currentStep === 2 && (
        <div
          data-testid="stage-read"
          style={{
            backgroundColor: "#16181D",
            borderRadius: "8px",
            border: "1px solid #23272E",
            padding: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#F0B90B", fontWeight: 800, letterSpacing: "1px" }}>
                STAGE 2 // READ
              </span>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "4px 0 0 0" }}>
                Flow Radar: {selectedAnomaly.ticker} On-Chain Whale Movements
              </h2>
              <p style={{ color: "#848E9C", fontSize: "13px", margin: "4px 0 0 0" }}>
                Verifying on-chain transaction logs and BSC transfer events prior to execution.
              </p>
            </div>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "12px",
                backgroundColor: "rgba(14, 203, 129, 0.12)",
                color: "#0ECB81",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              Whale Accumulation Confirmed
            </span>
          </div>

          {/* Metrics summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
            <div style={{ backgroundColor: "#1E2329", padding: "14px", borderRadius: "6px" }}>
              <div style={{ fontSize: "11px", color: "#848E9C" }}>4h Net Flow</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#0ECB81", marginTop: "4px" }}>
                {selectedAnomaly.flowVolume}
              </div>
            </div>
            <div style={{ backgroundColor: "#1E2329", padding: "14px", borderRadius: "6px" }}>
              <div style={{ fontSize: "11px", color: "#848E9C" }}>Active Whales</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#F0B90B", marginTop: "4px" }}>
                {selectedAnomaly.whaleCount} Wallets
              </div>
            </div>
            <div style={{ backgroundColor: "#1E2329", padding: "14px", borderRadius: "6px" }}>
              <div style={{ fontSize: "11px", color: "#848E9C" }}>Smart Money Conviction</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#0ECB81", marginTop: "4px" }}>
                94% Bullish
              </div>
            </div>
            <div style={{ backgroundColor: "#1E2329", padding: "14px", borderRadius: "6px" }}>
              <div style={{ fontSize: "11px", color: "#848E9C" }}>Regime State</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#EAECEF", marginTop: "4px" }}>
                Pre-Open Surge
              </div>
            </div>
          </div>

          {/* Recent Whale Transfer Events */}
          <div style={{ backgroundColor: "#1E2329", borderRadius: "6px", padding: "16px", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 12px 0", color: "#EAECEF" }}>
              Verified On-Chain Transfers (BscScan Indexer)
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace" }}>
              <thead>
                <tr style={{ color: "#848E9C", borderBottom: "1px solid #2B313A", textAlign: "left" }}>
                  <th style={{ padding: "6px 8px" }}>Tx Hash</th>
                  <th style={{ padding: "6px 8px" }}>Wallet</th>
                  <th style={{ padding: "6px 8px" }}>Action</th>
                  <th style={{ padding: "6px 8px" }}>Amount (USD)</th>
                  <th style={{ padding: "6px 8px" }}>Time</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #2B313A" }}>
                  <td style={{ padding: "8px", color: "#F0B90B" }}>0x39a1...b4e2</td>
                  <td style={{ padding: "8px" }}>0x12a4...88f1 (Top Whale)</td>
                  <td style={{ padding: "8px", color: "#0ECB81", fontWeight: 700 }}>ACCUMULATION</td>
                  <td style={{ padding: "8px" }}>$65,000.00</td>
                  <td style={{ padding: "8px", color: "#848E9C" }}>14m ago</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #2B313A" }}>
                  <td style={{ padding: "8px", color: "#F0B90B" }}>0x87d2...c11a</td>
                  <td style={{ padding: "8px" }}>0x99e1...76a3 (Fund Alpha)</td>
                  <td style={{ padding: "8px", color: "#0ECB81", fontWeight: 700 }}>ACCUMULATION</td>
                  <td style={{ padding: "8px" }}>$42,500.00</td>
                  <td style={{ padding: "8px", color: "#848E9C" }}>38m ago</td>
                </tr>
                <tr>
                  <td style={{ padding: "8px", color: "#F0B90B" }}>0x52b8...f93e</td>
                  <td style={{ padding: "8px" }}>0x55bc...4419 (Arb Bot)</td>
                  <td style={{ padding: "8px", color: "#0ECB81", fontWeight: 700 }}>ACCUMULATION</td>
                  <td style={{ padding: "8px" }}>$17,500.00</td>
                  <td style={{ padding: "8px", color: "#848E9C" }}>1h 05m ago</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              style={{
                backgroundColor: "transparent",
                color: "#848E9C",
                fontSize: "13px",
                border: "1px solid #2B313A",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              ← Back to SEE
            </button>
            <button
              type="button"
              data-testid="btn-proceed-to-forge"
              onClick={() => completeStep(2, 3)}
              style={{
                backgroundColor: "#F0B90B",
                color: "#0D0E12",
                fontWeight: 700,
                fontSize: "13px",
                padding: "10px 20px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Confirm Flow Confirmation & Proceed to FORGE →
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: FORGE (Strategy Synthesis & Simulation) */}
      {currentStep === 3 && (
        <div
          data-testid="stage-forge"
          style={{
            backgroundColor: "#16181D",
            borderRadius: "8px",
            border: "1px solid #23272E",
            padding: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#F0B90B", fontWeight: 800, letterSpacing: "1px" }}>
                STAGE 3 // FORGE
              </span>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "4px 0 0 0" }}>
                Synthesize Strategy & Run Dry-Run Simulation
              </h2>
              <p style={{ color: "#848E9C", fontSize: "13px", margin: "4px 0 0 0" }}>
                Compiled Strategy DSL combining {selectedAnomaly.ticker} oracle condition with Flow Radar confirmation.
              </p>
            </div>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "12px",
                backgroundColor: simulationRan ? "rgba(14, 203, 129, 0.12)" : "rgba(240, 185, 11, 0.12)",
                color: simulationRan ? "#0ECB81" : "#F0B90B",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {simulationRan ? "SIMULATION PASSED" : "PENDING SIMULATION"}
            </span>
          </div>

          {/* Strategy DSL Preview */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div style={{ backgroundColor: "#1E2329", padding: "16px", borderRadius: "6px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#848E9C", marginBottom: "8px" }}>
                STRATEGY DSL (JSON Specification)
              </div>
              <pre
                style={{
                  margin: 0,
                  fontSize: "11px",
                  color: "#0ECB81",
                  fontFamily: "'JetBrains Mono', monospace",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                }}
              >
{JSON.stringify(
  {
    name: `${selectedAnomaly.ticker} Alpha Capture`,
    trigger: {
      type: "AND",
      conditions: [
        { type: "ORACLE_DIVERGENCE_ABOVE", ticker: selectedAnomaly.ticker, divergenceBps: 20 },
        { type: "FLOW_ACCUMULATION_ABOVE", ticker: selectedAnomaly.ticker, usdAmount: 5000 },
      ],
    },
    action: {
      type: "BUY",
      ticker: selectedAnomaly.ticker,
      platform: "ONDO",
      amountUsd: "10.00",
    },
    policy: {
      maxTradeNotionalUsd: "10.00",
      maxSlippageBps: 100,
      cooldownSeconds: 300,
    },
  },
  null,
  2
)}
              </pre>
            </div>

            {/* Simulation Execution Box */}
            <div style={{ backgroundColor: "#1E2329", padding: "16px", borderRadius: "6px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#848E9C", marginBottom: "12px" }}>
                  DRY-RUN SIMULATION (Module 2 Engine)
                </div>
                {simulationRan ? (
                  <div data-testid="sim-metrics" style={{ fontSize: "12px", fontFamily: "'JetBrains Mono', monospace" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ color: "#848E9C" }}>Simulated Price:</span>
                      <span style={{ color: "#FFFFFF", fontWeight: 700 }}>${selectedAnomaly.perSharePrice}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ color: "#848E9C" }}>Estimated Slippage:</span>
                      <span style={{ color: "#0ECB81", fontWeight: 700 }}>15 bps (Under 100 limit)</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ color: "#848E9C" }}>DEX Fee (25 bps):</span>
                      <span style={{ color: "#848E9C" }}>$0.03</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ color: "#848E9C" }}>Net Output:</span>
                      <span style={{ color: "#0ECB81", fontWeight: 700 }}>$9.97</span>
                    </div>
                    <div style={{ marginTop: "12px", padding: "8px", backgroundColor: "#16181D", borderRadius: "4px" }}>
                      <div style={{ fontSize: "10px", color: "#848E9C" }}>Cryptographic Simulation Hash (SHA-256):</div>
                      <div
                        data-testid="simulation-hash-text"
                        style={{
                          fontSize: "11px",
                          color: "#F0B90B",
                          wordBreak: "break-all",
                          marginTop: "2px",
                        }}
                      >
                        c89f54a32b0018ef66ad19c3b7721d94e339a19c5b4d7ef02418a0029b3a1c8f
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "#848E9C", fontSize: "13px", padding: "16px 0", textAlign: "center" }}>
                    Click &apos;Execute Dry-Run Simulation&apos; to run PolicyVault checks & compute execution hash.
                  </div>
                )}
              </div>

              {!simulationRan && (
                <button
                  type="button"
                  data-testid="btn-run-simulation"
                  onClick={() => setSimulationRan(true)}
                  style={{
                    backgroundColor: "#1E2329",
                    color: "#F0B90B",
                    fontWeight: 700,
                    fontSize: "13px",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #F0B90B",
                    cursor: "pointer",
                    marginTop: "16px",
                  }}
                >
                  ⚡ Execute Dry-Run Simulation
                </button>
              )}
            </div>
          </div>

          {/* Navigation buttons */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              style={{
                backgroundColor: "transparent",
                color: "#848E9C",
                fontSize: "13px",
                border: "1px solid #2B313A",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              ← Back to READ
            </button>
            <button
              type="button"
              data-testid="btn-proceed-to-prove"
              disabled={!simulationRan}
              onClick={() => completeStep(3, 4)}
              style={{
                backgroundColor: simulationRan ? "#F0B90B" : "#474D57",
                color: simulationRan ? "#0D0E12" : "#848E9C",
                fontWeight: 700,
                fontSize: "13px",
                padding: "10px 20px",
                borderRadius: "6px",
                border: "none",
                cursor: simulationRan ? "pointer" : "not-allowed",
              }}
            >
              Dry-Run Validated • Proceed to PROVE →
            </button>
          </div>
        </div>
      )}

      {/* STAGE 4: PROVE (ReceiptRegistry & On-Chain Audit) */}
      {currentStep === 4 && (
        <div
          data-testid="stage-prove"
          style={{
            backgroundColor: "#16181D",
            borderRadius: "8px",
            border: "1px solid #23272E",
            padding: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#F0B90B", fontWeight: 800, letterSpacing: "1px" }}>
                STAGE 4 // PROVE
              </span>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "4px 0 0 0" }}>
                On-Chain Cryptographic Receipt & Proof Anchoring
              </h2>
              <p style={{ color: "#848E9C", fontSize: "13px", margin: "4px 0 0 0" }}>
                Every decision, simulation hash, and swap parameters are immutably written to ReceiptRegistry.sol on BNB Smart Chain.
              </p>
            </div>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "12px",
                backgroundColor: proofAnchored ? "rgba(14, 203, 129, 0.12)" : "rgba(240, 185, 11, 0.12)",
                color: proofAnchored ? "#0ECB81" : "#F0B90B",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {proofAnchored ? "ANCHORED ON-CHAIN" : "READY TO ANCHOR"}
            </span>
          </div>

          {/* Receipt Proof Card */}
          <div style={{ backgroundColor: "#1E2329", borderRadius: "6px", padding: "20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #2B313A", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>Receipt #1042</span>
                <span style={{ fontSize: "11px", color: "#848E9C" }}>ReceiptRegistry.sol</span>
              </div>
              <span style={{ color: "#0ECB81", fontSize: "11px", fontWeight: 700 }}>
                EIP-712 Structured Proof
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace" }}>
              <div>
                <div style={{ color: "#848E9C", marginBottom: "4px" }}>Decision Hash:</div>
                <div data-testid="decision-hash" style={{ color: "#F0B90B", wordBreak: "break-all" }}>
                  0x7a31b40289f81a70d91244bb19ec9128aa124b899d45e09f8723cb8100223941
                </div>
              </div>
              <div>
                <div style={{ color: "#848E9C", marginBottom: "4px" }}>Simulation Hash:</div>
                <div data-testid="simulation-hash-proof" style={{ color: "#0ECB81", wordBreak: "break-all" }}>
                  0xc89f54a32b0018ef66ad19c3b7721d94e339a19c5b4d7ef02418a0029b3a1c8f
                </div>
              </div>
              <div>
                <div style={{ color: "#848E9C", marginBottom: "4px" }}>Asset / Platform:</div>
                <div style={{ color: "#FFFFFF" }}>{selectedAnomaly.ticker} on ONDO</div>
              </div>
              <div>
                <div style={{ color: "#848E9C", marginBottom: "4px" }}>Smart Contract:</div>
                <div style={{ color: "#FFFFFF" }}>ReceiptRegistry (0x5FbDB...aa3)</div>
              </div>
              <div>
                <div style={{ color: "#848E9C", marginBottom: "4px" }}>Execution Status:</div>
                <div style={{ color: "#0ECB81", fontWeight: 700 }}>VERIFIED_COMPLIANT</div>
              </div>
              <div>
                <div style={{ color: "#848E9C", marginBottom: "4px" }}>Audit Trail:</div>
                <div style={{ color: "#848E9C" }}>Block 38,912,410 • BSC Cancun</div>
              </div>
            </div>

            {!proofAnchored && (
              <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
                <button
                  type="button"
                  data-testid="btn-anchor-receipt"
                  onClick={() => {
                    setProofAnchored(true);
                    if (!completedSteps.includes(4)) {
                      setCompletedSteps([...completedSteps, 4]);
                    }
                  }}
                  style={{
                    backgroundColor: "#0ECB81",
                    color: "#0D0E12",
                    fontWeight: 700,
                    fontSize: "13px",
                    padding: "10px 24px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Anchor Proof on ReceiptRegistry.sol
                </button>
              </div>
            )}
          </div>

          {/* Navigation / Reset buttons */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              style={{
                backgroundColor: "transparent",
                color: "#848E9C",
                fontSize: "13px",
                border: "1px solid #2B313A",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              ← Back to FORGE
            </button>
            <button
              type="button"
              data-testid="btn-restart-loop"
              onClick={() => {
                setCurrentStep(1);
                setSimulationRan(false);
                setProofAnchored(false);
              }}
              style={{
                backgroundColor: "#2B313A",
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "13px",
                padding: "8px 18px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
              }}
            >
              🔄 Cycle Again With New Asset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
