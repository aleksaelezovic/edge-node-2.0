import type { PlopTypes } from "@turbo/gen";

import { version as dkgPluginsVersion } from "../../../plugins/package.json";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("package", {
    description: "Adds a new package to the monorepo",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the package?",
      },
    ],
    actions: [
      {
        type: "add",
        path: "../{{kebabCase name}}/package.json",
        template: JSON.stringify(
          {
            name: "@dkg/{{kebabCase name}}",
            version: "0.0.1",
            description: "",
            main: "./dist/index.js",
            module: "./dist/index.mjs",
            types: "./dist/index.d.ts",
            scripts: {
              dev: "tsup src/*.ts --format cjs,esm --dts --watch",
              build: "tsup src/*.ts --format cjs,esm --dts",
              "check-types": "tsc --noEmit",
            },
            devDependencies: {
              "@dkg/eslint-config": "*",
              "@dkg/typescript-config": "*",
              eslint: "^9.29.0",
              typescript: "undefined",
              tsup: "^8.5.0",
            },
          },
          null,
          2,
        ),
      },
      {
        type: "add",
        path: "../{{kebabCase name}}/tsconfig.json",
        template: JSON.stringify(
          {
            extends: "@dkg/typescript-config/base.json",
            compilerOptions: {
              outDir: "dist",
              rootDir: "src",
            },
            include: ["src"],
            exclude: ["node_modules", "dist"],
          },
          null,
          2,
        ),
      },
      {
        type: "add",
        path: "../{{kebabCase name}}/eslint.config.mjs",
        template: `import { config } from "@dkg/eslint-config/base";

/** @type {import("eslint").Linter.Config} */
export default config;
`,
      },
      {
        type: "add",
        path: "../{{kebabCase name}}/src/index.ts",
        template: "// Your code goes here",
      },
    ],
  });

  plop.setGenerator("plugin", {
    description: "Adds a new DKG plugin package to the monorepo",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the plugin?",
      },
    ],
    actions: [
      ...(plop.getGenerator("package").actions as []),
      {
        type: "append",
        path: "../{{kebabCase name}}/package.json",
        pattern: /"@dkg\/eslint-config": "\*",(?<insertion>)/g,
        template: `    "@dkg/plugins": "${dkgPluginsVersion}",`,
      },
      {
        type: "modify",
        path: "../{{kebabCase name}}/src/index.ts",
        pattern: /.*$/,
        templateFile: "templates/plugin.hbs",
      },
    ],
  });
}
