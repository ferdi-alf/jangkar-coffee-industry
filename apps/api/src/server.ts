/**
 * Entry point untuk pengembangan lokal.
 * Satu-satunya tempat listen() dipanggil, lihat catatan di src/app.ts.
 */
import "dotenv/config";

import { createApp } from "./app.js";

const port = Number(process.env.API_PORT ?? 4000);

createApp().listen(port, () => {
  console.log(`[@jangkar/api] listening on http://localhost:${port}`);
});
