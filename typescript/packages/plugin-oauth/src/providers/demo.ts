import { Implementation } from "..";
import { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import { AuthorizationParams } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

export default class DemoProvider implements Implementation {
  private _clients: Map<string, OAuthClientInformationFull> = new Map();
  private _codes: Map<
    string,
    {
      params: AuthorizationParams;
      client: OAuthClientInformationFull;
    }
  > = new Map();
  private _tokens: Map<string, AuthInfo> = new Map();

  getClient(id: string): OAuthClientInformationFull | undefined {
    return this._clients.get(id);
  }

  registerClient(
    client: OAuthClientInformationFull,
  ): OAuthClientInformationFull {
    console.dir(client);
    client.scope = "mcp";
    this._clients.set(client.client_id, client);
    return client;
  }

  async saveCode(
    code: string,
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
  ) {
    this._codes.set(code, { params, client });
  }

  async getCodeData(
    code: string,
  ): Promise<
    | { client: OAuthClientInformationFull; params: AuthorizationParams }
    | undefined
    | null
  > {
    return this._codes.get(code);
  }

  async deleteCode(code: string): Promise<void> {
    this._codes.delete(code);
  }

  async saveToken(token: string, tokenData: AuthInfo) {
    this._tokens.set(token, tokenData);
  }

  async getTokenData(token: string): Promise<AuthInfo | undefined | null> {
    return this._tokens.get(token);
  }
}
