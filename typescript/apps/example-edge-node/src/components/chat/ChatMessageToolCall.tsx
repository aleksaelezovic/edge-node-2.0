import { View, Text } from "react-native";

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

  return (
    <View
      style={{
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 16,
        gap: 8,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontFamily: "Manrope_600SemiBold",
          fontSize: 14,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontFamily: "Manrope_400Regular",
          fontSize: 12,
        }}
      >
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
}
