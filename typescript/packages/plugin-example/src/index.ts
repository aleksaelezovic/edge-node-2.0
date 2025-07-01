import { defineDkgPlugin } from "@dkg/plugins";
import { z } from "@dkg/plugins/helpers";

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

  api.get("/add", (req, res) => {
    const a = Number(req.query.a);
    const b = Number(req.query.b);
    if (Number.isNaN(a) || Number.isNaN(b)) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    res.json({ result: a + b });
  });
});
