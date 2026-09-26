// apps/backend/src/integration.test.ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp, createServices } from "./app.js";
import { WebSocket } from "ws";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

describe("Phase 8 Integration: WebSockets, Telegram & Notifications", () => {
  it("GET /api/notifications returns recent notification log", async () => {
    const services = createServices();
    const app = createApp(services);

    // Fire test notification
    services.notificationService.notify({
      id: "test-notif-1",
      type: "SIGNAL_ALERT",
      channel: "all",
      title: "Test Divergence Alert",
      message: "TSLA is at 105 bps premium vs TradFi",
      ticker: "TSLA",
      severity: "WARNING",
      timestamp: Date.now(),
    });

    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
    expect(res.body.data[0].ticker).toBe("TSLA");
  });

  it("POST /api/telegram/command dispatches bot commands and returns formatted replies", async () => {
    const services = createServices();
    const app = createApp(services);

    const startRes = await request(app)
      .post("/api/telegram/command")
      .send({ command: "/start" });

    expect(startRes.status).toBe(200);
    expect(startRes.body.reply).toContain("Welcome to Spectra Terminal Bot");

    const signalsRes = await request(app)
      .post("/api/telegram/command")
      .send({ command: "/signals" });

    expect(signalsRes.status).toBe(200);
    expect(signalsRes.body.reply).toContain("Spectra");

    const statusRes = await request(app)
      .post("/api/telegram/command")
      .send({ command: "/status" });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.reply).toContain("Market Status");
  });

  it("SpectraWebSocketManager broadcasts real-time snapshot and notifications to clients", async () => {
    const services = createServices();
    const app = createApp(services);
    const server = createServer(app);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;

    const wsManager = services.wsManager;
    wsManager.init(server);

    const receivedMessages: unknown[] = [];
    const client = new WebSocket(`ws://localhost:${port}`);

    client.on("message", (data) => {
      receivedMessages.push(JSON.parse(data.toString()));
    });

    await new Promise<void>((resolve) => {
      client.on("open", () => {
        resolve();
      });
    });

    // Wait for snapshot
    await new Promise((r) => setTimeout(r, 50));

    expect(receivedMessages.length).toBeGreaterThan(0);
    expect((receivedMessages[0] as { type: string }).type).toBe("SNAPSHOT");

    // Send Ping
    client.send(JSON.stringify({ type: "PING" }));
    await new Promise((r) => setTimeout(r, 50));

    const pong = receivedMessages.find((m) => (m as { type: string }).type === "PONG");
    expect(pong).toBeDefined();

    // Trigger Notification broadcast
    services.notificationService.notify({
      id: "notif-ws-test",
      type: "TRADE_CONFIRMATION",
      channel: "websocket",
      title: "Trade Executed",
      message: "AAPL swap successful",
      ticker: "AAPL",
      severity: "INFO",
      timestamp: Date.now(),
    });

    await new Promise((r) => setTimeout(r, 50));
    const broadcasted = receivedMessages.find(
      (m) => (m as { type: string }).type === "NOTIFICATION"
    );
    expect(broadcasted).toBeDefined();

    client.close();
    wsManager.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("Telegram bot buffers and dispatches alert messages", async () => {
    const services = createServices();
    const bot = services.telegramBot;

    await bot.sendAlert({
      id: "tg-alert-1",
      type: "SIGNAL_ALERT",
      channel: "telegram",
      title: "Critical Divergence",
      message: "Ondo AAPL diverging 45 bps",
      ticker: "AAPL",
      severity: "CRITICAL",
      timestamp: Date.now(),
    });

    expect(bot.getSentAlertsCount()).toBeGreaterThan(0);
    const recent = bot.getRecentSentAlerts();
    expect(recent[0]?.message).toContain("Critical Divergence");
  });
});
