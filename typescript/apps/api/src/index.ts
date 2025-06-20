import { createPluginApi } from "@dkg/plugins";
import { serve } from "@hono/node-server";
import { z } from "zod";
import "zod-openapi/extend";
import { describeRoute, openAPISpecs } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { version } from "../package.json";
import { swaggerUI } from "@hono/swagger-ui";

const api = createPluginApi({
  name: "DKG API",
  version: version,
  plugins: [
    (_, mcp, api) => {
      mcp.registerTool(
        "add",
        {
          title: "Addition Tool",
          description: "Add two numbers",
          inputSchema: { a: z.number(), b: z.number() },
        },
        async ({ a, b }) => ({
          content: [{ type: "text", text: String(a + b) }],
        }),
      );

      api.get(
        "/add",
        describeRoute({
          description: "Add two numbers",
          responses: {
            200: {
              description: "Returns the result of the addition",
              content: {
                "application/json": {
                  schema: resolver(
                    z.object({ result: z.number().openapi({ example: 5 }) }),
                  ),
                },
              },
            },
          },
        }),
        zValidator(
          "query",
          z
            .object({
              a: z
                .number({ coerce: true })
                .openapi({ description: "First number", example: 3 }),
              b: z
                .number({ coerce: true })
                .openapi({ description: "Second number", example: 2 }),
            })
            .openapi({ ref: "Query" }),
        ),
        (c) => {
          const { a, b } = c.req.valid("query");
          return c.json({ result: a + b });
        },
      );
    },
    (_, __, api) => {
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
    },
  ],
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
