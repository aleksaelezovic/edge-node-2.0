import path from "node:path";
import fs from "node:fs/promises";
import dotenv from "dotenv";
import { drizzle, migrate, users } from "@/server/database/sqlite";
import { hash } from "@node-rs/argon2";
import type { UserCredentials } from "@/shared/auth";

export function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once("data", (data) => resolve(data.toString().trim()));
  });
}

export async function createFileWithContent(filePath: string, content: string) {
  try {
    const f = await fs.open(filePath, "wx");
    await f.writeFile(content, { encoding: "utf8" });
    await f.close();
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST") {
      console.error(`File ${path.basename(filePath)} already exists.`);
    } else {
      console.error(`Error creating ${path.basename(filePath)} file: `, error);
    }
  }
}

export function configEnv() {
  dotenv.config();
  if (process.argv.includes("--dev"))
    dotenv.config({
      path: path.resolve(process.cwd(), ".env.development.local"),
      override: true,
    });
}

export function configDatabase() {
  const db = drizzle(process.env.DATABASE_URL);
  migrate(db, {
    migrationsFolder: path.resolve(process.cwd(), "./drizzle/sqlite"),
  });
  return db;
}

export async function createUser(
  db: ReturnType<typeof configDatabase>,
  { username, password }: UserCredentials,
  scope: string[],
) {
  const hashedPassword = await hash(password);
  const userId = await db
    .insert(users)
    .values({ username, password: hashedPassword, scope: scope.join(" ") })
    .then((r) => r.lastInsertRowid);
  return userId;
}
