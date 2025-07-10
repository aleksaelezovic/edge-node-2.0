import { randomUUID } from "node:crypto";
import { DkgPlugin } from "@dkg/plugins";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import {
  AuthorizationParams,
  OAuthServerProvider,
} from "@modelcontextprotocol/sdk/server/auth/provider.js";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import { express } from "@dkg/plugins/types";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { DemoProvider } from "./providers";

export type Implementation = {
  saveCode: (
    code: string,
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
  ) => Promise<void>;
  getCodeData: (code: string) => Promise<
    | {
        client: OAuthClientInformationFull;
        params: AuthorizationParams;
      }
    | undefined
    | null
  >;
  deleteCode: (code: string) => Promise<void>;
  saveToken: (token: string, tokenData: AuthInfo) => Promise<void>;
  getTokenData: (token: string) => Promise<AuthInfo | undefined | null>;
  validateResource?: (resource?: URL) => Promise<boolean>;
} & OAuthRegisteredClientsStore;

export default ({
    issuerUrl,
    implementation = new DemoProvider(),
    tokenExpirationInSeconds = 3600,
    scopesSupported,
  }: {
    issuerUrl: URL;
    implementation?: Implementation;
    tokenExpirationInSeconds?: number;
    scopesSupported?: string[];
  }): DkgPlugin =>
  (_, __, api) => {
    const provider: OAuthServerProvider = {
      clientsStore: {
        getClient: implementation.getClient.bind(implementation),
        registerClient: implementation.registerClient?.bind(implementation),
      },
      async authorize(client, params, res) {
        const code = randomUUID();
        const searchParams = new URLSearchParams({ code });
        if (params.state !== undefined) {
          searchParams.set("state", params.state);
        }

        const clientScope = client.scope?.split(" ") || [];
        if (!params.scopes || params.scopes.length === 0)
          params.scopes = clientScope;

        try {
          await implementation.saveCode(code, client, params);
        } catch (err) {
          throw new Error("Failed to save code: " + String(err));
        }

        const redirectUri = params.redirectUri || client.redirect_uris.at(0);
        if (!redirectUri) {
          throw new Error("No redirect URIs provided");
        }

        const targetUrl = new URL(redirectUri);
        targetUrl.search = searchParams.toString();
        res.redirect(targetUrl.toString());
      },
      async challengeForAuthorizationCode(
        client,
        authorizationCode,
      ): Promise<string> {
        const codeData = await implementation.getCodeData(authorizationCode);
        if (!codeData) {
          throw new Error("Invalid authorization code");
        }

        return codeData.params.codeChallenge;
      },
      async exchangeAuthorizationCode(client, authorizationCode) {
        const codeData = await implementation.getCodeData(authorizationCode);
        if (!codeData) {
          throw new Error("Invalid authorization code");
        }

        if (codeData.client.client_id !== client.client_id) {
          throw new Error(
            `Authorization code was not issued to this client, ${codeData.client.client_id} != ${client.client_id}`,
          );
        }

        if (
          implementation.validateResource &&
          !implementation.validateResource(codeData.params.resource)
        ) {
          throw new Error(`Invalid resource: ${codeData.params.resource}`);
        }
        try {
          await implementation.deleteCode(authorizationCode);
        } catch (err) {
          throw new Error("Error deleting authorization code: " + String(err));
        }

        const token = randomUUID();
        try {
          await implementation.saveToken(token, {
            token,
            clientId: client.client_id,
            scopes: codeData.params.scopes || [],
            expiresAt: Date.now() + tokenExpirationInSeconds * 1000,
            resource: codeData.params.resource,
            // type: "access",
          });
        } catch (err) {
          throw new Error("Error deleting authorization code: " + String(err));
        }

        return {
          access_token: token,
          token_type: "bearer",
          expires_in: tokenExpirationInSeconds,
          scope: (codeData.params.scopes || []).join(" "),
        };
      },
      async exchangeRefreshToken(
        _client: OAuthClientInformationFull,
        _refreshToken: string,
        _scopes?: string[],
        _resource?: URL,
      ) {
        console.log(_client, _refreshToken, _scopes, _resource);
        throw new Error("Not implemented for example demo");
      },
      async verifyAccessToken(token: string): Promise<AuthInfo> {
        const tokenData = await implementation.getTokenData(token);
        if (
          !tokenData ||
          !tokenData.expiresAt ||
          tokenData.expiresAt < Date.now()
        ) {
          throw new Error("Invalid or expired token");
        }

        console.log("TOKEN DATA", tokenData);
        return {
          token,
          clientId: tokenData.clientId,
          scopes: tokenData.scopes,
          expiresAt: Math.floor(tokenData.expiresAt / 1000),
          resource: tokenData.resource,
        };
      },
      async revokeToken(client, request) {
        console.log(client, request);
        throw new Error("Not implemented for example demo");
      },
    };

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
