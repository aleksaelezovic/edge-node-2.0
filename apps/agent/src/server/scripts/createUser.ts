import { ask, configDatabase, configEnv, createUser } from "../helpers";

configEnv();

(async () => {
  try {
    const db = configDatabase();
    const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
    const email = args[0] ?? (await ask("Email: ", { required: true }));
    const password = args[1] ?? (await ask("Password: ", { required: true }));
    let scope = args[2]
      ? args[2].split(",")
      : await ask("Scope (space-separated): ", {
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
