import { useCallback, useState } from "react";
import { Text, View } from "react-native";

import useColors from "@/hooks/useColors";
import Checkbox from "@/components/Checkbox";
import Button from "@/components/Button";

export default function McpAutoapproveForm({
  currentValue,
  onSubmit,
}: {
  currentValue: boolean;
  onSubmit: (value: boolean) => Promise<void>;
}) {
  const colors = useColors();
  const [value, setValue] = useState(currentValue);
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async () => {
    setLoading(true);
    try {
      await onSubmit(value);
    } finally {
      setLoading(false);
    }
  }, [onSubmit, value]);

  return (
    <View style={{ flex: 1 }}>
      <Checkbox value={value} onValueChange={setValue}>
        <Text
          style={{
            fontFamily: "Manrope_400Regular",
            color: colors.text,
            fontSize: 16,
            lineHeight: 16,
          }}
        >
          Auto-approve MCP tools
        </Text>
      </Checkbox>
      <Text
        style={{
          fontFamily: "Manrope_400Regular",
          color: colors.placeholder,
          fontSize: 12,
          lineHeight: 18,
          marginBottom: 8,
        }}
      >
        Run tools automatically in the background without showing execution
        boxes. Errors will still be shown as notifications.
      </Text>
      <Button
        color="primary"
        text="Update"
        onPress={submit}
        disabled={loading || value === currentValue}
      />
    </View>
  );
}
