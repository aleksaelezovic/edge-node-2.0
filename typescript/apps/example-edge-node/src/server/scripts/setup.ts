import path from "node:path";
import {
  ask,
  configDatabase,
  configEnv,
  createFileWithContent,
  createUser,
} from "../helpers";

async function setup() {
  const OPENAI_API_KEY = await ask("OpenAI API Key: ");
  const DKG_OTNODE_URL = await ask(
    "OT-node URL (default: http://localhost:8900): ",
  ).then((s) => s || "http://localhost:8900");
  const DKG_BLOCKCHAIN = await ask(
    "Chain name (default: hardhat:31337): ",
  ).then((s) => s || "hardhat:31337");
  const DKG_PUBLISH_WALLET =
    DKG_BLOCKCHAIN === "hardhat:31337"
      ? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      : await ask("Publish wallet (private key): ");
  const DB_FILENAME = await ask("Database (i.e: example.db): ");

  console.log("Creating .env file...");
  await createFileWithContent(
    path.resolve(process.cwd(), ".env"),
    `PORT=9200
EXPO_PUBLIC_MCP_URL="http://localhost:9200"
EXPO_PUBLIC_APP_URL="http://localhost:9200"
DATABASE_URL="${DB_FILENAME}"
OPENAI_API_KEY="${OPENAI_API_KEY}"
DKG_PUBLISH_WALLET="${DKG_PUBLISH_WALLET}"
DKG_BLOCKCHAIN="${DKG_BLOCKCHAIN}"
DKG_OTNODE_URL="${DKG_OTNODE_URL}"
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
      username: "admin",
      password: "admin123",
    },
    ["mcp", "llm", "scope123"],
  );
  console.log(`Created admin user:
  ID: ${userId}
  Username: admin
  Password: admin123
  Scope: mcp, llm, scope123`);
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
