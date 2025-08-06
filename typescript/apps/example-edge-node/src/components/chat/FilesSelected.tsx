import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";

import useColors from "@/hooks/useColors";

import type { FileDefinition } from "./ChatInput";

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
      {selectedFiles.map(({ name, mimeType, base64, uri }, i) => {
        let ext = "unknown";
        let isImage = false;

        switch (mimeType) {
          case "image/jpg":
          case "image/jpeg":
            ext = "JPEG";
            isImage = true;
            break;
          case "image/png":
            ext = "PNG";
            isImage = true;
            break;
          case "image/svg+xml":
            ext = "SVG";
            isImage = true;
            break;
          case "application/pdf":
            ext = "PDF";
            break;
          default:
            ext = "unknown";
            break;
        }

        return (
          <View
            key={name + "---" + i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 12,
              gap: 8,
              marginRight: 8,
            }}
          >
            {isImage ? (
              <Image
                source={{ uri: uri || base64 }}
                style={{ width: 40, height: 40 }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "#0c0c0c33",
                }}
              >
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={colors.secondary}
                  style={{ padding: 8 }}
                />
              </View>
            )}
            <View>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: "Manrope_600SemiBold",
                  fontSize: 16,
                  lineHeight: 24,
                }}
              >
                {name}
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: "Manrope_400Regular",
                  fontSize: 16,
                  lineHeight: 24,
                }}
              >
                {ext}
              </Text>
            </View>
          </View>
        );
      })}

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
