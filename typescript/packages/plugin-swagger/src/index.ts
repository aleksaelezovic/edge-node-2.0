import { defineDkgPlugin } from "@dkg/plugins";
import { openAPISpecs } from "@dkg/plugins/hono";
import { swaggerUI } from "@hono/swagger-ui";
import type { OpenAPIV3 } from "openapi-types";

export default ({
  version,
  servers,
}: {
  version: string;
  servers?: OpenAPIV3.ServerObject[];
}) =>
  defineDkgPlugin((ctx, _mcp, api) => {
    api.get(
      "/openapi",
      openAPISpecs(api, {
        documentation: {
          info: {
            title: "DKG API",
            version: version,
            description: "DKG plugins API",
          },
          servers,
        },
      }),
    );
    api.get("/swagger", swaggerUI({ url: "/openapi" }));
  });
