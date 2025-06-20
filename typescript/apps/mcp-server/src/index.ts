import { createPluginApi } from "@dkg/plugins";
import examplePlugin from "@dkg/plugin-example";
import swaggerPlugin from "@dkg/plugin-swagger";
import { serve } from "@hono/node-server";

import { version } from "../package.json";

const api = createPluginApi({
  name: "DKG API",
  version,
  plugins: [
    examplePlugin,
    swaggerPlugin({
      version,
      servers: [
        {
          url: "http://localhost:9200",
          description: "Local development server",
        },
      ],
    }),
  ],
  context: {},
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
