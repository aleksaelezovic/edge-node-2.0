import { useCallback, useState } from "react";
import {
  View,
  TextInput,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";

import Button from "@/components/Button";
import ArrowUpIcon from "@/components/icons/ArrowUpIcon";
import MicrophoneIcon from "@/components/icons/MicrophoneIcon";
import AttachFileIcon from "@/components/icons/AttachFileIcon";
import ToolsIcon from "@/components/icons/ToolsIcon";
import useColors from "@/hooks/useColors";
import { ChatMessage } from "@/shared/chat";
import usePlatform from "@/hooks/usePlatform";

import FilesSelected from "./FilesSelected";

export type FileDefinition = {
  uri?: string;
  name?: string;
  mimeType?: string;
  base64: string;
};

export default function ChatInput({
  onSendMessage,
  disabled,
  style,
}: {
  onSendMessage: (message: ChatMessage) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const { isWeb } = usePlatform();
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileDefinition[]>([]);

  const onSubmit = useCallback(() => {
    onSendMessage({
      role: "user",
      content: message.trim(),
    });
    setMessage("");
  }, [message, onSendMessage]);

  return (
    <View style={[{ width: "100%", position: "relative" }, style]}>
      {!!selectedFiles.length && (
        <FilesSelected
          selectedFiles={selectedFiles}
          onClear={() => setSelectedFiles([])}
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
            disabled={!message.trim() || disabled}
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
          onPress={() => {
            if (isWeb)
              DocumentPicker.getDocumentAsync().then((r) => {
                if (!r.assets) return;
                setSelectedFiles((oldFiles) => {
                  const newFiles: FileDefinition[] = r.assets.map((a) => ({
                    name: a.name,
                    size: a.size,
                    mimeType: a.mimeType,
                    base64: a.uri,
                  }));
                  return [...new Set([...oldFiles, ...newFiles])];
                });
              });
          }}
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
