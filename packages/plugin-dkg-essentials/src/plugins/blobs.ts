import { Readable, Writable } from "stream";
import consumers from "stream/consumers";
import { defineDkgPlugin } from "@dkg/plugins";
import { z } from "@dkg/plugins/helpers";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import busboy from "busboy";

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
      const buffer = Buffer.from(fileBase64, "base64");
      const { id } = await ctx.blob.create(
        Readable.toWeb(Readable.from(buffer)),
        {
          name: filename,
          mimeType,
        },
      );

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
      const text = await consumers.text(blob.data);

      return {
        contents: [{ uri: uri.toString(), text }],
      };
    },
  );

  api.post("/upload", async (req, res) => {
    const bb = busboy({ headers: req.headers });
    bb.on("file", async (name, file, info) => {
      if (name !== "file") return res.status(400).send("Invalid file name");

      try {
        const { id } = await ctx.blob.create(Readable.toWeb(file), {
          name: info.filename,
          mimeType: info.mimeType,
        });
        res
          .status(201)
          .json({ id, name: info.filename, mimeType: info.mimeType });
      } catch (error) {
        console.error(error);
        res.status(500).send(`Failed to create blob: ${error}`);
      }
    });
    req.pipe(bb);
  });

  api.get("/blob/:id", async (req, res) => {
    const obj = await ctx.blob.get(req.params.id);
    if (!obj) return res.status(404).send("Blob not found");

    if (obj.metadata.mimeType) {
      res.setHeader("Content-Type", obj.metadata.mimeType);
    }
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${obj.metadata.name}"`,
    );
    res.status(200);

    return obj.data.pipeTo(Writable.toWeb(res));
  });

  api.put("/blob/:id", async (req, res) => {
    const bb = busboy({ headers: req.headers });
    bb.on("file", async (name, file, info) => {
      if (name !== "file") return res.status(400).send("Invalid file name");

      try {
        await ctx.blob.put(req.params.id, Readable.toWeb(file), {
          name: info.filename,
          mimeType: info.mimeType,
        });
        res.status(200).send();
      } catch (error) {
        console.error(error);
        res.status(500).send(`Failed to update blob: ${error}`);
      }
    });
    req.pipe(bb);
  });

  api.delete("/blob/:id", async (req, res) => {
    try {
      await ctx.blob.delete(req.params.id);
      res.status(200).send("Blob deleted successfully");
    } catch (error) {
      console.error(error);
      res.status(500).send(`Failed to delete blob: ${error}`);
    }
  });
});
