import {
  View,
  TextInput,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from "react-native";

import Button from "@/components/Button";
import ArrowUpIcon from "@/components/icons/ArrowUpIcon";
import MicrophoneIcon from "@/components/icons/MicrophoneIcon";
import AttachFileIcon from "@/components/icons/AttachFileIcon";
import ToolsIcon from "@/components/icons/ToolsIcon";
import useColors from "@/hooks/useColors";

export default function ChatInput({
  value,
  onChangeText,
  onSubmit,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();

  return (
    <View style={[{ width: "100%" }, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.input, color: colors.text },
          ]}
          placeholder="Ask anything..."
          placeholderTextColor={colors.placeholder}
          onChangeText={onChangeText}
          value={value}
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
            disabled={!value.trim()}
            onPress={onSubmit}
          />
        </View>
      </View>
      <View style={styles.inputTools}>
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
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    position: "relative",
    height: 56,
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
  inputTools: {
    position: "relative",
    width: "100%",
    height: 40,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
    paddingHorizontal: 8,
  },
});
