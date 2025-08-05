import { useCallback, useEffect, useState } from "react";
import { View, Platform, KeyboardAvoidingView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import { fetch } from "expo/fetch";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useMcpClient } from "@/client";
import useColors from "@/hooks/useColors";
import usePlatform from "@/hooks/usePlatform";
import Page from "@/components/layout/Page";
import Container from "@/components/layout/Container";
import Header from "@/components/layout/Header";
import ChatInput from "@/components/chat/ChatInput";
import Messages from "@/components/chat/Messages";

import {
  type ToolDefinition,
  type ChatMessage,
  type ToolCallResultContent,
  makeCompletionRequest,
} from "@/shared/chat";

export default function Chat() {
  const colors = useColors();
  const { isNativeMobile, isWeb } = usePlatform();

  const { code: authorizationCode } = useLocalSearchParams<{ code?: string }>();
  const onAuthorized = useCallback(() => router.navigate("/chat"), []);
  const { connected, mcp, getToken } = useMcpClient({
    authorizationCode,
    onAuthorized,
  });
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const safeAreaInsets = useSafeAreaInsets();

  useEffect(() => {
    if (!connected) return;
    SplashScreen.hide();
    mcp
      .listTools()
      .then(({ tools }) => {
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
      })
      .catch((error) => {
        console.log("Error listing MCP tools: ", error.message);
      });
  }, [connected, mcp]);

  async function sendMessage() {
    if (!message.trim()) return;

    const newMessage: ChatMessage = {
      role: "user",
      content: message.trim(),
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setMessage("");

    const token = await getToken();
    if (!token) throw new Error("Unauthorized");

    const completion = await makeCompletionRequest(
      { messages: [...messages, newMessage], tools },
      {
        fetch: (url, opts) => fetch(url.toString(), opts as any),
        bearerToken: token,
      },
    );
    setMessages((prevMessages) => [...prevMessages, completion]);
  }

  const isLandingScreen = !messages.length && !isNativeMobile;

  return (
    <Page style={{ flex: 1, position: "relative", marginBottom: 0 }}>
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
          <Messages
            messages={messages}
            callTool={(tc) => {
              mcp
                ?.callTool({
                  name: tc.name,
                  arguments: tc.args,
                })
                .then((result) => {
                  setMessages((prevMessages) => [
                    ...prevMessages,
                    {
                      role: "tool",
                      tool_call_id: tc.id,
                      content: result.content as ToolCallResultContent,
                    },
                  ]);
                });
            }}
          />
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
            <ChatInput
              value={message}
              onChangeText={setMessage}
              onSubmit={sendMessage}
              style={[
                isLandingScreen && { maxWidth: 800 },
                isWeb && { pointerEvents: "auto" },
              ]}
            />
          </Container>
        </View>
      </KeyboardAvoidingView>
    </Page>
  );
}
