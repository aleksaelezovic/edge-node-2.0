import { DkgPlugin } from "@dkg/plugins";
import swaggerUI from "swagger-ui-express";
import type {
  ServerObject,
  SecuritySchemeObject,
  ReferenceObject,
} from "openapi3-ts/oas30";
import type { Express } from "express";

import { z } from "./z";
import { openAPIRoute } from "./openAPIRoute";
import { buildOpenAPIDocument, OpenAPIResponse } from "./openAPI";

export { openAPIRoute, z };
export type { OpenAPIResponse };

// TODO: Fix nested routes generation (./openAPI.ts)

export default ({
    globalResponses,
    version,
    servers,
    securitySchemes,
  }: {
    globalResponses?: Record<string, OpenAPIResponse>;
    version: string;
    servers?: ServerObject[];
    securitySchemes?: {
      [name: string]: SecuritySchemeObject | ReferenceObject;
    };
  }): DkgPlugin =>
  (ctx, _mcp, api) => {
    let openAPIDocument = {};
    try {
      openAPIDocument = buildOpenAPIDocument({
        openApiVersion: "3.0.0",
        routers: [(api as Express).router],
        globalResponses,
        securitySchemes,
        config: {
          info: {
            title: "DKG API",
            version: version,
            description: "DKG plugins API",
          },
          servers,
        },
      });
    } catch {
      // Expected to error (WIP)
    }
    api.get("/openapi", (_req, res) => {
      res.json(openAPIDocument);
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
  };
