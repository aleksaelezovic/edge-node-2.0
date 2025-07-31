import { ask, configDatabase, configEnv, createUser } from "../helpers";

configEnv();

(async () => {
  try {
    const db = configDatabase();
    const username = await ask("Username: ");
    const password = await ask("Password: ");
    const scope = await ask("Scope (space-separated): ").then((s) =>
      s.split(" "),
    );
    const userId = await createUser(db, { username, password }, scope);

    console.log(`User '${username}' created successfully with id ${userId}`);
    process.exit(0);
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
})();
