import { createPluginApi } from "@dkg/plugins";
import examplePlugin from "@dkg/plugin-example";
import swaggerPlugin from "@dkg/plugin-swagger";
import { serve } from "@hono/node-server";
//@ts-expect-error No types for dkg.js ...
import DKG from "dkg.js";

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
  context: {
    dkg: new DKG({
      endpoint: "http://localhost",
      port: "8900",
      blockchain: {
        name: "hardhat1:31337",
      },
      maxNumberOfRetries: 300,
      frequency: 2,
      contentType: "all",
      nodeApiVersion: "/v1",
    }),
  },
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
