// apps/agent/src/index.ts
// Spectra Agent Layer Entry Point (§9)
// Provides the MCP Server, Agent Studio registration, and Agentic Wallet execution runtime.

import { SpectraMcpServer, SPECTRA_TOOLS } from "./mcp-server.js";

export { SpectraMcpServer, SPECTRA_TOOLS };

export async function main() {
  const server = new SpectraMcpServer();
  await server.startStdio();
}

if (process.argv[1] && (process.argv[1].endsWith("index.js") || process.argv[1].endsWith("index.ts"))) {
  main().catch((err) => {
    console.error("Spectra Agent MCP Server encountered fatal error:", err);
    process.exit(1);
  });
}
