import { View } from "react-native";
import LayoutPill from "./LayoutPill";
import HeaderLogo from "./Header/HeaderLogo";
import HeaderNav from "./Header/HeaderNav";
import StarsIcon from "../icons/StarsIcon";

export default function Header({
  mode = "default",
}: {
  mode?: "default" | "login";
}) {
  return (
    <LayoutPill>
      <HeaderLogo
        image={require("../../assets/logo.svg")}
        text="DKG Agent"
        textFont="SpaceGrotesk_400Regular"
        style={[
          { flex: 1 },
          mode === "login" && {
            justifyContent: "center",
            marginLeft: -16,
          },
        ]}
      />

      {mode === "default" && (
        <HeaderNav style={{ flex: 1 }}>
          <HeaderNav.Link href="/chat" text="Chat" icon={StarsIcon} />
        </HeaderNav>
      )}

      {mode === "default" && <View style={{ flex: 1 }} />}
    </LayoutPill>
  );
}
