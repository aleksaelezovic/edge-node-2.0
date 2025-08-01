import { ask, configDatabase, configEnv, createUser } from "../helpers";

configEnv();

(async () => {
  try {
    const db = configDatabase();
    const username = await ask("Username: ", { required: true });
    const password = await ask("Password: ", { required: true });
    const scope = await ask("Scope (space-separated): ", {
      required: true,
    }).then((s) => s.split(" "));
    const userId = await createUser(db, { username, password }, scope);

    console.log(`User '${username}' created successfully with id ${userId}`);
    process.exit(0);
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
})();
