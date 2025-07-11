import { StorageImplementation } from "../makeProvider";

import { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import { AuthorizationParams } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

export default class DemoStorageProvider implements StorageImplementation {
  private _clients: Map<string, OAuthClientInformationFull> = new Map();
  private _codes: Map<
    string,
    {
      params: AuthorizationParams;
      client: OAuthClientInformationFull;
    }
  > = new Map();
  private _tokens: Map<string, AuthInfo> = new Map();
  private _codeConfirmed: Map<string, boolean> = new Map();

  async getClient(id: string): Promise<OAuthClientInformationFull | undefined> {
    return this._clients.get(id);
  }

  async saveClient(client: OAuthClientInformationFull): Promise<void> {
    this._clients.set(client.client_id, client);
  }

  async saveCode(
    code: string,
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
  ) {
    this._codes.set(code, { params, client });
  }

  async confirmCode(code: string) {
    this._codeConfirmed.set(code, true);
  }

  async isCodeConfirmed(code: string): Promise<boolean> {
    return this._codeConfirmed.get(code) || false;
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
