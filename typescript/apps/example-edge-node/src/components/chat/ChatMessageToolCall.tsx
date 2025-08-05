import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import useColors from "@/hooks/useColors";
import Button from "../Button";
import Checkbox from "../Checkbox";

export default function ToolCall({
  title,
  description,
  status,
  input,
  output,
  onConfirm,
  onCancel,
}: {
  title: string;
  description?: string;
  status: "init" | "loading" | "success" | "error" | "cancelled";
  input?: unknown;
  output?: unknown;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const colors = useColors();
  const [collapsed, setCollapsed] = useState(true);

  if (status === "init" || status === "loading")
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.text }]}>
          {description}
        </Text>

        {/*<Text>{JSON.stringify(tc.args, null, 2)}</Text>*/}

        <Text style={{ color: colors.text, fontFamily: "Manrope_500Medium" }}>
          Note that MCP servers or malicious conversation content may attempt to
          missuse ‘Code’ through tools.
        </Text>
        <View />
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Button color="primary" text="Continue" onPress={onConfirm} />
          <Button color="card" text="Cancel" onPress={onCancel} />
          <Checkbox>
            <Text style={{ color: colors.secondary }}>
              Allow tool for this session
            </Text>
          </Checkbox>
        </View>
      </View>
    );

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        onPress={() => setCollapsed((c) => !c)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Ionicons
          name={collapsed ? "chevron-forward-outline" : "chevron-down-outline"}
          size={20}
          style={{ marginRight: 4 }}
          color={colors.text}
        />
        <Text style={[styles.title, { flex: 1, color: colors.text }]}>
          {title}
        </Text>
        <Ionicons
          name={status === "success" ? "checkmark" : "close"}
          size={20}
          style={{ marginLeft: 4 }}
          color={status === "error" ? colors.error : colors.secondary}
        />
      </TouchableOpacity>

      {!collapsed && (
        <View style={{ paddingHorizontal: 24, paddingTop: 8, gap: 8 }}>
          <Text style={[styles.title, { color: colors.text }]}>Input</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              {JSON.stringify(input, null, 2)}
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Output</Text>
          <View style={styles.codeBlock}>
            {status === "success" && (
              <Text style={styles.codeText}>
                {JSON.stringify(output, null, 2)}
              </Text>
            )}
            {status === "error" && (
              <Text style={[styles.codeText, { color: colors.error }]}>
                {`${output}`}
              </Text>
            )}
            {status === "cancelled" && (
              <Text style={[styles.codeText, { color: colors.secondary }]}>
                Tool call was cancelled by user.
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  title: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  description: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
  },
  codeBlock: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#0c0c0c33",
    width: "100%",
    maxHeight: 120,
    overflow: "scroll",
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "#ffffff",
  },
});
