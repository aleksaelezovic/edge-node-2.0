import { useCallback, useEffect, useState } from "react";
import { View, Platform, KeyboardAvoidingView } from "react-native";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import { fetch } from "expo/fetch";
import { useSafeAreaInsets } from "react-native-safe-area-context";
//import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseSourceKAContent } from "@dkg/plugin-dkg-essentials/utils";
import { ToolListChangedNotificationSchema } from "@modelcontextprotocol/sdk/types.js";

import { useMcpClient } from "@/client";
import useColors from "@/hooks/useColors";
import usePlatform from "@/hooks/usePlatform";
import Page from "@/components/layout/Page";
import Container from "@/components/layout/Container";
import Header from "@/components/layout/Header";
import Chat from "@/components/chat/Chat";
import { SourceKAResolver } from "@/components/chat/ChatMessage/SourceKAs/SourceKAsCollapsibleItem";
import { useAlerts } from "@/components/Alerts";

import {
  type ChatMessage,
  type ToolDefinition,
  type ToolCall,
  type ToolCallResultContent,
  type ToolsInfoMap,
  type ToolCallsMap,
  makeCompletionRequest,
  toContents,
} from "@/shared/chat";
import {
  parseFilesFromContent,
  serializeFiles,
  uploadFiles,
} from "@/shared/files";
import { toError } from "@/shared/errors";

