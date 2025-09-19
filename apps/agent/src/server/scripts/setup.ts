import path from "path";
import {
  ask,
  configDatabase,
  configEnv,
  createFileWithContent,
  createUser,
} from "../helpers";
import {
  getLLMProviderApiKeyEnvName,
  isValidLLMProvider,
  LLMProvider,
  DEFAULT_SYSTEM_PROMPT,
} from "@/shared/chat";

async function setup() {
  const LLM_PROVIDER = await ask(
    `LLM Provider (${Object.values(LLMProvider).join(", ")}; default: openai): `,
  ).then((s) => s || "openai");
  if (!isValidLLMProvider(LLM_PROVIDER)) {
    console.error(`Invalid LLM Provider: ${LLM_PROVIDER}`);
    return setup();
  }
  const LLM_PROVIDER_API_KEY_ENV_NAME =
    getLLMProviderApiKeyEnvName(LLM_PROVIDER);
  const LLM_PROVIDER_API_KEY = LLM_PROVIDER_API_KEY_ENV_NAME
    ? await ask(`${LLM_PROVIDER_API_KEY_ENV_NAME}: `)
    : "";
  const LLM_MODEL = await ask(`LLM Model: `, { required: true });
  const LLM_TEMPERATURE = await ask(`LLM Temperature (default: 0): `).then(
    (s) => s || "0",
  );
  const LLM_SYSTEM_PROMPT = await ask(
    `LLM System Prompt (optional, there is a default): `,
  ).then((s) => s || DEFAULT_SYSTEM_PROMPT);

  const DKG_OTNODE_URL = await ask(
    "OT-node URL (default: http://localhost:8900): ",
  ).then((s) => s || "http://localhost:8900");
  const DKG_BLOCKCHAIN = await ask(
    "Chain name (default: hardhat1:31337): ",
  ).then((s) => s || "hardhat1:31337");
  const DKG_PUBLISH_WALLET =
    DKG_BLOCKCHAIN === "hardhat1:31337"
      ? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      : await ask("Publish wallet (private key): ", { required: true });

  const DB_FILENAME = await ask("Database (i.e: example.db): ", {
    required: true,
  });

  console.log("Creating .env file...");
  await createFileWithContent(
    path.resolve(process.cwd(), ".env"),
    `PORT=9200
EXPO_PUBLIC_MCP_URL="http://localhost:9200"
EXPO_PUBLIC_APP_URL="http://localhost:9200"
DATABASE_URL="${DB_FILENAME}"
LLM_PROVIDER="${LLM_PROVIDER}"
LLM_MODEL="${LLM_MODEL}"
LLM_TEMPERATURE="${LLM_TEMPERATURE}"
LLM_SYSTEM_PROMPT="${LLM_SYSTEM_PROMPT}"
${
  LLM_PROVIDER_API_KEY_ENV_NAME
    ? `${LLM_PROVIDER_API_KEY_ENV_NAME}="${LLM_PROVIDER_API_KEY}"`
    : ""
}
DKG_PUBLISH_WALLET="${DKG_PUBLISH_WALLET}"
DKG_BLOCKCHAIN="${DKG_BLOCKCHAIN}"
DKG_OTNODE_URL="${DKG_OTNODE_URL}"
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=true
SMTP_FROM=
`,
  );

  console.log("Creating .env.development.local file...");
  await createFileWithContent(
    path.resolve(process.cwd(), ".env.development.local"),
    `# These values will override the .env file during the development
EXPO_PUBLIC_APP_URL="http://localhost:8081"
`,
  );

  configEnv();

  console.log("Configuring database...");
  console.log("Running migrations...");
  const db = configDatabase();

  console.log("Creating admin user...");
  const userId = await createUser(
    db,
    {
      email: "admin",
      password: "admin123",
    },
    ["mcp", "llm", "blob", "scope123"],
  );
  console.log(`Created admin user:
  ID: ${userId}
  Email: admin
  Password: admin123
  Scope: mcp, llm, blob, scope123

To create new users, run 'npm run script:createUser' inside of the agent directory.
`);
}

setup()
  .then(() => {
    console.log("Setup completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error occurred during setup:", error);
    process.exit(1);
  });
