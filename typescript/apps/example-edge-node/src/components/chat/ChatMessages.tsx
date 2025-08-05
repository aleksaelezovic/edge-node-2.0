import { ScrollView, ViewProps } from "react-native";

export default function ChatMessages(props: ViewProps) {
  return (
    <ScrollView
      {...props}
      style={[
        {
          flex: 1,
          paddingVertical: 16,
        },
        props.style,
      ]}
    >
      {props.children}
    </ScrollView>
  );
}
