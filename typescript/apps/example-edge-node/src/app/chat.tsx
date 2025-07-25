import { useCallback, useEffect, useState } from "react";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Button,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { fetch } from "expo/fetch";
import type OpenAI from "openai";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useMcpClient } from "@/client";

export default function Chat() {
  const { code: authorizationCode } = useLocalSearchParams<{ code?: string }>();
  const onAuthorized = useCallback(() => router.navigate("/chat"), []);
  const mcp = useMcpClient({ authorizationCode, onAuthorized });

  const [tools, setTools] = useState<OpenAI.ChatCompletionTool[]>([]);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<OpenAI.ChatCompletionMessageParam[]>(
    [],
  );

  useEffect(() => {
    if (!mcp) return;
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
  }, [mcp]);

  useEffect(() => {
    if (messages.at(-1)?.role === "user")
      fetch(process.env.EXPO_PUBLIC_APP_URL + "/llm", {
        method: "POST",
        body: JSON.stringify({
          model: "gpt-4",
          messages,
          tools,
        }),
      })
        .then((r) => r.json())
        .then((r) => r.choices?.at(0)?.message)
        .then((m) => {
          if (!m) throw new Error("No message received");
          setMessages((prevMessages) => [...prevMessages, m]);
        });
  }, [messages, tools]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edge Node Chat</Text>
        <Button title="Clear" onPress={() => AsyncStorage.clear()} />
        <View style={styles.statusContainer}>
          {mcp ? (
            <Text style={styles.statusConnected}>● Connected</Text>
          ) : (
            <Text style={styles.statusConnecting}>● Connecting...</Text>
          )}
          <Text style={styles.toolsCount}>{tools.length} tools available</Text>
        </View>
      </View>

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
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#2c3e50",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusConnected: {
    color: "#2ecc71",
    fontWeight: "600",
  },
  statusConnecting: {
    color: "#f39c12",
    fontWeight: "600",
  },
  toolsCount: {
    color: "#ecf0f1",
    fontSize: 12,
  },
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
  inputContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "flex-end",
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
