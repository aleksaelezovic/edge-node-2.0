import { defineDkgPlugin } from "@dkg/plugins";
import { openAPIRoute, z } from "@dkg/plugin-swagger";
import { chromium, Browser, BrowserContext, Page } from "playwright";
import * as cheerio from "cheerio";
import { DataFactory, Writer, Quad, Parser } from "n3";
import * as jsonld from "jsonld";
import * as fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { ChatOpenAI } from "@langchain/openai";



export type DownloadPageContentOptions = {
  url: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  timeoutMs?: number;
  headers?: Record<string, string>;
  userAgent?: string;
  javascriptEnabled?: boolean;
};

export type DownloadedPageContent = {
  initialUrl: string;
  finalUrl: string;
  status: number | null;
  content: string;
  contentType: string | null;
};

export async function downloadPageContent(
  options: DownloadPageContentOptions,
): Promise<[DownloadedPageContent, string[]]> {
  const {
    url,
    waitUntil = "networkidle",
    timeoutMs,
    headers,
    userAgent,
    javascriptEnabled = true,
  } = options;
  
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  let page: Page | undefined;
  
  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      userAgent,
      extraHTTPHeaders: headers,
      javaScriptEnabled: javascriptEnabled,
    });
    page = await context.newPage();
    if (typeof timeoutMs === "number") {
      page.setDefaultNavigationTimeout(timeoutMs);
    }
    
    const response = await page.goto(url, { waitUntil });
    const content = await page.content();
    
    const status = response ? response.status() : null;
    const finalUrl = response ? response.url() : page.url();
    const contentType = response ? response.headers()["content-type"] ?? null : null;

    // Extract absolute links from the page content
    const $ = cheerio.load(content);
    const linksSet = new Set<string>();
    $("a[href]").each((_, el) => {
      const href = ($(el).attr("href") || "").trim();
      if (!href) return;
      try {
        const abs = new URL(href, finalUrl).toString();
        if (abs.startsWith("http://") || abs.startsWith("https://")) {
          linksSet.add(abs);
        }
      } catch {}
    });
    const links = Array.from(linksSet);

    return [
      {
        initialUrl: url,
        finalUrl,
        status,
        content,
        contentType,
      },
      links,
    ];
  } finally {
    try {
      if (context) {
        await context.close();
      }
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

// TODO: This is currently unused - and ideally is not used if needed
const llm = new ChatOpenAI({
  model: "gpt-5",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

async function neuralReasoning(jsonLd: any,reasoningType: string): Promise<any> {
  //TODO: currently unused - use this function later to expand the JSON-LD with neural reasoning after download. 
  //TODO: implement symbolic reasoner into ctx, so that we can use it here as well
  if(reasoningType === "neural" || reasoningType === "neurosymbolic"){
    // Create a comprehensive system prompt for JSON-LD conversion
    const systemPrompt = `You are an expert in enriching JSON-LD (JSON for Linked Data) with additional information. Your task is to enrich the JSON-LD with additional information that you infer from the content of the JSON-LD.
    
    Key requirements:
    0. Do not remove any existing information from the JSON-LD.
    1. Always include a proper @context that defines the vocabulary and namespaces.
    2. Use appropriate @type properties to specify the class/type of entities
    3. Ensure all properties have semantic meaning and are properly linked
    4. Follow JSON-LD best practices for structuring data
    5. Make the output valid and parseable JSON-LD
    6. If a custom context is provided, use it; otherwise, create an appropriate one
    7. If a custom type is provided, use it as the main entity type
    8. Use the ontologies provided below to enrich the JSON-LD, and if not provided, use the most applicable ontologies such as schema.org, dcterms.org, etc.
    
    The output should be valid JSON-LD that can be used for:
    - Semantic web applications
    - Knowledge graphs
    - Machine learning and AI systems
    - Data interoperability
    
    Return ONLY the JSON-LD output, no explanations or markdown formatting.`;
    
    // Create the user message with the conversion request
    const userMessage = `Enrich the following JSON-LD with additional information that you infer from the content of the JSON-LD: ${JSON.stringify(jsonLd, null, 2)}`;
    
    // Call the LLM to perform the conversion
    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ]);
    console.log(response);
    const enrichedRaw = typeof (response as any).content === "string"
    ? (response as any).content
    : JSON.stringify((response as any).content, null, 2);
    
    return enrichedRaw;
  }


}

async function crawlWebsite(startUrl: string): Promise<Map<string, DownloadedPageContent>> {
  const start = new URL(startUrl);
  function canonicalize(u: string): string {
    const url = new URL(u, start);
    url.hash = "";
    return url.toString();
  }
  const inScope = (u: string) => {
    try {
      const url = new URL(u);
      return url.origin === start.origin;
    } catch {
      return false;
    }
  };

  const toVisit: string[] = [canonicalize(startUrl)];
  const visited = new Set<string>();
  const contents = new Map<string, DownloadedPageContent>();

  while (toVisit.length) {
    const current = toVisit.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    try {
      const [content, links] = await downloadPageContent({ url: current });
      contents.set(current, content);
      for (const link of links) {
        if (!inScope(link)) continue;
        const canon = canonicalize(link);
        if (!visited.has(canon)) toVisit.push(canon);
      }
    } catch {}
  }

  return contents;
}

  export default defineDkgPlugin((ctx, mcp, api) => {
    
    // Example MCP Tool definition, using @modelcontextprotocol/sdk
    mcp.registerTool(
      "webpage-to-dkg",
      {
        title: "Webpage to DKG Tool",
        description: "Snapshot a single webpage content into the OriginTrail Decentralized Knowledge Graph (DKG), using its native semantics",
        inputSchema: { url: z.string(), outputFormat: z.enum(["rdf", "json-ld"]), reasoningType: z.enum(["none", "symbolic", "neural","neurosymbolic"]) },
      },
      async ({ url, outputFormat, reasoningType }) => { 
        // TODO: move this to a separate function, so we can use it in the API as well
        const [content] = await downloadPageContent({ url });
        const start = new URL(url);
        const dateStr = new Date().toISOString().slice(0, 10);
        const runDir = path.resolve(
          __dirname,
          "../downloaded",
          dateStr,
          encodeURIComponent(start.origin),
        );
        if (!fs.existsSync(runDir)) fs.mkdirSync(runDir, { recursive: true });

        if (outputFormat === "rdf") {
          const rdf = await buildRdfFromPage(content);
          const hash = createHash("sha256").update(rdf).digest("hex");
          fs.writeFileSync(path.join(runDir, `${hash}.ttl`), rdf, "utf8");
          return {
            content: [
              { type: "text", text: String(content.finalUrl) },
              { type: "text", text: rdf },
            ] as any,
          };
        } else {
          const jsonLd = await buildJsonLdFromPage(content);
          const jsonLdStr = typeof jsonLd === "string" ? jsonLd : JSON.stringify(jsonLd, null, 2);
          const hash = createHash("sha256").update(jsonLdStr).digest("hex");
          fs.writeFileSync(path.join(runDir, `${hash}_enriched.jsonld`), jsonLdStr, "utf8");
          return {
            content: [
              { type: "text", text: String(content.finalUrl) },
              { type: "text", text: jsonLdStr },
            ] as any,
          };
        }
      }

  );

  mcp.registerTool(
    "entire-website-to-dkg",
    {
      title: "Entire Website to DKG Tool",
      description: "Snapshot a entire website content into the OriginTrail Decentralized Knowledge Graph (DKG), using its native semantics",
      inputSchema: { url: z.string(), reasoningType: z.enum(["none", "symbolic", "neural","neurosymbolic"]) },
    },
    async ({ url, reasoningType }) => {
      reasoningType = "none"; //TODO: add support for reasoning later
      const pages = await crawlWebsite(url);
      const start = new URL(url);
      const dateStr = new Date().toISOString().slice(0, 10);
      const runDir = path.resolve(
        __dirname,
        "../downloaded",
        dateStr,
        encodeURIComponent(start.origin),
      );
      if (!fs.existsSync(runDir)) fs.mkdirSync(runDir, { recursive: true });
      for (const [pageUrl, content] of pages) {
        const jsonLd = await buildJsonLdFromPage(content);
        const jsonLdStr = typeof jsonLd === "string" ? jsonLd : JSON.stringify(jsonLd, null, 2);
        const hash = createHash("sha256").update(jsonLdStr).digest("hex");
        fs.writeFileSync(path.join(runDir, `${hash}_enriched.jsonld`), jsonLdStr, "utf8");
      }
      return {
        content: [
          { type: "text", text: `Entire website content snapshotted into the DKG. Output folder: ${runDir}` },
        ] as any,
      };
    }
  );
  
  // Example API route definition, using express.js framework
  // api.get(
  //   "/add",
  //   // Define OpenAPI route description, using @dkg/plugin-swagger
  //   openAPIRoute(
  //     {
  //       tag: "Example",
  //       summary: "Add two numbers",
  //       description: "Add two numbers",
  //       query: z.object({
  //         a: z.number({ coerce: true }).openapi({
  //           description: "First number",
  //           example: 2,
  //         }),
  //         b: z.number({ coerce: true }).openapi({
  //           description: "Second number",
  //           example: 3,
  //         }),
  //       }),
  //       response: {
  //         description: "Addition result",
  //         schema: z.object({
  //           result: z.number(),
  //         }),
  //       },
  //     },
  //     // Express.js handler
  //     (req, res) => {
  //       const { a, b } = req.query;
  //       res.json({ result: a + b });
  //     },
  //   ),
  // );
});

export async function buildRdfFromPage(page: DownloadedPageContent): Promise<string> {
  const base = page.finalUrl || page.initialUrl;
  const $ = cheerio.load(page.content);
  
  const quads: Quad[] = [];
  const { namedNode, literal, quad, defaultGraph } = DataFactory as typeof DataFactory & {
    defaultGraph: () => any;
  };
  const pageNode = namedNode(base);
  
  // Title
  const titleText = ($("title").first().text() || "").trim();
  if (titleText) {
    quads.push(quad(pageNode, namedNode("http://purl.org/dc/terms/title"), literal(titleText), defaultGraph()));
  }
  
  // H1s
  $("h1").each((_, el) => {
    const h1 = $(el).text().trim();
    if (h1) {
      quads.push(quad(pageNode, namedNode("http://schema.org/headline"), literal(h1), defaultGraph()));
    }
  });
  
  // Paragraphs
  $("p").each((_, el) => {
    const p = $(el).text().trim();
    if (p) {
      quads.push(quad(pageNode, namedNode("http://schema.org/text"), literal(p), defaultGraph()));
    }
  });
  
  // Images
  $("img[src]").each((_, el) => {
    const src = $(el).attr("src");
    const alt = ($(el).attr("alt") || "").trim();
    if (src) {
      const url = new URL(src, base).toString();
      const imgNode = namedNode(url);
      quads.push(quad(pageNode, namedNode("http://schema.org/image"), imgNode, defaultGraph()));
      if (alt) {
        quads.push(quad(imgNode, namedNode("http://schema.org/caption"), literal(alt), defaultGraph()));
      }
      quads.push(quad(imgNode, namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), namedNode("http://schema.org/ImageObject"), defaultGraph()));
    }
  });
  
  // Videos
  $("video, source[type^='video']").each((_, el) => {
    const src = $(el).attr("src");
    if (src) {
      const url = new URL(src, base).toString();
      const videoNode = namedNode(url);
      quads.push(quad(pageNode, namedNode("http://schema.org/video"), videoNode, defaultGraph()));
      quads.push(quad(videoNode, namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), namedNode("http://schema.org/VideoObject"), defaultGraph()));
    }
  });
  
  // JSON-LD blocks
  const jsonLdBlocks: object[] = [];
  $("script[type='application/ld+json']").each((_, el) => {
    const raw = $(el).contents().text();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) jsonLdBlocks.push(...parsed);
      else jsonLdBlocks.push(parsed);
    } catch {}
  });
  
  // Microdata extraction to JSON-LD via cheerio traversal
  // Simple microdata -> JSON-LD conversion (limited but practical)
  const microdataItems: any[] = [];
  $("*[itemscope]").each((_, scope) => {
    const type = $(scope).attr("itemtype") || undefined;
    const item: any = { "@context": "http://schema.org" };
    if (type) item["@type"] = Array.isArray(type) ? type[0] : type;
    $(scope)
    .find("[itemprop]")
    .each((__, propEl) => {
      const prop = $(propEl).attr("itemprop");
      if (!prop) return;
      let value: any = $(propEl).attr("content") || $(propEl).attr("src") || $(propEl).text();
      value = (value || "").trim();
      if (!value) return;
      if (item[prop]) {
        if (!Array.isArray(item[prop])) item[prop] = [item[prop]];
        item[prop].push(value);
      } else item[prop] = value;
    });
    microdataItems.push(item);
  });
  
  // Convert JSON-LD and microdata JSON-LD to RDF quads
  async function jsonLdToQuads(doc: any): Promise<Quad[]> {
    const dataset = await jsonld.toRDF(doc, { base, format: "application/n-quads" } as any);
    const parser = new Parser({ baseIRI: base });
    return parser.parse(dataset as unknown as string);
  }
  
  for (const block of jsonLdBlocks) {
    try {
      const q = await jsonLdToQuads(block);
      quads.push(...q);
    } catch {}
  }
  for (const item of microdataItems) {
    try {
      const q = await jsonLdToQuads(item);
      quads.push(...q);
    } catch {}
  }
  
  // Serialize quads to Turtle
  const writer = new Writer({ prefixes: {
    schema: "http://schema.org/",
    dct: "http://purl.org/dc/terms/",
  }});
  for (const q of quads) writer.addQuad(q);
  return new Promise<string>((resolve, reject) => {
    writer.end((err: Error | null, result?: string) => (err ? reject(err) : resolve(result || "")));
  });
}

