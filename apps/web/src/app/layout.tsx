// apps/web/src/app/layout.tsx
import React from "react";

export const metadata = {
  title: "Spectra | Tokenized Equities Intelligence Terminal",
  description:
    "Empirically-grounded intelligence terminal for tokenized equities on BNB Smart Chain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#0D0E12", // Deep space black (§11)
          color: "#FFFFFF",
          fontFamily: "'Inter', sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top Navigation Bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            height: "56px",
            backgroundColor: "#16181D",
            borderBottom: "1px solid #23272E",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color: "#F0B90B", // Binance Yellow
                  fontWeight: 900,
                  fontSize: "20px",
                  letterSpacing: "1px",
                }}
              >
                SPECTRA
              </span>
              <span
                style={{
                  fontSize: "10px",
                  padding: "1px 5px",
                  borderRadius: "3px",
                  backgroundColor: "rgba(240, 185, 11, 0.15)",
                  color: "#F0B90B",
                  fontWeight: 700,
                }}
              >
                BSC
              </span>
            </div>

            <nav style={{ display: "flex", gap: "16px", fontSize: "13px" }}>
              <span style={{ color: "#F0B90B", fontWeight: 600, cursor: "pointer" }}>
                Market Intel
              </span>
              <span style={{ color: "#848E9C", cursor: "pointer" }}>
                Flow Radar
              </span>
              <span style={{ color: "#848E9C", cursor: "pointer" }}>
                Strategy Forge
              </span>
              <span style={{ color: "#848E9C", cursor: "pointer" }}>
                Proofs & Vault
              </span>
            </nav>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "16px",
                backgroundColor: "#1E2329",
                border: "1px solid #2B313A",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#0ECB81",
                }}
              />
              <span style={{ color: "#EAECEF", fontWeight: 500 }}>BNB Chain 56</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1 }}>{children}</main>

        {/* Bottom Bar (§11) */}
        <footer
          style={{
            padding: "8px 24px",
            backgroundColor: "#16181D",
            borderTop: "1px solid #23272E",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "#5E6673",
          }}
        >
          <div>
            Spectra Terminal • Empirical Oracle Divergence Engine • Base Layer: Normalization & Fixed-Point v1.0
          </div>
          <div>Gas: 3 Gwei • block time: 3.0s • contracts verified</div>
        </footer>
      </body>
    </html>
  );
}
