import { useState } from "react";
import { Text, View, StyleSheet, TextInput } from "react-native";
import { useGlobalSearchParams } from "expo-router";

import Container from "@/components/layout/Container";
import Header from "@/components/layout/Header";
import Page from "@/components/layout/Page";

import { styles as loginStyles } from "./login";
import useColors from "@/hooks/useColors";
import Button from "@/components/Button";

export default function PasswordResetPage() {
  const colors = useColors();

  const { code } = useGlobalSearchParams<{ code?: string }>();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const passwordChecks = [
    { regex: /.{8,}/, message: "Minimum 8 characters" },
    { regex: /[A-Z]/, message: "One uppercase letter" },
    { regex: /[a-z]/, message: "One lowercase letter" },
    {
      regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      message: "One special character",
    },
    { regex: /[0-9]/, message: "One number" },
  ];
  const validPassword =
    !!newPassword &&
    passwordChecks.every((check) => check.regex.test(newPassword));
  const [error, setError] = useState<string>();

  function sendResetLink() {
    //...
  }

  function resetPassword() {
    setError("");
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!validPassword) {
      setError("Password does not meet requirements");
      return;
    }

    //...
  }

  return (
    <Page>
      <Container>
        <Header mode="login" />
        <View style={styles.container}>
          {!code ? (
            <View style={styles.loginCard}>
              <Text style={[styles.title, { color: colors.secondary }]}>
                Reset your password
              </Text>
              <Text style={[styles.subtitle, { color: colors.text }]}>
                Enter the email associated with your DKG Node account and we’ll
                send you a secure link to reset your password.
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.input, color: colors.text },
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoCapitalize="none"
              />
              <View style={{ height: 16 }} />
              <Button
                color="primary"
                text="Send reset link"
                onPress={sendResetLink}
                disabled={!email}
              />
            </View>
          ) : (
            <View style={[styles.loginCard, { maxWidth: 480 }]}>
              <Text style={[styles.title, { color: colors.secondary }]}>
                Create a new password
              </Text>
              <Text style={[styles.subtitle, { color: colors.text }]}>
                Choose a strong password to secure your account.
              </Text>

              <View style={{ paddingHorizontal: 30 }}>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.input, color: colors.text },
                  ]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry
                />
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      color: colors.placeholder,
                      fontFamily: "Manrope_400Regular",
                      fontSize: 12,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Text>
                      Please add all necessary characters to create safe
                      password.
                    </Text>
                    {passwordChecks.map((check, index) => (
                      <Text
                        key={index}
                        style={[
                          { color: colors.secondary },
                          check.regex.test(newPassword) && {
                            color: colors.placeholder,
                          },
                        ]}
                      >
                        • {check.message}
                      </Text>
                    ))}
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.input, color: colors.text },
                  ]}
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry
                />
                <Button
                  color="primary"
                  text="Confirm new password"
                  onPress={resetPassword}
                  disabled={!validPassword}
                />
                <View
                  style={[
                    styles.errorContainer,
                    { visibility: error ? "visible" : "hidden" },
                  ]}
                >
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {error}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Container>
    </Page>
  );
}

const styles = StyleSheet.create({
  ...loginStyles,
  container: {
    ...loginStyles.container,
    justifyContent: "flex-start",
    marginTop: 60,
  },
});
