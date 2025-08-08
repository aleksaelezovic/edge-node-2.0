import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ViewProps,
} from "react-native";
import { Collapsible } from "react-native-fast-collapsible";
import Ionicons from "@expo/vector-icons/Ionicons";

import useColors from "@/hooks/useColors";
import KAIcon from "@/components/icons/KAIcon";

import SourceKAsChip from "./SourceKAsChip";
import type { SourceKA } from "../SourceKAs";

export default function SourceKAsCollapsibleItem({
  collapsed,
  onPress,
  title,
  issuer,
  UAL,
  publisher,
  nquads,
  lastUpdate,
  style,
  ...props
}: SourceKA & {
  collapsed?: boolean;
  onPress?: () => void;
} & ViewProps) {
  const colors = useColors();

  const jsonData = [
    {
      "@id":
        "https://ontology.origintrail.io/dkg/1.0#metadata-hash:0xfe30a2c10e9812d2dd58395710515f00e4c5fbbc01cb5542fd00966741e0aee8",
      "https://ontology.origintrail.io/dkg/1.0#representsPrivateResource": [
        {
          "@id": "uuid:2616fbc2-2b1b-45d8-85cb-11f7e18f5040",
        },
      ],
    },
  ]; // from nquads
  let blockchain = "";
  switch (UAL.split(":")[2]) {
    case "otp":
      blockchain = "NeuroWeb";
      break;
    case "base":
      blockchain = "Base";
      break;
    case "gnosis":
      blockchain = "Gnosis";
      break;
    default:
      blockchain = "Unknown";
      break;
  }

  return (
    <View
      {...props}
      style={[
        {
          padding: 16,
          backgroundColor: colors.card,
          borderRadius: 16,
        },
        !collapsed && {
          backgroundColor: colors.card + "25",
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          height: 64,
        }}
      >
        <SourceKAsChip
          title={title}
          issuer={issuer}
          style={{ padding: 0, backgroundColor: "transparent" }}
        />
        <Ionicons
          name={collapsed ? "chevron-down" : "chevron-up"}
          color={colors.secondary}
          size={16}
        />
      </TouchableOpacity>

      <Collapsible isVisible={!collapsed}>
        <View
          style={{
            flexDirection: "row",
            gap: 16,
            paddingTop: 16,
            flexWrap: "wrap",
          }}
        >
          {/* Stats */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              flex: 1,
              padding: 16,
              gap: 24,
              minWidth: 300,
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: "Manrope_800ExtraBold",
                  fontSize: 16,
                  lineHeight: 24,
                  color: colors.text,
                }}
              >
                Knowledge Asset profile
              </Text>
              <Text
                style={{
                  fontFamily: "Manrope_400Regular",
                  fontSize: 10,
                  lineHeight: 16,
                  color: colors.text,
                }}
              >
                Latest update: {new Date(lastUpdate).toLocaleDateString()}
              </Text>
            </View>

            <View
              style={{
                width: "100%",
                height: 0,
                borderBottomColor: colors.secondary,
                borderBottomWidth: 1,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                gap: 16,
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              <View>
                <KAIcon
                  width={64}
                  height={64}
                  fill={colors.secondary}
                  stroke={colors.secondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Text
                    style={{
                      color: colors.placeholder,
                      fontFamily: "Manrope_400Regular",
                      fontSize: 14,
                      lineHeight: 24,
                    }}
                  >
                    Publisher:
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: "Manrope_500Medium",
                      fontSize: 14,
                      lineHeight: 24,
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      wordWrap: "normal",
                    }}
                  >
                    {publisher}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Text
                    style={{
                      color: colors.placeholder,
                      fontFamily: "Manrope_400Regular",
                      fontSize: 14,
                      lineHeight: 24,
                    }}
                  >
                    UAL:
                  </Text>
                  <Text
                    style={{
                      color: colors.secondary,
                      fontFamily: "Manrope_400Regular",
                      fontSize: 14,
                      lineHeight: 24,
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      wordWrap: "normal",
                    }}
                  >
                    {UAL}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Text
                    style={{
                      color: colors.placeholder,
                      fontFamily: "Manrope_400Regular",
                      fontSize: 14,
                      lineHeight: 24,
                    }}
                  >
                    Blockchain:
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: "Manrope_500Medium",
                      fontSize: 14,
                      lineHeight: 24,
                    }}
                  >
                    {blockchain}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                width: "100%",
                height: 0,
                borderBottomColor: colors.secondary,
                borderBottomWidth: 1,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <View>
                <Text
                  style={{
                    color: colors.placeholder,
                    fontFamily: "Manrope_400Regular",
                    fontSize: 12,
                    lineHeight: 16,
                  }}
                >
                  JSON:
                </Text>
              </View>
              <ScrollView style={{ height: 200 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 12,
                    lineHeight: 16,
                    fontFamily: "monospace",
                    fontWeight: 400,
                    flexWrap: "wrap",
                    wordWrap: "break-word",
                  }}
                >
                  {JSON.stringify(jsonData, null, 2)}
                </Text>
              </ScrollView>
            </View>
          </View>

          {/* Explorer */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              flex: 2,
              justifyContent: "center",
              alignItems: "center",
              minWidth: 300,
            }}
          >
            <Text
              style={{
                color: colors.placeholder,
                fontFamily: "Manrope_600SemiBold",
                fontSize: 16,
              }}
            >
              Coming soon...
            </Text>
          </View>
        </View>
      </Collapsible>
    </View>
  );
}
