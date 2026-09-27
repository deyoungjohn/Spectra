// apps/backend/src/index.ts
//
// Spectra Backend server runner.

import { createApp, createServices } from "./app.js";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const services = createServices(process.env);
const app = createApp(services);

const server = app.listen(port, () => {
  console.log(`[Spectra Backend] running on http://localhost:${port}`);
});

services.wsManager?.init(server);

export { app, services, server };

