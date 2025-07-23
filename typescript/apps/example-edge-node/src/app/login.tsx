import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Text,
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { fetch } from "expo/fetch";

import { clientUri } from "@/client";
import useColors from "@/hooks/useColors";

export default function Login() {
  SplashScreen.hide();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        </View>

        <TouchableOpacity
          style={[
            styles.loginButton,
            { backgroundColor: colors.primary },
            (!username || !password) && styles.loginButtonDisabled,
          ]}
          onPress={login}
          disabled={!username || !password}
        >
          <Text style={[styles.loginButtonText, { color: colors.primaryText }]}>
            Login
          </Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
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
    borderRadius: 16,
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
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
    height: 45,
    fontSize: 16,
    marginBottom: 16,
  },
  loginButton: {
    paddingVertical: 12,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    height: 45,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    backgroundColor: "#bdc3c7",
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Manrope_600SemiBold",
  },
  errorContainer: {
    backgroundColor: "#fee",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#e74c3c",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 14,
    textAlign: "center",
  },
});
