import { defineDkgPlugin } from "@dkg/plugins";
import swaggerUI from "swagger-ui-express";
import type { OpenAPIV3 } from "openapi-types";

export default ({
  version,
  servers,
  components,
  security,
}: {
  version: string;
  servers?: OpenAPIV3.ServerObject[];
  components?: OpenAPIV3.ComponentsObject;
  security?: OpenAPIV3.SecurityRequirementObject[];
}) =>
  defineDkgPlugin((ctx, _mcp, api) => {
    api.get("/openapi", (req, res) => {
      res.json({
        openapi: "3.0.0",
        info: {
          title: "DKG API",
          version: version,
          description: "DKG plugins API",
        },
        servers,
        components,
        security,
      });
    });
    api.use("/swagger", swaggerUI.serve);
    api.get(
      "/swagger",
      swaggerUI.setup(null, {
        swaggerOptions: {
          url: "/openapi",
        },
      }),
    );
  });
