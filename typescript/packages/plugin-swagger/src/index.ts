import { defineDkgPlugin } from "@dkg/plugins";
import { swaggerUI } from "@hono/swagger-ui";
import { openAPISpecs } from "hono-openapi";

export default defineDkgPlugin((ctx, _mcp, api) => {
  api.get(
    "/openapi",
    openAPISpecs(api, {
      documentation: {
        info: {
          title: "DKG API",
          version: ctx.version,
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
