import { useCallback, useEffect, useState } from "react";
import { View, Platform, KeyboardAvoidingView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import * as Clipboard from "expo-clipboard";
import { fetch } from "expo/fetch";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useMcpClient } from "@/client";
import useColors from "@/hooks/useColors";
import usePlatform from "@/hooks/usePlatform";
import Page from "@/components/layout/Page";
import Container from "@/components/layout/Container";
import Header from "@/components/layout/Header";
import Chat from "@/components/chat/Chat";

import {
  type ChatMessage,
  type ToolDefinition,
  type ToolCall,
  type ToolCallResultContent,
  type ToolsInfoMap,
  type ToolCallsMap,
  makeCompletionRequest,
} from "@/shared/chat";
import type { SourceKA } from "@/components/chat/ChatMessage/SourceKAs";

export default function ChatPage() {
  const colors = useColors();
  const { isNativeMobile, isWeb, width } = usePlatform();

  const { code: authorizationCode } = useLocalSearchParams<{ code?: string }>();
  const onAuthorized = useCallback(() => router.navigate("/chat"), []);
  const { connected, mcp, getToken } = useMcpClient({
    authorizationCode,
    onAuthorized,
  });
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [toolsInfo, setToolsInfo] = useState<ToolsInfoMap>({});
  const [toolCalls, setToolCalls] = useState<ToolCallsMap>({});
  const [toolsAllowed, setToolsAllowed] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const safeAreaInsets = useSafeAreaInsets();

  useEffect(() => {
    if (!connected) return;
    SplashScreen.hide();
    mcp
      .listTools()
      .then(({ tools }) => {
        const toolFns: ToolDefinition[] = [];
        const toolsInfo: ToolsInfoMap = {};
        for (const tool of tools) {
          toolFns.push({
            type: "function",
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.inputSchema,
            },
          });
          toolsInfo[tool.name] = {
            title: tool.name,
            description: tool.description,
            mcpServer: "edge-node-2.0",
          };
        }
        setTools(toolFns);
        setToolsInfo(toolsInfo);
      })
      .catch((error) => {
        console.log("Error listing MCP tools: ", error.message);
      });
  }, [connected, mcp]);

  async function callTool(tc: ToolCall) {
    setToolCalls((p) => ({
      ...p,
      [tc.id!]: { input: tc.args, status: "loading" },
    }));

    return mcp
      .callTool({ name: tc.name, arguments: tc.args })
      .then((result) => {
        setToolCalls((p) => ({
          ...p,
          [tc.id!]: {
            input: tc.args,
            status: "success",
            output: result.content,
          },
        }));

        return sendMessage({
          role: "tool",
          tool_call_id: tc.id,
          content: result.content as ToolCallResultContent,
        });
      })
      .catch((err) => {
        setToolCalls((p) => ({
          ...p,
          [tc.id!]: { input: tc.args, status: "error", error: err.message },
        }));

        return sendMessage({
          role: "tool",
          tool_call_id: tc.id,
          content: "Error occurred while calling tool: " + err.message,
          isError: true,
        });
      });
  }

  async function cancelToolCall(tc: ToolCall) {
    setToolCalls((p) => ({
      ...p,
      [tc.id!]: { input: tc.args, status: "cancelled" },
    }));

    return sendMessage({
      role: "tool",
      tool_call_id: tc.id,
      content: "Tool call was cancelled by user",
    });
  }

  async function sendMessage(newMessage: ChatMessage) {
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    const token = await getToken();
    if (!token) throw new Error("Unauthorized");

    setIsGenerating(true);
    const completion = await makeCompletionRequest(
      { messages: [...messages, newMessage], tools },
      {
        fetch: (url, opts) => fetch(url.toString(), opts as any),
        bearerToken: token,
      },
    );
    setMessages((prevMessages) => [...prevMessages, completion]);
    setIsGenerating(false);
  }

  const isLandingScreen = !messages.length && !isNativeMobile;
  console.log(messages);

  const mockKAs = Array<SourceKA>(5).fill({
    title: "OriginTrail",
    issuer: "OriginTrail",
    publisher: "0x147f32aE74d8667d8C0153004150752DA10879dD",
    UAL: "did:dkg:otp:2043:0xDbF8e9d36A73C.../32145",
    nquads: `<https://ontology.origintrail.io/dkg/1.0#metadata-hash:0xfe30a2c10e9812d2dd58395710515f00e4c5fbbc01cb5542fd00966741e0aee8> <https://ontology.origintrail.io/dkg/1.0#representsPrivateResource> <uuid:2616fbc2-2b1b-45d8-85cb-11f7e18f5040> .`,
    lastUpdate: Date.now(),
  });

  return (
    <Page style={{ flex: 1, position: "relative", marginBottom: 0 }}>
      <Chat>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={20}
          style={[
            { flex: 1, position: "relative" },
            isLandingScreen
              ? { justifyContent: "flex-start" }
              : { justifyContent: "flex-end" },
          ]}
        >
          <Container
            style={[
              { paddingBottom: 0 },
              isLandingScreen && { flex: null as any },
            ]}
          >
            <Header />
            <Chat.Messages
              style={[
                {
                  width: "100%",
                  marginHorizontal: "auto",
                  maxWidth: 800,
                },
                width >= 800 + 48 * 2 + 20 * 2 && {
                  maxWidth: 800 + 48 * 2,
                  paddingRight: 48,
                },
              ]}
            >
              {messages.map((m, i) => {
                if (m.role !== "user" && m.role !== "assistant") return null;

                const content =
                  typeof m.content === "string"
                    ? [{ type: "text", text: m.content }]
                    : m.content;

                return (
                  <Chat.Message
                    key={i}
                    icon={m.role as "user" | "assistant"}
                    style={{ gap: 8 }}
                  >
                    {/* Source Knowledge Assets */}
                    <Chat.Message.SourceKAs kas={mockKAs} />

                    {/* Message contnet (text/image) */}
                    {content.map((c, i) => (
                      <Chat.Message.Content key={i} content={c} />
                    ))}

                    {/* Tool calls */}
                    {m.tool_calls?.map((tc, i) => {
                      if (!tc.id) tc.id = i.toString();
                      const toolInfo = toolsInfo[tc.name];
                      const toolTitle = toolInfo
                        ? `${toolInfo.title} - ${toolInfo.mcpServer} (MCP Server)`
                        : tc.name;
                      const toolAllowed = toolsAllowed.includes(tc.name);

                      if (toolAllowed && !toolCalls[tc.id!]) callTool(tc);

                      const status = toolCalls[tc.id!] || {
                        status: toolAllowed ? "loading" : "init",
                        input: tc.args,
                      };

                      return (
                        <Chat.Message.ToolCall
                          key={tc.id}
                          title={toolTitle}
                          description={toolInfo?.description}
                          status={status.status}
                          input={status.input}
                          output={status.output ?? status.error}
                          onConfirm={(allowForSession) => {
                            if (allowForSession)
                              setToolsAllowed((t) => [...t, tc.name]);
                            callTool(tc);
                          }}
                          onCancel={() => cancelToolCall(tc)}
                        />
                      );
                    })}

                    {/* Actions at the bottom */}
                    {!isGenerating &&
                      m.role === "assistant" &&
                      !m.tool_calls?.length &&
                      i === messages.length - 1 && (
                        <Chat.Message.Actions
                          style={{ marginVertical: 16 }}
                          onCopyAnswer={() => {
                            const answerText = content.reduce((acc, curr) => {
                              if (curr.type !== "text") return acc;
                              return acc + "\n" + curr.text;
                            }, "");
                            Clipboard.setStringAsync(answerText.trim());
                          }}
                          onStartAgain={() => {
                            setMessages([]);
                            setToolCalls({});
                          }}
                        />
                      )}
                  </Chat.Message>
                );
              })}
              {isGenerating && <Chat.Thinking />}
            </Chat.Messages>
          </Container>

          <View
            style={[
              { width: "100%" },
              isLandingScreen && { marginTop: 60 },
              isNativeMobile && {
                backgroundColor: colors.backgroundFlat,
                paddingBottom: safeAreaInsets.bottom,
                height: 2 * 56 + safeAreaInsets.bottom + 20,
              },
            ]}
          >
            <Container
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isLandingScreen && (
                <Image
                  source={require("../assets/logo.svg")}
                  style={{ width: 100, height: 100, marginBottom: 24 }}
                />
              )}
              <Chat.Input
                onSendMessage={sendMessage}
                disabled={isGenerating}
                style={[{ maxWidth: 800 }, isWeb && { pointerEvents: "auto" }]}
              />
            </Container>
          </View>
        </KeyboardAvoidingView>
      </Chat>
    </Page>
  );
}
