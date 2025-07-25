import path from "node:path";
import dotenv from "dotenv";
import { drizzle, migrate, users } from "@/server/database/sqlite";
import { hash } from "@node-rs/argon2";

dotenv.config();
if (process.argv.includes("--dev"))
  dotenv.config({
    path: path.resolve(process.cwd(), ".env.development.local"),
    override: true,
  });

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once("data", (data) => resolve(data.toString().trim()));
  });
}

(async () => {
  try {
    const db = drizzle(process.env.DATABASE_URL);
    migrate(db, {
      migrationsFolder: path.resolve(process.cwd(), "./drizzle/sqlite"),
    });

    const username = await ask("Username: ");
    const password = await ask("Password: ");
    const scope = await ask("Scope (space-separated): ").then((s) =>
      s.split(" "),
    );
    const hashedPassword = await hash(password);
    const userId = await db
      .insert(users)
      .values({ username, password: hashedPassword, scope: scope.join(" ") })
      .then((r) => r.lastInsertRowid);

    console.log(`User '${username}' created successfully with id ${userId}`);
    process.exit(0);
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
})();
