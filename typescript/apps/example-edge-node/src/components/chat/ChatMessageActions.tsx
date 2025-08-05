import { View, ViewProps } from "react-native";

import Button from "../Button";
import CopyIcon from "../icons/CopyIcon";
import StartAgainIcon from "../icons/StartAgainIcon";

export default function ChatMessageActions(
  props: ViewProps & {
    onCopyAnswer: () => void;
    onStartAgain: () => void;
  },
) {
  return (
    <View
      {...props}
      style={[
        {
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        props.style,
      ]}
    >
      <Button
        color="secondary"
        flat
        icon={CopyIcon}
        iconMode="fill"
        text="Copy answer"
        onPress={props.onCopyAnswer}
      />
      <Button
        color="secondary"
        flat
        icon={StartAgainIcon}
        iconMode="stroke"
        text="Start again"
        onPress={props.onStartAgain}
      />
    </View>
  );
}