export type ConvertRdfToJsonLdOptions = {
  base?: string;
  context?: Record<string, unknown> | string;
};



export async function buildJsonLdFromPage(
  page: DownloadedPageContent,
  context?: Record<string, unknown> | string,
): Promise<any> {
  const base = page.finalUrl || page.initialUrl;
  const $ = cheerio.load(page.content);
  
  const ctx: Record<string, unknown> =
  typeof context === "object" && context
  ? (context as Record<string, unknown>)
  : {
    "@vocab": "http://schema.org/",
    schema: "http://schema.org/",
    dct: "http://purl.org/dc/terms/",
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  };
  
  const graph: any[] = [];
  
  // Page node
  const pageNode: any = { "@id": base, "@type": "WebPage" };
  
  // Title
  const titleText = ($("title").first().text() || "").trim();
  if (titleText) {
    pageNode["dct:title"] = titleText;
  }
  
  // H1s
  const headlines: string[] = [];
  $("h1,h2,h3,h4,h5,h6").each((_, el) => {
    const h = $(el).text().trim();
    if (h) headlines.push(h);
  });
  if (headlines.length) pageNode["headline"] = headlines.length === 1 ? headlines[0] : headlines;
  
  // Paragraphs
  const paragraphs: string[] = [];
  $("p").each((_, el) => {
    const t = $(el).text().trim();
    if (t) paragraphs.push(t);
  });
  if (paragraphs.length) pageNode["text"] = paragraphs.length === 1 ? paragraphs[0] : paragraphs;
  
  // Images
  const imageRefs: any[] = [];
  $("img[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    const url = new URL(src, base).toString();
    const alt = ($(el).attr("alt") || "").trim();
    imageRefs.push({ "@id": url });
    const imgNode: any = {
      "@id": url,
      "@type": "ImageObject",
      contentUrl: url,
    };
    if (alt) imgNode.caption = alt;
    graph.push(imgNode);
  });
  if (imageRefs.length) pageNode["image"] = imageRefs.length === 1 ? imageRefs[0] : imageRefs;
  
  // Videos
  const videoRefs: any[] = [];
  $("video, source[type^='video']").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    const url = new URL(src, base).toString();
    videoRefs.push({ "@id": url });
    graph.push({ "@id": url, "@type": "VideoObject", contentUrl: url });
  });
  if (videoRefs.length) pageNode["video"] = videoRefs.length === 1 ? videoRefs[0] : videoRefs;
  
  // Inline JSON-LD blocks
  $("script[type='application/ld+json']").each((_, el) => {
    const raw = $(el).contents().text();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) graph.push(...parsed);
      else graph.push(parsed);
    } catch {}
  });
  
  // Microdata -> JSON-LD (basic mapping)
  $("*[itemscope]").each((_, scope) => {
    const type = $(scope).attr("itemtype") || undefined;
    const item: any = {};
    if (type) item["@type"] = Array.isArray(type) ? type[0] : type;
    const id = $(scope).attr("itemid");
    if (id) item["@id"] = new URL(id, base).toString();
    $(scope)
    .find("[itemprop]")
    .each((__, propEl) => {
      const prop = $(propEl).attr("itemprop");
      if (!prop) return;
      let value: any =
      $(propEl).attr("content") ||
      $(propEl).attr("src") ||
      $(propEl).attr("href") ||
      $(propEl).text();
      value = (value || "").trim();
      if (!value) return;
      if (/(src|href)/.test(Object.keys($(propEl).attr() || {}).join(" "))) {
        try {
          value = new URL(value, base).toString();
        } catch {}
      }
      if (item[prop]) {
        if (!Array.isArray(item[prop])) item[prop] = [item[prop]];
        item[prop].push(value);
      } else item[prop] = value;
    });
    graph.push(item);
  });
  
  // Build adjacency and hierarchy by crawling DOM and connecting elements at the same depth
  const idIndex = new Map<string, any>();
  idIndex.set(base, pageNode);
  for (const node of graph) {
    if (node && typeof node === "object" && node["@id"]) idIndex.set(node["@id"], node);
  }
  
  // Map DOM elements to created node IDs for immediate sibling linking
  const elementToNodeId = new Map<any, string>();
  
  function addRef(subject: any, prop: string, targetId: string) {
    if (!subject[prop]) {
      subject[prop] = { "@id": targetId };
      return;
    }
    const val = subject[prop];
    if (Array.isArray(val)) {
      if (!val.some((v) => v && v["@id"] === targetId)) val.push({ "@id": targetId });
    } else {
      if (val && val["@id"] === targetId) return;
      subject[prop] = [val, { "@id": targetId }];
    }
  }
  
  function getDepth(el: any): number {
    let d = 0;
    let p = el.parent;
    while (p && p.type === "tag") {
      d++;
      p = p.parent;
    }
    return d;
  }
  
  function getPrevTagElement(el: any): any {
    let prev = el.prev;
    while (prev && prev.type !== "tag") prev = prev.prev;
    return prev;
  }
  
  let nodeCounter = 0;
  const previousAtDepth: Record<number, string> = {};
  const lastHeadingAtDepth: Record<number, string> = {};
  
  const headingTags = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
  
  $("body *").each((_, el) => {
    const name = (el as any).name || (el as any).tagName || "";
    const tag = String(name).toLowerCase();
    if (!tag) return;
    
    const depth = getDepth(el);
    let currentId: string | undefined;
    let currentNode: any | undefined;
    
    if (headingTags.has(tag)) {
      const text = ($(el).text() || "").trim();
      if (!text) return;
      currentId = `${base}#el-${++nodeCounter}`;
      currentNode = { "@id": currentId, "@type": "WebPageElement", name: text, headingLevel: Number(tag.slice(1)) };
      graph.push(currentNode);
      idIndex.set(currentId, currentNode);
      elementToNodeId.set(el, currentId);
      lastHeadingAtDepth[depth] = currentId;
    } else if (tag === "p") {
      const text = ($(el).text() || "").trim();
      if (!text) return;
      currentId = `${base}#el-${++nodeCounter}`;
      currentNode = { "@id": currentId, "@type": "WebPageElement", text };
      graph.push(currentNode);
      idIndex.set(currentId, currentNode);
      elementToNodeId.set(el, currentId);
      // If the immediate previous sibling is a heading, link heading -> paragraph
      const prevTagEl = getPrevTagElement(el);
      if (prevTagEl) {
        const prevTagName = String((prevTagEl as any).name || "").toLowerCase();
        if (headingTags.has(prevTagName)) {
          const headingId = elementToNodeId.get(prevTagEl);
          if (headingId) {
            const headingNode = idIndex.get(headingId);
            if (headingNode) {
              addRef(headingNode, "isRelatedTo", currentId);
              addRef(headingNode, "hasPart", currentId);
            }
          }
        }
      }
    } else if (tag === "img") {
      const src = $(el).attr("src");
      if (!src) return;
      const url = new URL(src, base).toString();
      currentId = url;
      currentNode = idIndex.get(url);
      if (!currentNode) {
        const alt = ($(el).attr("alt") || "").trim();
        currentNode = { "@id": url, "@type": "ImageObject", contentUrl: url };
        if (alt) currentNode.caption = alt;
        graph.push(currentNode);
        idIndex.set(url, currentNode);
      }
      elementToNodeId.set(el, currentId);
    } else if (tag === "video" || (tag === "source" && String($(el).attr("type") || "").startsWith("video"))) {
      const src = $(el).attr("src");
      if (!src) return;
      const url = new URL(src, base).toString();
      currentId = url;
      currentNode = idIndex.get(url);
      if (!currentNode) {
        currentNode = { "@id": url, "@type": "VideoObject", contentUrl: url };
        graph.push(currentNode);
        idIndex.set(url, currentNode);
      }
      elementToNodeId.set(el, currentId);
    } else {
      return;
    }
    
    if (!currentId || !currentNode) return;
    
    // Page hasPart everything
    addRef(pageNode, "hasPart", currentId);
    
    // Link with previous at same depth
    const prevId = previousAtDepth[depth];
    if (prevId) {
      const prevNode = idIndex.get(prevId);
      if (prevNode) addRef(prevNode, "isRelatedTo", currentId);
    }
    previousAtDepth[depth] = currentId;
    
    // If there was a heading at this depth, relate heading to this node
    const headingId = lastHeadingAtDepth[depth];
    if (headingId && headingId !== currentId) {
      const headingNode = idIndex.get(headingId);
      if (headingNode) {
        addRef(headingNode, "isRelatedTo", currentId);
        addRef(headingNode, "hasPart", currentId);
      }
    }
  });
  
  // Push page node last so references are defined above or vice versa; order doesn't matter in JSON-LD
  graph.unshift(pageNode);
  
  // Normalize: ensure each embedded object doesn't carry its own @context
  for (const node of graph) {
    if (node && typeof node === "object" && node["@context"]) delete node["@context"];
  }
  
  const doc = { "@context": ctx, "@graph": graph };
  
  // Caller is responsible for persistence; return the document only
  
  return doc;
}
