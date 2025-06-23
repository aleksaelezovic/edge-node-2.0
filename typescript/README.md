# DKG Turborepo

This project was created via Turborepo starter maintained by the Turborepo core team.

## Requirements

1. Node.js >= 18 and npm
2. Turbo installed globally

```sh
npm i -g turbo
```

### Apps and Packages

Run 'turbo ls' to see the full list.

- `@dkg/mcp-server`: DKG MCP Server app
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

### Build

To build all apps and packages, run the following command:

```
npm run build
```

### Develop

To develop all apps and packages, run the following command:

```
npm run dev
```

**NOTE:** If you are having problems with the `dev` command, try deleting "@sinclair" directory inside of the `packages/plugins/node_modules` directory.

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
