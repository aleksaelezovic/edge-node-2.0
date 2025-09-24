import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { useMcpClient } from "@/client";
import useSettings from "@/hooks/useSettings";
import Container from "@/components/layout/Container";
import Header from "@/components/layout/Header";
import Page from "@/components/layout/Page";
import Footer from "@/components/layout/Footer";
import Checkbox from "@/components/Checkbox";
import Button from "@/components/Button";
import useColors from "@/hooks/useColors";
import ChangePasswordForm from "@/components/forms/ChangePasswordForm";
import { useAlerts } from "@/components/Alerts";
import { useDialog } from "@/components/Dialog";
import { fetch } from "expo/fetch";
import { toError } from "@/shared/errors";

const sections = [
  {
    title: "Profile & account details",
    description: "Manage your profile and account settings.",
    Component: () => null,
  },
  {
    title: "Security",
    description: "Change your password and secure your account.",
    Component: () => {
      const { showAlert } = useAlerts();
      const { showDialog } = useDialog();
      const mcp = useMcpClient();
      const submit = async ({
        newPassword,
        currentPassword,
      }: {
        newPassword: string;
        currentPassword: string;
      }) => {
        try {
          const response = await fetch(
            new URL(
              process.env.EXPO_PUBLIC_MCP_URL + "/change-password",
            ).toString(),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${mcp.token}`,
              },
              body: JSON.stringify({
                newPassword,
                currentPassword,
              }),
            },
          );
          const data = await response.json();
          if (data.error) throw new Error(data.error);
          showDialog({
            type: "success",
            title: "Password changed successfully",
            message: "Your password has been changed.",
          });
        } catch (error) {
          console.error(error);
          showAlert({
            type: "error",
            title: "Failed to change password",
            message: toError(error).message,
          });
          throw error;
        }
      };

      return (
        <ChangePasswordForm
          mode={ChangePasswordForm.Mode.PASSWORD}
          onSubmit={submit}
        />
      );
    },
  },
  {
    title: "Tools & plugins",
    description: "Manage MCP tools, permissions, and auto-approval.",
    Component: () => {
      const colors = useColors();
      const settings = useSettings();
      const [value, setValue] = useState(settings.autoApproveMcpTools);
      const [loading, setLoading] = useState(false);
      const update = () => {
        setLoading(true);
        settings
          .set("autoApproveMcpTools", value)
          .then(settings.reload)
          .then(() => {})
          .catch(() => {})
          .finally(() => setLoading(false));
      };

      return (
        <View style={{ flex: 1 }}>
          <Checkbox value={value} onValueChange={setValue}>
            <Text
              style={{
                fontFamily: "Manrope_400Regular",
                color: colors.text,
                fontSize: 16,
                lineHeight: 16,
              }}
            >
              Auto-approve MCP tools
            </Text>
          </Checkbox>
          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              color: colors.placeholder,
              fontSize: 12,
              lineHeight: 18,
              marginBottom: 8,
            }}
          >
            Run tools automatically in the background without showing execution
            boxes. Errors will still be shown as notifications.
          </Text>
          <Button
            color="primary"
            text="Update"
            onPress={update}
            disabled={loading || value === settings.autoApproveMcpTools}
          />
        </View>
      );
    },
  },
];

export default function SettingsPage() {
  const mcp = useMcpClient();
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const ActiveContent = sections[activeIndex]!.Component;

  return (
    <Page>
      <Container>
        <Header handleLogout={mcp.disconnect} />
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            gap: 16,
            paddingVertical: 48,
          }}
        >
          <View style={{ flex: 1, gap: 16 }}>
            {sections.map((section, index) => (
              <TouchableOpacity
                onPress={() => setActiveIndex(index)}
                disabled={index === activeIndex}
                key={index}
                style={[
                  styles.card,
                  { backgroundColor: colors.card },
                  index === activeIndex && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text },
                    index === activeIndex && { color: colors.primaryText },
                  ]}
                >
                  {section.title}
                </Text>
                <Text
                  style={[
                    styles.sectionDescription,
                    { color: colors.text },
                    index === activeIndex && { color: colors.primaryText },
                  ]}
                >
                  {section.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flex: 1 }}>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, width: "100%" },
              ]}
            >
              <ActiveContent />
            </View>
          </View>
        </View>
        <Footer />
      </Container>
    </Page>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 24,
    overflow: "hidden",
  },
  sectionTitle: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 28,
    lineHeight: 48,
    marginBottom: 8,
  },
  sectionDescription: {
    fontFamily: "Manrope_400Regular",
    fontSize: 16,
    lineHeight: 16,
  },
});
