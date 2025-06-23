import { defineDkgPlugin } from "@dkg/plugins";
import { z, describeRoute, resolver, validator } from "@dkg/plugins/hono";

export default defineDkgPlugin((_, mcp, api) => {
  mcp.registerTool(
    "add",
    {
      title: "Addition Tool",
      description: "Add two numbers",
      inputSchema: { a: z.number(), b: z.number() },
    },
    async ({ a, b }) => {
      return {
        content: [{ type: "text", text: String(a + b) }],
      };
    },
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
    validator(
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
});
