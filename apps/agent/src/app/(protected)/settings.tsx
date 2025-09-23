import { View, Text } from "react-native";

import Container from "@/components/layout/Container";
import Header from "@/components/layout/Header";
import Page from "@/components/layout/Page";
import Footer from "@/components/layout/Footer";
import { useMcpClient } from "@/client";

export default function SettingsPage() {
  const mcp = useMcpClient();

  return (
    <Page>
      <Container>
        <Header handleLogout={mcp.disconnect} />
        <View style={{ flex: 1 }}>
          <Text>Settings</Text>
        </View>
        <Footer />
      </Container>
    </Page>
  );
}
