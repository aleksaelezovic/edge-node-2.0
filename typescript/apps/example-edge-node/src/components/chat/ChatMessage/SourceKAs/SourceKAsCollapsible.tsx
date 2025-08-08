import { ComponentProps, useState } from "react";
import { ScrollView, ViewProps } from "react-native";

import SourceKAsCollapsibleItem from "./SourceKAsCollapisbleItem";

type SourceKAsCollapsibleItemComponent = React.ReactElement<
  ComponentProps<typeof SourceKAsCollapsibleItem>
>;

export default function SourceKAsCollapsible({
  children,
  style,
  onExpandChange,
  ...props
}: Omit<ViewProps, "children"> & {
  children:
    | SourceKAsCollapsibleItemComponent[]
    | SourceKAsCollapsibleItemComponent;
  onExpandChange?: (expanded: boolean) => void;
}) {
  const [visibleIndex, setVisibleIndex] = useState(-1);

  const arrayChildren = Array.isArray(children) ? children : [children];

  return (
    <ScrollView {...props} style={{ flex: 1 }} contentContainerStyle={style}>
      {arrayChildren.map((child, i) => (
        <SourceKAsCollapsibleItem
          key={child.key ?? i}
          {...child.props}
          collapsed={visibleIndex !== i}
          onPress={() =>
            setVisibleIndex((lastIndex) => {
              const newIndex = lastIndex === i ? -1 : i;
              if ((newIndex === -1) !== (lastIndex === -1))
                onExpandChange?.(newIndex !== -1);

              return newIndex;
            })
          }
        />
      ))}
    </ScrollView>
  );
}

SourceKAsCollapsible.Item = SourceKAsCollapsibleItem;
