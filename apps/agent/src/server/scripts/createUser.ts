import { ask, configDatabase, configEnv, createUser } from "../helpers";

configEnv();

(async () => {
  try {
    const db = configDatabase();
    const email = await ask("Email: ", { required: true });
    const password = await ask("Password: ", { required: true });
    const scope = await ask("Scope (space-separated): ", {
      required: true,
    }).then((s) => s.split(" "));
    const user = await createUser(db, { email, password }, scope);

    console.log(`User '${user.email}' created successfully with id ${user.id}`);
    process.exit(0);
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
})();