export default function ChatPage() {
  const colors = useColors();
  const { isNativeMobile, isWeb, width } = usePlatform();

  const { connected, mcp, token } = useMcpClient();
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [toolsInfo, setToolsInfo] = useState<ToolsInfoMap>({});
  const [toolCalls, setToolCalls] = useState<ToolCallsMap>({});
  const [toolsAllowed, setToolsAllowed] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const safeAreaInsets = useSafeAreaInsets();
  const activeTools = tools.filter((t) => toolsInfo[t.function.name]?.active);

  const { showAlert } = useAlerts();

  const fetchTools = useCallback(async () => {
    try {
      const { tools } = await mcp.listTools();
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
          name: tool.name,
          title: tool.title,
          description: tool.description,
          mcpServer: "dkg-agent-2.0",
          active: true,
        };
      }
      setTools(toolFns);
      setToolsInfo(toolsInfo);
    } catch (error) {
      showAlert({
        type: "error",
        title: "Error listing MCP tools",
        message: toError(error).message,
      });
    }
  }, [mcp, showAlert]);

  useEffect(() => {
    if (!connected) return;

    fetchTools();
    mcp.setNotificationHandler(ToolListChangedNotificationSchema, () => {
      fetchTools();
    });
  }, [mcp, connected, fetchTools]);

  async function callTool(tc: ToolCall) {
    setToolCalls((p) => ({
      ...p,
      [tc.id!]: { input: tc.args, status: "loading" },
    }));

    return mcp
      .callTool({ name: tc.name, arguments: tc.args }, undefined, {
        timeout: 300000,
        maxTotalTimeout: 300000,
      })
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

    if (!token) throw new Error("Unauthorized");

    setIsGenerating(true);
    const completion = await makeCompletionRequest(
      {
        messages: [...messages, newMessage],
        tools: activeTools,
      },
      {
        fetch: (url, opts) => fetch(url.toString(), opts as any),
        bearerToken: token,
      },
    );

    if (newMessage.role === "tool") {
      for (const c of toContents(newMessage.content) as ToolCallResultContent) {
        const kas = parseSourceKAContent(c);
        if (!kas) continue;

        completion.content = toContents(completion.content);
        completion.content.push(c);
      }
    }

    setMessages((prevMessages) => [...prevMessages, completion]);
    setIsGenerating(false);
  }

  const kaResolver = useCallback<SourceKAResolver>(
    async (ual) => {
      try {
        const resource = await mcp.readResource({ uri: ual });
        const content = resource.contents[0]?.text as string;
        if (!content) throw new Error("Resource not found");

        const parsedContent = JSON.parse(content);
        const resolved = {
          assertion: parsedContent.assertion,
          lastUpdated: new Date(
            parsedContent.metadata
              .at(0)
              ?.[
                "https://ontology.origintrail.io/dkg/1.0#publishTime"
              ]?.at(0)?.["@value"] ?? Date.now(),
          ).getTime(),
          txHash: parsedContent.metadata
            .at(0)
            ?.["https://ontology.origintrail.io/dkg/1.0#publishTx"]?.at(0)?.[
            "@value"
          ],
          publisher: parsedContent.metadata
            .at(0)
            ?.["https://ontology.origintrail.io/dkg/1.0#publishedBy"]?.at(0)
            ?.["@id"]?.split("/")
            .at(1),
        };

        // hotfix, KC metadata not present in KA metadata
        if (!resolved.txHash || !resolved.publisher) {
          const splitUal = ual.split("/");
          splitUal.pop();
          const kcUal = splitUal.join("/");
          const resource = await mcp.readResource({ uri: kcUal });
          const content = resource.contents[0]?.text as string;
          if (!content) {
            resolved.publisher = "unknown";
            resolved.txHash = "unknown";
            return resolved;
          }

          const parsedContent = JSON.parse(content);
          resolved.txHash =
            parsedContent.metadata
              .at(0)
              ?.["https://ontology.origintrail.io/dkg/1.0#publishTx"]?.at(0)?.[
              "@value"
            ] ?? "unknown";
          resolved.publisher =
            parsedContent.metadata
              .at(0)
              ?.["https://ontology.origintrail.io/dkg/1.0#publishedBy"]?.at(0)
              ?.["@id"]?.split("/")
              .at(1) ?? "unknown";
        }

        return resolved;
      } catch (error) {
        showAlert({
          type: "error",
          title: "Failed to resolve Knowledge Asset",
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [mcp, showAlert],
  );

  const isLandingScreen = !messages.length && !isNativeMobile;
  console.debug("Messages:", messages);
  console.debug("Tools (active):", activeTools);

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

                const content = toContents(m.content);

                const [kas, kasIndex] = (() => {
                  for (const [i, c] of content.entries()) {
                    const kas = parseSourceKAContent(c as unknown as any);
                    if (!kas) continue;

                    return [kas, i];
                  }
                  return [[], -1];
                })();

                const [allFiles, filesIndex] = (() => {
                  for (const [i, c] of content.entries()) {
                    const files = parseFilesFromContent(c);
                    if (!files.length) continue;

                    return [files, i];
                  }
                  return [[], -1];
                })();

                const images = allFiles.filter((f) =>
                  f.mimeType?.startsWith("image/"),
                );

                const files = allFiles.filter(
                  (f) => !f.mimeType?.startsWith("image/"),
                );

                return (
                  <Chat.Message
                    key={i}
                    icon={m.role as "user" | "assistant"}
                    style={{ gap: 8 }}
                  >
                    {/* Source Knowledge Assets */}
                    <Chat.Message.SourceKAs kas={kas} resolver={kaResolver} />

                    {/* Images */}
                    {images.map((image, i) => (
                      <Chat.Message.Content.Image
                        key={i}
                        url={image.uri}
                        authToken={token}
                      />
                    ))}

                    {/* Files */}
                    {files.map((file, i) => (
                      <Chat.Message.Content.File key={i} file={file} />
                    ))}

                    {/* Message contnet (text/image) */}
                    {content.map(
                      (c, i) =>
                        i !== kasIndex &&
                        i !== filesIndex && (
                          <Chat.Message.Content key={i} content={c} />
                        ),
                    )}

                    {/* Tool calls */}
                    {m.tool_calls?.map((tc, i) => {
                      if (!tc.id) tc.id = i.toString();
                      const toolInfo = toolsInfo[tc.name];
                      const toolTitle = toolInfo
                        ? `${toolInfo.name} - ${toolInfo.mcpServer} (MCP Server)`
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
                onUploadFiles={(assets) =>
                  uploadFiles(
                    new URL(process.env.EXPO_PUBLIC_MCP_URL + "/blob"),
                    assets,
                    {
                      fieldName: "file",
                      uploadType: 1,
                      headers: { Authorization: `Bearer ${token}` },
                    },
                  ).then((result) => {
                    const successfulUploads = result
                      .filter((f) => f.status === "fulfilled")
                      .filter((f) => f.value.status < 300);

                    if (successfulUploads.length !== result.length) {
                      console.error("Some uploads failed");
                      console.log(
                        "Failed uploads:",
                        result
                          .filter((f) => f.status !== "fulfilled")
                          .map((f) => f.reason),
                      );
                      showAlert({
                        type: "error",
                        title: "Upload error",
                        message: "Some uploads failed!",
                        timeout: 5000,
                      });
                    }

                    return successfulUploads.map(({ value }) => {
                      const body = JSON.parse(value.body);
                      return {
                        ...body,
                        uri: new URL(
                          process.env.EXPO_PUBLIC_MCP_URL + "/blob/" + body.id,
                        ).toString(),
                      };
                    });
                  })
                }
                onFileRemoved={(f) => {
                  fetch(
                    new URL(
                      process.env.EXPO_PUBLIC_MCP_URL + "/blob/" + f.id,
                    ).toString(),
                    {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    },
                  ).catch((error) => {
                    showAlert({
                      type: "error",
                      title: "File removal error",
                      message: toError(error).message,
                      timeout: 5000,
                    });
                  });
                }}
                onUploadError={(err) =>
                  showAlert({
                    type: "error",
                    title: "Upload error",
                    message: err.message,
                    timeout: 5000,
                  })
                }
                onAttachFiles={serializeFiles}
                authToken={token}
                toolsInfo={toolsInfo}
                setToolsInfo={setToolsInfo}
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
