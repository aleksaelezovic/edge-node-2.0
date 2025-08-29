import { Readable, Writable } from "stream";
import consumers from "stream/consumers";
import { defineDkgPlugin } from "@dkg/plugins";
import { z } from "@dkg/plugins/helpers";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import multer from "multer";
import { Blob } from "buffer";

const upload = multer();

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
      const fileByteChars = atob(fileBase64);
      const fileByteNumbers = new Array(fileByteChars.length);
      for (let i = 0; i < fileByteChars.length; i++) {
        fileByteNumbers[i] = fileByteChars.charCodeAt(i);
      }
      const fileBytes = new Uint8Array(fileByteNumbers);
      const fileBlob = new Blob([fileBytes]);
      const { id } = await ctx.blob.create(fileBlob.stream(), {
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
      const text = await consumers.text(blob.data);

      return {
        contents: [{ uri: uri.toString(), text }],
      };
    },
  );

  api.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded");

    try {
      const { id } = await ctx.blob.create(
        Readable.toWeb(Readable.from(req.file.buffer)),
        {
          name: req.file.originalname,
          mimeType: req.file.mimetype,
        },
      );
      res
        .status(201)
        .json({ id, name: req.file.originalname, mimeType: req.file.mimetype });
    } catch (error) {
      console.error(error);
      res.status(500).send(`Failed to create blob: ${error}`);
    }
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

  api.put("/blob/:id", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded");

    try {
      await ctx.blob.put(
        req.params.id!,
        Readable.toWeb(Readable.from(req.file.buffer)),
        {
          name: req.file.originalname,
          mimeType: req.file.mimetype,
        },
      );
      res.status(200).send();
    } catch (error) {
      console.error(error);
      res.status(500).send(`Failed to update blob: ${error}`);
    }
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
