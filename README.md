# DKG Turborepo

A comprehensive monorepo for building Decentralized Knowledge Graph (DKG) applications with a modern tech stack including Expo, Drizzle ORM, SQLite, and MCP (Model Context Protocol) integration.

## 🏗️ Architecture Overview

This project consists of:

- **Agent App**: A full-stack DKG agent with Expo UI and MCP server
- **Plugin System**: Modular plugins for extending functionality
- **Database Layer**: SQLite with Drizzle ORM for data persistence
- **Authentication**: OAuth-based authentication system
- **API Server**: Express-based API with Swagger documentation

## 📋 Requirements

- **Node.js** >= 18
- **npm** package manager
- **Turbo** CLI (install globally)

```bash
npm i -g turbo
```

## 🚀 Quick Start

### 1. Install & Build

```bash
npm install
npm run build
```

### 2. Database Setup

```bash
cd apps/agent
npm run build:scripts
npm run script:setup
```

The setup script will:

- Prompt for required environment variables
- Create `.env` and `.env.development.local` files
- Set up the SQLite database with migrations
- Create an admin user (username: `admin`, password: `admin123`)

### 3. Start Development

```bash
npm run dev
```

That's it! Your DKG agent is now running with:

- **Frontend**: [http://localhost:8081](http://localhost:8081) (Expo app)
- **Backend**: [http://localhost:9200](http://localhost:9200) (MCP server + API)
- **Database**: SQLite with Drizzle Studio available

## 🔧 Environment Configuration

### Required Environment Variables

| Variable              | Description                        | Default                 |
| --------------------- | ---------------------------------- | ----------------------- |
| `DATABASE_URL`        | SQLite database file path          | Required                |
| `OPENAI_API_KEY`      | OpenAI API key for LLM integration | Required                |
| `DKG_PUBLISH_WALLET`  | Private key for DKG publishing     | Required                |
| `DKG_BLOCKCHAIN`      | Blockchain network identifier      | `hardhat1:31337`        |
| `DKG_OTNODE_URL`      | OT-node server URL                 | `http://localhost:8900` |
| `PORT`                | Server port                        | `9200`                  |
| `EXPO_PUBLIC_APP_URL` | Public app URL                     | `http://localhost:9200` |
| `EXPO_PUBLIC_MCP_URL` | MCP server URL                     | `http://localhost:9200` |

### Development Overrides

Create `.env.development.local` to override values during development:

```env
EXPO_PUBLIC_APP_URL="http://localhost:8081"
```

## 🗄️ Database Management

### Database Schema

The application uses SQLite with the following tables:

- **`users`**: User authentication and authorization
- **`oauth_clients`**: OAuth client management
- **`oauth_codes`**: OAuth authorization codes
- **`oauth_tokens`**: OAuth access tokens

### Database Commands

```bash
# Generate new migrations
npm run build:migrations

# View database in Drizzle Studio
npm run drizzle:studio

# Create new user/token
npm run script:createUser
npm run script:createToken
```

### Drizzle Studio

Access your database through the web interface:

```bash
npm run drizzle:studio
```

Then open [https://local.drizzle.studio](https://local.drizzle.studio)

## 🧩 Plugin Development

### Creating MCP/API Plugins

#### 1. Generate Plugin Package

```bash
turbo gen plugin
# Name: plugin-<your-name>
```

#### 2. Develop Your Plugin

Edit `packages/plugin-<your-name>/src/index.ts`:

```typescript
import { defineDkgPlugin } from "@dkg/plugins";

export default defineDkgPlugin((ctx, mcp, api) => {
  // Register MCP tools/resources
  mcp.tools.register("myTool", {
    // Tool implementation
  });

  // Register API routes
  api.get("/my-endpoint", (req, res) => {
    // Route implementation
  });
});
```

#### 3. Use in Agent

```bash
cd apps/agent
npm install --save @dkg/plugin-<your-name>
```

Then register in `src/index.ts`:

```typescript
import myPlugin from "@dkg/plugin-<your-name>";

// In createPluginServer function
plugins: [myPlugin];
```

### Plugin Context

Plugins receive three injected arguments:

- **`ctx`**: DKG environment context (logger, DKG client, etc.)
- **`mcp`**: MCP Server instance for registering tools/resources
- **`api`**: Express server for API routes

## 📱 Available Scripts

### Development

```bash
npm run dev              # Start both app and server
npm run dev:app          # Start Expo app only
npm run dev:server       # Start MCP server only
```

### Building

```bash
npm run build            # Build all packages
npm run build:server     # Build server code
npm run build:web        # Build web app
npm run build:scripts    # Build utility scripts
npm run build:migrations # Generate database migrations
```

### Testing

```bash
npm run test:ui          # Run Playwright tests
npm run test:headed      # Run tests with browser
npm run test:debug       # Debug test failures
npm run test:report      # Show test report
```

## 🚀 Production Deployment

### Build for Production

```bash
npm run build            # Build all packages
npm run build:web        # Build web app
npm run build:server     # Build server
```

### Run Production Server

```bash
cd apps/agent
node dist/index.js
```

## 📦 Package Management

### Adding Dependencies

```bash
# Add to specific package
cd packages/your-package
npm install --save package-name

# Add to app
cd apps/agent
npm install --save package-name
```

### Using Local Packages

```bash
# Install local package in another package
npm install --save @dkg/your-package-name
```

## 🔍 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clean and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Database Issues

```bash
# Regenerate migrations
npm run build:migrations

# Reset database
rm *.db
npm run script:setup
```

#### TypeScript Errors

```bash
# Check types
npm run check-types

# Reinstall dependencies
npm install
npm run build
```

### Getting Help

- Check the [Turborepo documentation](https://turborepo.com/docs)
- Review existing plugins in `packages/plugin-*`
- Check the agent app README in `apps/agent/README.md`

## 📚 Useful Links

- [Turborepo Documentation](https://turborepo.com/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [DKG.js Documentation](https://docs.origintrail.io/dkg.js/)

## 🤝 Contributing

1. Follow the existing code structure
2. Use `turbo gen` for new packages/apps
3. Run `turbo format check-types lint build` before committing
4. Follow the established patterns in existing plugins

## 📄 License

This project is part of the DKG ecosystem. See individual package licenses for details.
