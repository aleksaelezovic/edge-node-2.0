import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View, TextInput, StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { fetch } from "expo/fetch";

import { clientUri } from "@/client";
import { AuthError, login } from "@/shared/auth";
import useColors from "@/hooks/useColors";
import Checkbox from "@/components/Checkbox";
import Button from "@/components/Button";
import Page from "@/components/layout/Page";
import Container from "@/components/layout/Container";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Login() {
  SplashScreen.hide();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  function submit() {
    setError("");

    login({
      code: code ?? "",
      credentials: { username, password },
      rememberMe,
      fetch: (url, opts) => fetch(url.toString(), opts as any),
    })
      .then((url) => {
        if (url.startsWith(clientUri))
          router.navigate({
            pathname: url.substring(clientUri.length) as any,
          });
        else Linking.openURL(url);
      })
      .catch((err: Error) => {
        if (!(err instanceof AuthError)) {
          setError("Unknown error occurred!");
          return;
        }

        switch (err.code) {
          case AuthError.Code.INVALID_CREDENTIALS:
            setError("Invalid username or password");
            break;
          case AuthError.Code.NO_REDIRECT_URL:
            setError("No redirect URL provided");
            break;
          case AuthError.Code.INTERNAL_ERROR:
            setError("Internal server error");
            break;
          default:
            setError("Unknown auth error occurred!");
            break;
        }
      });
  }

  const colors = useColors();

  return (
    <Page>
      <Container>
        <Header mode="login" />
        <View style={styles.container}>
          <View style={styles.loginCard}>
            <Text style={[styles.title, { color: colors.secondary }]}>
              Login
            </Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>
              Enter your details to get started.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.input, color: colors.text },
                ]}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
              />
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.input, color: colors.text },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
              />
              <Checkbox
                value={rememberMe}
                onValueChange={setRememberMe}
                style={{ marginBottom: 16 }}
              >
                <Text
                  style={{
                    color: colors.placeholder,
                    fontFamily: "Manrope_400Regular",
                    marginLeft: 8,
                  }}
                >
                  Remember me
                </Text>
              </Checkbox>
            </View>

            <Button
              color="primary"
              text="Login"
              onPress={submit}
              disabled={!username || !password}
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
        <Footer mode="login" />
      </Container>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginCard: {
    width: "100%",
    maxWidth: 420,
    padding: 30,
  },
  title: {
    fontSize: 40,
    fontWeight: 700,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: "Manrope_400Regular",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {},
  input: {
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
    height: 45,
    fontSize: 16,
    marginBottom: 16,
  },
  errorContainer: {
    marginVertical: 0,
    marginHorizontal: 8,
    height: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
});
