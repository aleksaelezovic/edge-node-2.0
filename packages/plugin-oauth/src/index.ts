import { DkgPlugin } from "@dkg/plugins";
import type { express } from "@dkg/plugins/types";
import { openAPIRoute, z } from "@dkg/plugin-swagger";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { OAuthServerProvider } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import {
  InsufficientScopeError,
  OAuthError,
  ServerError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import type { SecuritySchemeObject } from "openapi3-ts/oas31";

import DemoOAuthStorageProvider from "./storage/demo";
import makeProvider, {
  OAuthStorageProvider,
  CodeConfirmationData,
} from "./makeProvider";

export { DemoOAuthStorageProvider };
export type { OAuthStorageProvider, CodeConfirmationData };

const oauthPlugin =
  <Credentials>({
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
      extra?: Record<string, unknown>;
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

    api.post(
      "/login",
      openAPIRoute(
        {
          tag: "Auth",
          summary: "Login route",
          description:
            "Confirm user credentials and enable the OAuth code for the client",
          query: z.object({
            code: z.string({ message: "Missing code parameter." }).openapi({
              description:
                "Authorization code, retrieved from oauth server's /authorize route",
            }),
            includeRefreshToken: z.enum(["1", "0"]).optional().openapi({
              description:
                "If a refresh token should be issued. Used in 'remember me' sign in functionality.",
            }),
          }),
          body: schema,
          response: {
            description: "User logged in successfully",
            schema: z.object({
              targetUrl: z.string().openapi({
                description:
                  "URL to redirect to in order to complete the oauth flow. " +
                  "Includes the authorization code.",
              }),
            }),
          },
        },
        async (req, res) => {
          try {
            const authorizationCode = req.query.code;
            const credentials = await schema.parseAsync(req.body);
            const user = await login(credentials);

            const targetUrl = await provider.authorizeConfirm(
              authorizationCode,
              {
                includeRefreshToken: req.query.includeRefreshToken === "1",
                scopes: user.scopes,
                extra: user.extra,
              },
            );

            res.status(200).json({ targetUrl: targetUrl.toString() });
          } catch (error) {
            if (error instanceof InsufficientScopeError) {
              res.status(403).json(error.toResponseObject());
            } else if (error instanceof ServerError) {
              res.status(500).json(error.toResponseObject());
            } else if (error instanceof OAuthError) {
              res.status(400).json(error.toResponseObject());
            } else {
              res.status(401).json({ error: "Invalid credentials." });
            }
          }
        },
      ),
    );

    api.post(
      "/logout",
      openAPIRoute(
        {
          tag: "Auth",
          summary: "Logout route",
          description:
            "If implemented, runs the logout function. If not, just returns a 200 response.",
          response: {
            description: "Logout successful",
            schema: z.any(),
          },
        },
        async (_, res) => {
          if (logout) await logout();
          res.status(200).send();
        },
      ),
    );

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

export default oauthPlugin;

export const createOAuthPlugin = <Credentials>(
  opts: Parameters<typeof oauthPlugin<Credentials>>[0],
) => {
  const plugin = oauthPlugin<Credentials>(opts);
  const openapiSecurityScheme: SecuritySchemeObject = {
    type: "oauth2",
    flows: {
      authorizationCode: {
        scopes: Object.fromEntries(
          (opts.scopesSupported ?? []).map((scope) => [scope, scope]),
        ),
        authorizationUrl: `${opts.issuerUrl.toString()}authorize`,
        tokenUrl: `${opts.issuerUrl.toString()}token`,
        refreshUrl: `${opts.issuerUrl.toString()}token`,
      },
    },
  };

  return {
    oauthPlugin: plugin,
    openapiSecurityScheme,
  };
};

/**
 * Middleware to check if the user is authorized for a given scope.
 *
 * It will also expose the `AuthInfo` object for the logged-in user
 * in the response locals, `res.locals.auth`
 *
 * @param scope {string[]} - The scope to check for authorization.
 * @returns {express.Handler} An Express middleware function.
 */
export const authorized =
  (scope: string[]): express.Handler =>
  (req, res, next) => {
    const provider: OAuthServerProvider = res.locals.provider;
    if (!provider) throw new Error("OAuth provider not initialized");

    return requireBearerAuth({
      verifier: {
        verifyAccessToken: provider.verifyAccessToken,
      },
      requiredScopes: scope,
    })(req, res, (arg) => {
      res.locals.auth = req.auth;
      next(arg);
    });
  };
