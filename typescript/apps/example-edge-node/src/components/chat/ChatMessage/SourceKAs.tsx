import { useState } from "react";
import { View, ViewProps } from "react-native";
import type { SourceKA } from "@dkg/plugin-dkg-essentials/utils";

import SourceKAsCollapsible from "./SourceKAs/SourceKAsCollapsible";
import SourceKAsChip from "./SourceKAs/SourceKAsChip";
import SourceKAsModal from "./SourceKAs/SourceKAsModal";
import MoreChip from "./SourceKAs/MoreChip";
import { SourceKAResolver } from "./SourceKAs/SourceKAsCollapisbleItem";

const minChipWidth = 225;
const chipGap = 8;
const minLastChipWidth = 80;

// type SourceKAsChipComponent = React.ReactElement<
//   ComponentProps<typeof SourceKAsChip>
// >;

export default function SourceKAs({
  kas,
  resolver,
  style,
  ...props
}: Omit<ViewProps, "children"> & {
  kas: SourceKA[];
  resolver: SourceKAResolver;

  //children?: SourceKAsChipComponent[] | SourceKAsChipComponent;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [viewWidth, setViewWidth] = useState(0);

  // const childrenArray = !children
  //   ? []
  //   : Array.isArray(children)
  //     ? children
  //     : [children];

  const numberOfVisibleChips =
    (minChipWidth + chipGap) * kas.length - chipGap <= viewWidth
      ? kas.length
      : Math.floor((viewWidth - minLastChipWidth) / (minChipWidth + chipGap));

  const numberOfHiddenChips = kas.length - numberOfVisibleChips;

  if (!kas.length) return null;

  return (
    <View
      {...props}
      style={[{ width: "100%", height: 64, flexDirection: "row" }, style]}
      onLayout={(e) => {
        setViewWidth(e.nativeEvent.layout.width);
      }}
    >
      {kas.map(
        (ka, i) =>
          i < numberOfVisibleChips && (
            <SourceKAsChip
              key={i}
              title={ka.title}
              issuer={ka.issuer}
              onPress={() => setModalVisible(true)}
              style={{ minWidth: minChipWidth, flex: 1, marginRight: chipGap }}
            />
          ),
      )}
      {numberOfHiddenChips > 0 && (
        <MoreChip
          moreNumber={numberOfHiddenChips}
          zeroVisible={numberOfVisibleChips === 0}
          style={{ minWidth: minLastChipWidth }}
          onPress={() => setModalVisible(true)}
        />
      )}

      <SourceKAsModal
        kas={kas}
        resolver={resolver}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

SourceKAs.Chip = SourceKAsChip;
SourceKAs.MoreChip = MoreChip;
SourceKAs.Modal = SourceKAsModal;
SourceKAs.Collapsible = SourceKAsCollapsible;
