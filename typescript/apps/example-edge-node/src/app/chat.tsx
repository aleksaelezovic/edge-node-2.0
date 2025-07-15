import { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  OAuthClientInformation,
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import * as Linking from "expo-linking";
import OpenAI from "openai";
import { useLocalSearchParams } from "expo-router";
import { fetch } from "expo/fetch";

class InMemoryOAuthClientProvider implements OAuthClientProvider {
  private _clientInformation?: OAuthClientInformationFull;
  private _tokens?: OAuthTokens;
  private _codeVerifier?: string;

  constructor(
    private readonly _redirectUrl: string | URL,
    private readonly _clientMetadata: OAuthClientMetadata,
    onRedirect?: (url: URL) => void,
  ) {
    this._onRedirect =
      onRedirect ||
      ((url) => {
        console.log(`Redirect to: ${url.toString()}`);
      });
  }

  private _onRedirect: (url: URL) => void;

  get redirectUrl(): string | URL {
    return this._redirectUrl;
  }

  get clientMetadata(): OAuthClientMetadata {
    return this._clientMetadata;
  }

  private _save(key: string, value: any) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  private _load(key: string): any {
    const str = window.localStorage.getItem(key);
    if (str === null) return undefined;
    return JSON.parse(str);
  }

  clientInformation(): OAuthClientInformation | undefined {
    return this._load("clientInfo");
  }

  saveClientInformation(clientInformation: OAuthClientInformationFull): void {
    this._save("clientInfo", clientInformation);
  }

  tokens(): OAuthTokens | undefined {
    return this._load("tokens");
  }

  saveTokens(tokens: OAuthTokens): void {
    this._save("tokens", tokens);
  }

  redirectToAuthorization(authorizationUrl: URL): void {
    this._onRedirect(authorizationUrl);
  }

  saveCodeVerifier(codeVerifier: string): void {
    this._save("codeVerifier", codeVerifier);
  }

  codeVerifier(): string {
    const codeVerifier = this._load("codeVerifier");
    if (!codeVerifier) {
      throw new Error("No code verifier saved");
    }
    return codeVerifier;
  }
}

const mcp = new Client({ name: "edge-node-agent", version: "1.0.0" });
const openai = new OpenAI({
  apiKey: process.env.API_KEY || "---",
  dangerouslyAllowBrowser: true,
});
const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:9200/mcp"),
  {
    fetch: (url, opts) => fetch(url.toString(), opts as any),
    authProvider: new InMemoryOAuthClientProvider(
      "http://localhost:8081/chat",
      {
        redirect_uris: ["http://localhost:8081/chat"],
        client_name: "Edge Node Agent",
        client_uri: "http://localhost:8081",
        logo_uri: "http://localhost:8081/logo.png",
        scope: "mcp",
      },
      (url) => Linking.openURL(url.toString()),
    ),
  },
);

export default function Chat() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [tools, setTools] = useState<OpenAI.ChatCompletionTool[]>([]);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<OpenAI.ChatCompletionMessage[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (code) transport.finishAuth(code).then(() => Linking.openURL("/chat"));
    else
      mcp
        .connect(transport)
        .then(() => setConnected(true))
        .catch((error) => {
          console.error("619", error);
        })
        .finally(() => {
          console.log(transport.sessionId);
          //setInterval(() => console.log(transport.sessionId), 500);
        });
  }, [code]);

  useEffect(() => {
    if (!connected) return;
    mcp.listTools().then(({ tools }) => {
      setTools(
        tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema,
          },
        })),
      );
    });
  }, [connected]);

  return (
    <>
      <View>
        <Text>Hello, World!</Text>
        {connected ? <Text>Connected</Text> : <Text>Connecting...</Text>}
        <Text>{tools.length} tools available</Text>
        <TextInput
          placeholder="Message"
          onChangeText={setMessage}
          value={message}
        />
        <Button
          title="Send"
          onPress={() => {
            openai.chat.completions
              .create({
                model: "gpt-4",
                messages: [],
                tools,
              })
              .then((r) => r.choices[0]?.message)
              .then((m) => {
                if (!m) throw new Error("No message received");
                setMessages((prevMessages) => [...prevMessages, m]);
              });
          }}
        />
        <View>
          {messages.map((m, i) => (
            <View key={i}>
              <Text>{m.content}</Text>
              <View>
                <Text>Tool calls:</Text>
                {m.tool_calls?.map((tc, j) => (
                  <View key={j}>
                    <Text>{tc.function.name}</Text>
                    <Text>{tc.function.arguments}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}
