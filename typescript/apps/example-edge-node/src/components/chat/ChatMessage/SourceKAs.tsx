import { ComponentProps, useState } from "react";
import { Text, TouchableOpacity, View, ViewProps } from "react-native";

import useColors from "@/hooks/useColors";
import KAIcon from "@/components/icons/KAIcon";

import SourceKAsCollapsible from "./SourceKAs/SourceKAsCollapsible";
import SourceKAsChip from "./SourceKAs/SourceKAsChip";

const minChipWidth = 225;
const chipGap = 8;
const minLastChipWidth = 80;

type SourceKAsChipComponent = React.ReactElement<
  ComponentProps<typeof SourceKAsChip>
>;

export default function SourceKAs({
  children,
  onPress,
  style,
  ...props
}: Omit<ViewProps, "children"> & {
  onPress?: () => void;
  children: SourceKAsChipComponent[] | SourceKAsChipComponent;
}) {
  const [viewWidth, setViewWidth] = useState(0);
  const colors = useColors();

  const childrenArray = Array.isArray(children) ? children : [children];

  const numberOfVisibleChips =
    (minChipWidth + chipGap) * childrenArray.length - chipGap <= viewWidth
      ? childrenArray.length
      : Math.floor((viewWidth - minLastChipWidth) / (minChipWidth + chipGap));

  const numberOfHiddenChips = childrenArray.length - numberOfVisibleChips;

  return (
    <View
      {...props}
      style={[{ width: "100%", height: 64, flexDirection: "row" }, style]}
      onLayout={(e) => {
        setViewWidth(e.nativeEvent.layout.width);
      }}
    >
      {childrenArray.map(
        (child, i) =>
          i < numberOfVisibleChips && (
            <SourceKAsChip
              key={child.key ?? i}
              {...child.props}
              onPress={child.props.onPress ?? onPress}
              style={[
                child.props.style,
                { minWidth: minChipWidth, flex: 1, marginRight: chipGap },
              ]}
            />
          ),
      )}
      {numberOfHiddenChips > 0 && (
        <TouchableOpacity
          onPress={onPress}
          style={{
            backgroundColor: colors.card,
            padding: 12,
            borderRadius: 16,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            minWidth: minLastChipWidth,
          }}
        >
          {numberOfVisibleChips ? (
            <Text
              style={{
                color: colors.secondary,
                fontFamily: "Manrope_400Regular",
              }}
            >
              {`+ ${numberOfHiddenChips} more`}
            </Text>
          ) : (
            <>
              <KAIcon
                width={36}
                height={36}
                fill={colors.secondary}
                stroke={colors.secondary}
              />
              <View>
                <Text
                  style={{
                    color: colors.secondary,
                    fontFamily: "Manrope_400Regular",
                  }}
                >
                  {numberOfHiddenChips} Knowledge Assets
                </Text>
                <Text
                  style={{
                    color: colors.text,
                    fontFamily: "Manrope_400Regular",
                    fontSize: 11,
                  }}
                >
                  See more
                </Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

SourceKAs.Chip = SourceKAsChip;
SourceKAs.Collapsible = SourceKAsCollapsible;
