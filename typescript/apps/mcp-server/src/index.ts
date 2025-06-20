import { createPluginApi, defineDkgPlugin } from "@dkg/plugins";
import examplePlugin from "@dkg/plugin-example";
import { serve } from "@hono/node-server";
import { openAPISpecs } from "hono-openapi";
import { swaggerUI } from "@hono/swagger-ui";

import { version } from "../package.json";

const swaggerPlugin = defineDkgPlugin((_, __, api) => {
  api.get(
    "/openapi",
    openAPISpecs(api, {
      documentation: {
        info: {
          title: "DKG API",
          version: version,
          description: "DKG plugins API",
        },
        servers: [
          {
            url: "http://localhost:9200",
            description: "Local server",
          },
        ],
      },
    }),
  );
  api.get("/swagger", swaggerUI({ url: "/openapi" }));
});

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
