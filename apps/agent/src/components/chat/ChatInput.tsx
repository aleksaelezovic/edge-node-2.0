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
import { ChatMessage, toContents } from "@/shared/chat";
import { toError } from "@/shared/errors";
import { FileDefinition } from "@/shared/files";

import FilesSelected from "./ChatInput/FilesSelected";

export default function ChatInput({
  onSendMessage,
  onUploadFiles = (assets) =>
    assets.map((a) => ({
      id: a.uri,
      uri: a.uri,
      name: a.name,
      mimeType: a.mimeType,
    })),
  onUploadError,
  onAttachFiles = (files) =>
    files.map((f) => ({
      type: "file",
      file: {
        filename: f.name,
        file_data: f.uri,
      },
    })),
  onFileRemoved,
  disabled,
  style,
}: {
  onSendMessage: (message: ChatMessage) => void;
  onUploadFiles?: (
    files: DocumentPicker.DocumentPickerAsset[],
  ) => FileDefinition[] | Promise<FileDefinition[]>;
  onUploadError?: (error: Error) => void;
  onAttachFiles?: (files: FileDefinition[]) => ChatMessage["content"];
  onFileRemoved?: (file: FileDefinition) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileDefinition[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onSubmit = useCallback(() => {
    onSendMessage({
      role: "user",
      content: [
        ...toContents(onAttachFiles(selectedFiles)),
        { type: "text", text: message.trim() },
      ],
    });
    setMessage("");
    setSelectedFiles([]);
  }, [message, selectedFiles, onSendMessage, onAttachFiles]);

  return (
    <View style={[{ width: "100%", position: "relative" }, style]}>
      {!!selectedFiles.length && (
        <FilesSelected
          selectedFiles={selectedFiles}
          onRemove={(removedFile) => {
            setSelectedFiles((files) =>
              files.filter((f) => f.id !== removedFile.id),
            );
            onFileRemoved?.(removedFile);
          }}
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
            disabled={disabled}
          />
          <Button
            color="primary"
            icon={ArrowUpIcon}
            style={styles.inputButton}
            disabled={!message.trim() || disabled || isUploading}
            onPress={onSubmit}
          />
        </View>
      </View>
      <View style={styles.inputTools}>
        <Button
          disabled={disabled || isUploading}
          color="secondary"
          flat
          icon={AttachFileIcon}
          text="Attach file(s)"
          style={{ height: "100%" }}
          onPress={() => {
            setIsUploading(true);
            DocumentPicker.getDocumentAsync({
              base64: true,
              multiple: true,
            })
              .then((r) => {
                if (!r.assets) return [];
                return onUploadFiles(r.assets);
              })
              .then((newFiles) =>
                setSelectedFiles((oldFiles) => [
                  ...new Set([...oldFiles, ...newFiles]),
                ]),
              )
              .catch((error) => onUploadError?.(toError(error)))
              .finally(() => setIsUploading(false));
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
