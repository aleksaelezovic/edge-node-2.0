import { View, Text } from "react-native";

import Button from "../Button";
import Checkbox from "../Checkbox";
import useColors from "@/hooks/useColors";
import type { ToolCall as ToolCallType } from "@/shared/chat";
import { useChatContext } from "./ChatContext";

export default function ToolCall({ toolCall: tc }: { toolCall: ToolCallType }) {
  const { callTool, toolsInfo } = useChatContext();
  const colors = useColors();

  const toolInfo = toolsInfo[tc.name];

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
        {toolInfo
          ? `${toolInfo.title} - ${toolInfo.mcpServer} (MCP Server)`
          : tc.name}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontFamily: "Manrope_400Regular",
          fontSize: 12,
        }}
      >
        {toolInfo?.description || tc.name}
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
        <Button color="primary" text="Continue" onPress={() => callTool(tc)} />
        <Button color="card" text="Cancel" />
        <Checkbox>
          <Text style={{ color: colors.secondary }}>
            Allow tool for this session
          </Text>
        </Checkbox>
      </View>
    </View>
  );
}
