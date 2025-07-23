import { DkgPlugin } from "@dkg/plugins";
import { z } from "@dkg/plugins/helpers";
import { express } from "@dkg/plugins/types";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { OAuthServerProvider } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";

import DemoOAuthStorageProvider from "./storage/demo";
import makeProvider, { OAuthStorageProvider } from "./makeProvider";

export { DemoOAuthStorageProvider };
export type { OAuthStorageProvider };

export default <Credentials>({
    issuerUrl,
    schema,
    login,
    logout,
    loginPageUrl,
    storage,
    scopesSupported,
    tokenExpirationInSeconds = 3600, // 1h
    refreshTokenExpirationInSeconds = 86400, // 1d
  }: {
    issuerUrl: URL;
    schema: z.Schema<Credentials>;
    login: (credentials: Credentials) => Promise<{
      scopes: string[];
    }>;
    logout?: () => Promise<void>;
    loginPageUrl: URL;
    storage: OAuthStorageProvider;
    tokenExpirationInSeconds?: number;
    refreshTokenExpirationInSeconds?: number;
    scopesSupported?: string[];
  }): DkgPlugin =>
  (_, __, api) => {
    const provider = makeProvider({
      storage,
      scopesSupported,
      tokenExpirationInSeconds,
      refreshTokenExpirationInSeconds,
      loginPageUrl,
    });

    api.post("/login", async (req, res) => {
      try {
        const authorizationCode = String(req.query.code ?? "");
        if (!authorizationCode) {
          res.status(400).json({ error: "Missing code parameter." });
          return;
        }

        const credentials = await schema.parseAsync(req.body);
        const user = await login(credentials);

        const targetUrl = await provider.authorizeConfirm(
          authorizationCode,
          user.scopes,
        );
        res.status(200).json({ targetUrl });
      } catch {
        res.status(401).json({ error: "Invalid credentials." });
      }
    });

    api.post("/logout", async (_, res) => {
      if (logout) await logout();
      res.status(200);
    });

    api.use(
      mcpAuthRouter({
        issuerUrl,
        provider,
        scopesSupported,
      }),
    );

    api.use((_, res, next) => {
      res.locals.provider = provider;
      next();
    });
  };

export const authorized =
  (scope: string[]): express.Handler =>
  (req, res, next) => {
    const provider: OAuthServerProvider = res.locals.provider;

    if (!provider) {
      throw new Error("OAuth provider not initialized");
    }

    return requireBearerAuth({
      verifier: {
        verifyAccessToken: provider.verifyAccessToken,
      },
      requiredScopes: scope,
    })(req, res, next);
  };
