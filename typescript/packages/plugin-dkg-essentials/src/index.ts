import { defineDkgPlugin } from "@dkg/plugins";
import { z } from "@dkg/plugins/helpers";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

export default defineDkgPlugin((ctx, mcp) => {
  const DKG_EXPLORER_BASE_URL =
    "https://dkg-testnet.origintrail.io/explore?ual=";

  async function publishJsonLdAsset(
    jsonldRaw: string,
    privacy: "private" | "public",
  ): Promise<{ ual: string | null; error: string | null }> {
    try {
      const jsonldParsed = JSON.parse(jsonldRaw);
      const wrapped = { [privacy]: jsonldParsed };
      const createAsset = await ctx.dkg.asset.create(wrapped, {
        epochsNum: 2,
        minimumNumberOfFinalizationConfirmations: 3,
        minimumNumberOfNodeReplications: 1,
      });
      const ual = createAsset?.UAL || null;
      return { ual, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return { ual: null, error };
    }
  }

  mcp.registerTool(
    "dkg-get",
    {
      title: "DKG Knowledge Asset get tool",
      description:
        "A tool for running a GET operation on OriginTrail Decentralized Knowledge Graph (DKG) and retrieving a specific Knowledge Asset by its UAL (Unique Asset Locator), taking the UAL as input.",
      inputSchema: { ual: z.string() },
    },
    async ({ ual }) => {
      const getAssetResult = await ctx.dkg.asset.get(ual);
      return {
        content: [
          { type: "text", text: JSON.stringify(getAssetResult, null, 2) },
        ],
      };
    },
  );

  mcp.registerResource(
    "dkg-knowledge-asset",
    new ResourceTemplate("dkg-knowledge://{ual}", { list: undefined }),
    {
      title: "DKG Knowledge Asset",
      description:
        "A resource for accessing Knowledge Assets on OriginTrail Decentralized Knowledge Graph (DKG).",
    },
    async (uri, { ual }) => {
      const getAssetResult = await ctx.dkg.asset.get(ual);
      return {
        contents: [
          { uri: uri.href, text: JSON.stringify(getAssetResult, null, 2) },
        ],
      };
    },
  );

  mcp.registerTool(
    "dkg-create",
    {
      title: "DKG Knowledge Asset create tool",
      description:
        "A tool for creating and publishing Knowledge Assets on OriginTrail Decentralized Knowledge Graph (DKG), taking either a single JSON-LD string or a single file path as input. Optionally, you can specify privacy as 'private' or 'public' (default: 'private').",
      inputSchema: {
        jsonld: z.string(),
        privacy: z.enum(["private", "public"]).optional().default("private"),
      },
    },
    async (input) => {
      if (!input.jsonld) {
        console.error("No JSON-LD content provided after file read.");
        throw new Error("No JSON-LD content provided.");
      }
      const privacy = input.privacy || "private";
      const { ual, error } = await publishJsonLdAsset(input.jsonld, privacy);
      if (error) {
        console.error("Error creating asset:", error);
        throw new Error("Failed to create asset: " + error);
      }

      const explorerLink = `${DKG_EXPLORER_BASE_URL}${ual}`;
      const response = `Knowledge Asset collection successfully created.\n\nUAL: ${ual}\nDKG Explorer link: ${explorerLink}`;
      console.log("Formatted response:", response);
      return {
        content: [{ type: "text", text: response }],
      };
    },
  );
});
