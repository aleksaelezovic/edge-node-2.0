import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 as uuid_v7 } from "uuid";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$default(() => uuid_v7()),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  scope: text("scope").notNull(),
});
