import { Modal, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";

import Background from "@/components/layout/Background";
import useColors from "@/hooks/useColors";

import SourceKAsCollapsible from "./SourceKAsCollapsible";
import type { SourceKA } from "../SourceKAs";

export default function SourceKAsModal(props: {
  kas: SourceKA[];
  visible?: boolean;
  onClose?: () => void;
}) {
  const colors = useColors();

  const modalWidth = useSharedValue(800);
  const modalHeight = useSharedValue(500);

  function handleExpand(isExpanded: boolean) {
    if (isExpanded) {
      modalWidth.value = withTiming(1200);
      modalHeight.value = withTiming(600);
    } else {
      modalWidth.value = withTiming(800);
      modalHeight.value = withTiming(500);
    }
  }

  const sizeStyle = useAnimatedStyle(() => ({
    maxHeight: modalHeight.value,
    maxWidth: modalWidth.value,
  }));

  return (
    <Modal
      animationType="fade"
      visible={props.visible}
      onRequestClose={props.onClose}
      transparent
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#00000040",
          padding: 20,
        }}
      >
        <Animated.View
          style={[
            {
              width: "100%",
              height: "100%",
              borderRadius: 8,
              overflow: "hidden",
            },
            sizeStyle,
          ]}
        >
          <Background>
            <View
              style={{
                flex: 1,
                paddingTop: 32,
                paddingBottom: 24,
                position: "relative",
              }}
            >
              <Ionicons
                name="close"
                size={24}
                color={colors.secondary}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                }}
                onPress={props.onClose}
              />
              <SourceKAsCollapsible
                style={{ gap: 24, paddingHorizontal: 24 }}
                onExpandChange={handleExpand}
              >
                {props.kas.map((ka, index) => (
                  <SourceKAsCollapsible.Item key={index} {...ka} />
                ))}
              </SourceKAsCollapsible>
            </View>
          </Background>
        </Animated.View>
      </View>
    </Modal>
  );
}
