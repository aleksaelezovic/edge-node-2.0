import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View, TextInput, StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { fetch } from "expo/fetch";

import { clientUri } from "@/client";
import useColors from "@/hooks/useColors";
import Checkbox from "@/components/Checkbox";
import Button from "@/components/Button";

export default function Login() {
  SplashScreen.hide();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  function login() {
    setError("");
    fetch(
      process.env.EXPO_PUBLIC_MCP_URL +
        "/login?code=" +
        encodeURIComponent(code ?? ""),
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
      .then((r) => {
        if (r.status >= 400) {
          setError("Invalid username or password");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;

        if (data.targetUrl) {
          if (data.targetUrl.startsWith(clientUri))
            router.navigate({
              pathname: data.targetUrl.substring(clientUri.length) as any,
            });
          else Linking.openURL(data.targetUrl);
        } else setError("No redirect URL found");
      });
  }

  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.loginCard}>
        <Text style={[styles.title, { color: colors.secondary }]}>Login</Text>
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
          onPress={login}
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
