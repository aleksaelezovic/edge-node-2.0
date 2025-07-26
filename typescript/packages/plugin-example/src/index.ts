import { defineDkgPlugin } from "@dkg/plugins";
import { openAPIRoute, z } from "@dkg/plugin-swagger";

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
    openAPIRoute(
      {
        tag: "Example",
        summary: "Add two numbers",
        description: "Add two numbers",
        query: z.object({
          a: z.number({ coerce: true }).openapi({
            description: "First number",
            example: 2,
          }),
          b: z.number({ coerce: true }).openapi({
            description: "Second number",
            example: 3,
          }),
        }),
        response: {
          description: "Addition result",
          schema: z.object({
            result: z.number(),
          }),
        },
      },
      (req, res) => {
        const { a, b } = req.query;
        res.json({ result: a + b });
      },
    ),
  );
});
