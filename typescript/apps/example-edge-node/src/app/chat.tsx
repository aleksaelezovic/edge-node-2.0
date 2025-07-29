import { useCallback, useEffect, useState } from "react";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import { fetch } from "expo/fetch";
import type OpenAI from "openai";
//import AsyncStorage from "@react-native-async-storage/async-storage";

import { useMcpClient } from "@/client";
import useColors from "@/hooks/useColors";
import Button from "@/components/Button";
import ArrowUpIcon from "@/components/icons/ArrowUpIcon";
import MicrophoneIcon from "@/components/icons/MicrophoneIcon";
import AttachFileIcon from "@/components/icons/AttachFileIcon";
import ToolsIcon from "@/components/icons/ToolsIcon";

export default function Chat() {
  const colors = useColors();
  const { code: authorizationCode } = useLocalSearchParams<{ code?: string }>();
  const onAuthorized = useCallback(() => router.navigate("/chat"), []);
  const { connected, mcp, getToken } = useMcpClient({
    authorizationCode,
    onAuthorized,
  });

  const [tools, setTools] = useState<OpenAI.ChatCompletionTool[]>([]);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<OpenAI.ChatCompletionMessageParam[]>(
    [],
  );

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

  useEffect(() => {
    if (messages.at(-1)?.role === "user")
      getToken()
        .then((token) => {
          if (!token) throw new Error("Not authenticated.");
          return token;
        })
        .then((token) =>
          fetch(process.env.EXPO_PUBLIC_APP_URL + "/llm", {
            method: "POST",
            body: JSON.stringify({
              model: "gpt-4",
              messages,
              tools,
            }),
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then((r) => r.choices?.at(0)?.message)
            .then((m) => {
              if (!m) throw new Error("No message received");
              setMessages((prevMessages) => [...prevMessages, m]);
            }),
        );
  }, [messages, tools, getToken]);

  if (!messages.length)
    return (
      <View style={styles.container}>
        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            flex:
              Platform.OS === "ios" || Platform.OS === "android"
                ? 1
                : undefined,
            width: "100%",
            padding: 0,
            marginTop: 80,
          }}
        >
          {!(Platform.OS === "ios" || Platform.OS === "android") && (
            <Image
              source={require("../assets/logo.svg")}
              style={{ width: 100, height: 100, marginBottom: 24 }}
            />
          )}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.input, color: colors.text },
              ]}
              placeholder="Ask anything..."
              placeholderTextColor={colors.placeholder}
              onChangeText={setMessage}
              value={message}
              multiline
            />
            <View style={styles.inputButtons}>
              <Button
                color="secondary"
                flat
                icon={MicrophoneIcon}
                iconMode="fill"
                style={styles.inputButton}
              />
              <Button
                color="primary"
                icon={ArrowUpIcon}
                style={styles.inputButton}
              />
            </View>
          </View>
          <View
            style={[
              styles.inputContainer,
              {
                height: 40,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginVertical: 8,
                paddingHorizontal: 8,
              },
            ]}
          >
            <Button
              color="secondary"
              flat
              icon={AttachFileIcon}
              text="Attach file(s)"
              style={{ height: "100%" }}
            />
            <Button
              color="secondary"
              flat
              icon={ToolsIcon}
              style={{ height: "100%", aspectRatio: 1 }}
            />
          </View>
        </View>
      </View>
    );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.messagesContainer}>
        {messages.map((m, i) => (
          <View key={i} style={styles.messageWrapper}>
            <View
              style={[
                styles.messageBubble,
                m.role === "user"
                  ? styles.userMessage
                  : styles.assistantMessage,
              ]}
            >
              <Text style={styles.roleLabel}>{m.role.toUpperCase()}</Text>

              {m.role === "user" && (
                <Text style={styles.messageText}>{m.content.toString()}</Text>
              )}

              {m.role === "tool" && (
                <Text style={styles.toolMessage}>
                  {typeof m.content === "string"
                    ? m.content
                    : m.content.map((item, index) => (
                        <Text key={index}>{item.text}</Text>
                      ))}
                </Text>
              )}

              {m.role === "assistant" && (
                <View>
                  {m.tool_calls?.map((tc, j) => (
                    <View key={j} style={styles.toolCallContainer}>
                      <Text style={styles.toolCallName}>
                        {tc.function.name}
                      </Text>
                      <Text style={styles.toolCallArgs}>
                        {tc.function.arguments}
                      </Text>
                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => {
                          mcp
                            ?.callTool({
                              name: tc.function.name,
                              arguments: JSON.parse(tc.function.arguments),
                            })
                            .then((result) => {
                              setMessages((prevMessages) => [
                                ...prevMessages,
                                {
                                  role: "tool",
                                  tool_call_id: tc.id,
                                  content: result.content as string,
                                },
                              ]);
                            });
                        }}
                      >
                        <Text style={styles.callButtonText}>Call Function</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type your message..."
          placeholderTextColor="#666"
          onChangeText={setMessage}
          value={message}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !message.trim() && styles.sendButtonDisabled,
          ]}
          disabled={!message.trim()}
          onPress={() => {
            if (message.trim()) {
              setMessages((prevMessages) => [
                ...prevMessages,
                { role: "user", content: message },
              ]);
              setMessage("");
            }
          }}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputContainer: {
    position: "relative",
    height: 56,
    maxWidth: 800,
    width: "100%",
  },
  input: {
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 16,
    height: 56,
    fontSize: 16,
    lineHeight: 24,
  },
  inputButtons: {
    position: "absolute",
    right: 0,
    padding: 4,
    gap: 4,
    flexDirection: "row",
    height: "100%",
  },
  inputButton: {
    height: "100%",
    aspectRatio: 1,
  },

  // old..
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  messageWrapper: {
    marginBottom: 15,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessage: {
    backgroundColor: "#3498db",
    alignSelf: "flex-end",
  },
  assistantMessage: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#7f8c8d",
    textTransform: "uppercase",
  },
  messageText: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 20,
  },
  toolMessage: {
    fontSize: 14,
    color: "#2c3e50",
    backgroundColor: "#ecf0f1",
    padding: 8,
    borderRadius: 6,
    fontFamily: "monospace",
  },
  toolCallContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3498db",
  },
  toolCallName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  toolCallArgs: {
    fontSize: 12,
    color: "#7f8c8d",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  callButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  callButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
    backgroundColor: "#f8f9fa",
  },
  sendButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
