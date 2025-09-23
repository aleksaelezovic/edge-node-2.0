import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { hash } from "@node-rs/argon2";
import { v4 as uuid_v4 } from "uuid";
import { eq } from "drizzle-orm";

import { PasswordResetProvider } from "@/server/passwordResetPlugin";
import { users, passwordResets as pwResets } from "./users";

export default class SqlitePasswordResetProvider
  implements PasswordResetProvider
{
  constructor(private db: BetterSQLite3Database) {}

  async setPassword(userId: string, plainPassword: string) {
    const password = await hash(plainPassword);
    await this.db.update(users).set({ password }).where(eq(users.id, userId));
    await this.db.delete(pwResets).where(eq(pwResets.userId, userId));
  }

  async generateCode(email: string) {
    const u = await this.db.select().from(users).where(eq(users.email, email));
    if (!u[0]) return null;

    const code = uuid_v4();
    await this.db.insert(pwResets).values({
      code,
      userId: u[0].id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    return code;
  }

  async verifyCode(code: string) {
    const r = await this.db
      .select()
      .from(pwResets)
      .where(eq(pwResets.code, code));
    if (!r[0]) return null;
    return { userId: r[0].userId };
  }
}
