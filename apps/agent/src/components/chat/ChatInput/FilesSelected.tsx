import { ScrollView } from "react-native";

import AttachmentChip from "./AttachmentChip";
import { FileDefinition } from "@/shared/files";

export default function FilesSelected({
  selectedFiles,
  onRemove,
}: {
  selectedFiles: FileDefinition[];
  onRemove: (file: FileDefinition) => void;
}) {
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
        <AttachmentChip
          key={file.id}
          file={file}
          onRemove={() => onRemove(file)}
        />
      ))}
    </ScrollView>
  );
}
