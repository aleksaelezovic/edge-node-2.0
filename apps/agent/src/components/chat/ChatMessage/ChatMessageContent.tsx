import { View } from "react-native";
import { Image, useImage } from "expo-image";
import type { MessageContentComplex } from "@langchain/core/messages";

import Markdown from "@/components/Markdown";
import AttachmentChip from "../ChatInput/AttachmentChip";

function TextContent(props: { text: string }) {
  return <Markdown>{props.text}</Markdown>;
}

function ImageContent(props: { url: string }) {
  const image = useImage(props.url);

  return (
    <Image
      source={image}
      style={{
        height: 300,
        width: !image ? 300 : image.width / (image.height / 300),
        borderRadius: 12,
      }}
      contentFit="cover"
    />
  );
}

function FileContent(props: { name: string; base64: string }) {
  const mimeType = props.base64.split(";").at(0)?.split(":")[1];

  return (
    <View style={{ display: "flex", flexDirection: "row" }}>
      <AttachmentChip
        file={{ name: props.name, base64: props.base64, mimeType }}
      />
    </View>
  );
}

export default function ChatMessageContent({
  content: c,
}: {
  content: MessageContentComplex;
}) {
  if (c.type === "text" && c.text) {
    return <TextContent text={c.text} />;
  }
  if (c.type === "image_url") {
    return <ImageContent url={c.image_url?.url ?? c.image_url} />;
  }
  if (c.type === "file") {
    return (
      <FileContent
        name={c.file?.filename ?? "unknown"}
        base64={c.file.file_data}
      />
    );
  }
  return null;
}
