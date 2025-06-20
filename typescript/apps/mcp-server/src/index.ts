import { createPluginApi } from "@dkg/plugins";
import examplePlugin from "@dkg/plugin-example";
import swaggerPlugin from "@dkg/plugin-swagger";
import { serve } from "@hono/node-server";

import { version } from "../package.json";

const api = createPluginApi({
  name: "DKG API",
  version: version,
  plugins: [examplePlugin, swaggerPlugin],
  engineUrl: "http://localhost:8900",
});

const server = serve({
  fetch: api.fetch,
  port: 9200,
});
process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});
process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
