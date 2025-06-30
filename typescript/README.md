# DKG Turborepo

This project was created via Turborepo starter maintained by the Turborepo core team.

## Requirements

1. Node.js >= 18 and npm
2. Turbo installed globally

```sh
npm i -g turbo
```

## Quick start

Make sure you are inside of this (`typescript`) directory.

1. Run `npm install`
2. Run `npm run build` to build all packages and applications
3. Run `npm run dev` to start all applications and packages in dev mode (with automatic reload)

> [!TIP]
> If you are having problems with the `dev` command, try deleting "@sinclair" directory inside of
> the `packages/plugins/node_modules` directory.

To run commands for a specific package or application you can either:

- go into it's directory and run `npm run` to see available commands or
- run i.e `turbo @dkg/plugins#build` to run the "build" command for "plugins" ("@dkg/plugins") package.

Before committing changes run `turbo format check-types lint build` and make sure there are no errors or warnings.

Use `turbo gen` to generate new apps, packages or plugins.

- After you created a new package, run `npm install` and `npm run build`.
- To install a dependency inside of a package/app just run `npm install --save <package-name>`
  and it will be added to the package.json file and installed in global node_modules directory.
- You can use your new package in another package/app by running `npm install --save <your-package-name>` inside of another package's directory. (You can find "your-package-name" in the package.json file of your new package)

> [!TIP]
> If your editor cannot find reference to some of the local packages or recognize types, try running `npm install` in the root directory of the monorepo and also `npm run build`.

### Creating a MCP/API plugin package

1. Run `turbo gen plugin`
2. Give it a name "plugin-<your-name>"
3. Develop inside of the newly created `packages/plugin-<your-name>/src/index.ts` file

Creating plugin outside of this monorepo:

1. Run `npm install @dkg/plugins`
2. Import the helper function `import { defineDkgPlugin } from '@dkg/plugins';`
3. Define your plugin using `defineDkgPlugin` function.
4. (Optionally) define your plugin as `(options: {...}) => defineDkgPlugin(...)` in order to allow users
   to configure your plugin with custom options.

The `defineDkgPlugin` function exposes 3 arguments that will be injected by the Edge Node:

- `ctx` (context): Context object containing injected Edge Node environment:
  - `ctx.logger`: Logger instance for logging messages.
  - `ctx.dkg`: DKG Client instance for interacting with the DKG network.
  - ...
- `mcp` (MCP Server instance): Instance of the MCP Server from `@modelcontextprotocol/sdk` npm package.
  Use it to register MCP tools and resources.
- `api` (API Server instance): Hono server instance from [`hono`](https://hono.dev/) npm package.
  Use it to expose API routes from you plugin.

Registered routes and MCP tools/resources will be available as part of the Edge Node API server.

> [!NOTE]
> Plugins are just functions that will be applied in the provided order and
> as such can be defined as inline functions - but using the `defineDkgPlugin` function
> is recommended both for type-safety and for the extension methods it provides.

You can register your plugins inside of the `createPluginApi` function, as shown in the example in
`apps/mcp-server/src/index.ts`.
Here you can also configure these plugins with extension methods (i.e `.withNamespace`) as shown in the example.

1. Inside of mcp-server directory, run `npm install --save @dkg/plugin-<your-name>`
2. Inside of src/index.ts file, import your plugin (`import myPlugin from '@dkg/plugin-<your-name>'`)
3. Inside of src/index.ts file, in the `createPluginApi` function, add your plugin to the array of plugins.

> [!TIP]
> See how the already existing plugins are created by looking into `packages/plugin-auth` and `packages/plugin-example`.

### Apps and Packages

Run `turbo ls` to see the full list.

- `@dkg/mcp-server`: DKG MCP Server app, running on port 9200
- `@dkg/example-edge-node`: Example of an edge node (Expo)

- `@dkg/plugins`: Utility package for creating DKG plugins
- `@dkg/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@dkg/typescript-config`: `tsconfig.json`s used throughout the monorepo
- `@dkg/internal`: Internal utilities and helpers for managing this monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

Use `turbo gen` to generate new apps and packages.

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
npx turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
