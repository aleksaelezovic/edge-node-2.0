import { defineDkgPlugin } from "@dkg/plugins";
import { z } from "@dkg/plugins/helpers";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

export default defineDkgPlugin((ctx, mcp, api) => {
  mcp.registerTool(
    "upload",
    {
      title: "Upload File",
      description:
        "Upload a file to the MCP server that can later be accessed by other plugins through DKG context",
      inputSchema: {
        filename: z.string().describe("Filename"),
        fileBase64: z.string().describe("Base64 encoded file content"),
        mimeType: z.string().optional(),
      },
    },
    async ({ fileBase64, filename, mimeType }) => {
      const id = await ctx.blob.create(new Blob([fileBase64]), {
        name: filename,
        mimeType,
      });

      return {
        content: [
          {
            type: "text",
            text: "File was successfully uploaded with ID: " + id,
          },
        ],
      };
    },
  );

  mcp.registerResource(
    "blob",
    new ResourceTemplate("dkg-blob://{id}", { list: undefined }),
    {
      title: "Blob",
      description: "A blob resource",
    },
    async (uri) => {
      const blob = await ctx.blob.get(
        uri.toString().substring("dkg-blob://".length),
      );
      if (!blob) throw new Error("Resource not found");
      const text = await blob.data.text();

      return {
        contents: [{ uri: uri.toString(), text }],
      };
    },
  );

  api.post("/upload", () => {});

  api.get("/blob/:id", () => {});
});
