import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { ChatMessage, ToolCall } from "@/shared/chat";

export default function Messages(props: {
  messages: ChatMessage[];
  callTool: (tc: ToolCall) => void;
}) {
  return (
    <ScrollView
      style={{
        flex: 1,
        paddingVertical: 8,
      }}
    >
      {props.messages.map((m, i) => (
        <View key={i} style={styles.messageWrapper}>
          <View
            style={[
              styles.messageBubble,
              m.role === "user" ? styles.userMessage : styles.assistantMessage,
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
                      <Text key={index}>
                        {item.type === "text" ? item.text : item.type}
                      </Text>
                    ))}
              </Text>
            )}

            {m.role === "assistant" && (
              <View>
                {m.tool_calls?.map((tc, j) => (
                  <View key={j} style={styles.toolCallContainer}>
                    <Text style={styles.toolCallName}>{tc.name}</Text>
                    <Text style={styles.toolCallArgs}>
                      {JSON.stringify(tc.args, null, 2)}
                    </Text>
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => props.callTool(tc)}
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
  );
}

const styles = StyleSheet.create({
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
});
