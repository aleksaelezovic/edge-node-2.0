/**
 * This is a postinstall script required for the project to work.
 * Package 'uuid' that is required by @langchain/core is exporting
 * the .mjs wrapper in a wrong way, unsupported by metro bundler
 * that Expo is using.
 *
 * Hopefully this will be fixed in the next versions of uuid/langchain.
 */

const fs = require("fs");
const path = require("path");

async function fixUuidPackage(nodeModulesPath) {
  const f = await fs.promises.open(
    path.join(nodeModulesPath, "uuid", "wrapper.mjs"),
    "r+",
  );
  const buf = await f.readFile({ encoding: "utf8" });

  if (buf.startsWith("import uuid from")) {
    const newContent =
      "import * as uuid from" + buf.substring("import uuid from".length);

    await f.truncate();
    await f.write(newContent, 0, "utf8");
  }

  await f.close();
}

(async () => {
  try {
    const nodeModulesPath = path.join(process.cwd(), "node_modules");
    await fixUuidPackage(nodeModulesPath);
    process.exit(0);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Package fix failed: ", error);
      process.exit(1);
    }
  }

  try {
    const nodeModulesPath = path.join(
      process.cwd(),
      "..",
      "..",
      "node_modules",
    );
    await fixUuidPackage(nodeModulesPath);
    process.exit(0);
  } catch (error) {
    console.error("Package fix failed in monorepo: ", error);
    process.exit(1);
  }
})();
