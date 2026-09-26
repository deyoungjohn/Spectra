// apps/backend/src/websocket.ts
// WebSocket Server for real-time dashboard updates (Spectra.md §5.7)

import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "node:http";
import type { BackendServices } from "./app.js";
import type { SpectraNotification } from "@spectra/core";

export interface SpectraWsMessage {
  type: "NOTIFICATION" | "SIGNAL" | "MARKET_STATUS" | "TICK" | "PONG" | "SNAPSHOT";
  payload: unknown;
  timestamp: number;
}

export class SpectraWebSocketManager {
  private wss?: WebSocketServer;
  private readonly clients = new Set<WebSocket>();
  private readonly services: BackendServices;
  private unsubscribeNotif?: () => void;

  constructor(services: BackendServices) {
    this.services = services;
  }

  /**
   * Initializes WebSocket server attached to an existing HTTP server or standalone port.
   */
  public init(server?: HttpServer, port?: number): WebSocketServer {
    this.wss = server ? new WebSocketServer({ server }) : new WebSocketServer({ port: port ?? 4001 });

    this.wss.on("connection", (ws: WebSocket) => {
      this.clients.add(ws);

      // Send initial snapshot on connect
      const snapshot: SpectraWsMessage = {
        type: "SNAPSHOT",
        payload: {
          activeSignals: this.services.signalEngine.getActiveSignals().map((s) => ({
            id: s.id,
            type: s.type,
            ticker: s.ticker,
            severity: s.severity,
            value: s.value.toString(),
            timestamp: s.timestamp.toISOString(),
          })),
          recentNotifications: this.services.notificationService?.getRecent(10) ?? [],
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      };

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(snapshot));
      }

      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString()) as { type?: string };
          if (msg.type === "PING") {
            ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
          } else if (msg.type === "GET_SNAPSHOT") {
            ws.send(JSON.stringify(snapshot));
          }
        } catch {
          // Ignore invalid client messages
        }
      });

      ws.on("close", () => {
        this.clients.delete(ws);
      });

      ws.on("error", () => {
        this.clients.delete(ws);
      });
    });

    // Hook into NotificationService
    if (this.services.notificationService) {
      this.unsubscribeNotif = this.services.notificationService.onNotification(
        (notification: SpectraNotification) => {
          this.broadcast("NOTIFICATION", notification);
        }
      );
    }

    return this.wss;
  }

  /**
   * Broadcasts a typed message to all connected WebSocket clients.
   */
  public broadcast(type: SpectraWsMessage["type"], payload: unknown): void {
    const msg = JSON.stringify({
      type,
      payload,
      timestamp: Date.now(),
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(msg);
        } catch {
          this.clients.delete(client);
        }
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  public close(): void {
    if (this.unsubscribeNotif) {
      this.unsubscribeNotif();
    }
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();
    this.wss?.close();
  }
}
