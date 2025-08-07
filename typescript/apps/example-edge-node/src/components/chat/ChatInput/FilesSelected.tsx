import { ScrollView, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import useColors from "@/hooks/useColors";

import AttachmentChip from "./AttachmentChip";
import type { FileDefinition } from "../ChatInput";

export default function FilesSelected({
  selectedFiles,
  onClear,
}: {
  selectedFiles: FileDefinition[];
  onClear: () => void;
}) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      style={{
        position: "absolute",
        top: -80,
        left: 0,
        height: 72,
        maxWidth: "100%",
      }}
    >
      {selectedFiles.map((file, i) => (
        <AttachmentChip key={file.name + "---" + i} file={file} />
      ))}

      <TouchableOpacity onPress={onClear}>
        <Ionicons
          name="close"
          size={56}
          color={colors.secondary}
          style={{
            padding: 8,
            height: 72,
            width: 72,
            backgroundColor: colors.card,
            borderRadius: 16,
          }}
        />
      </TouchableOpacity>
    </ScrollView>
  );
}
