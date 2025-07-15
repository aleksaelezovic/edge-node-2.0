import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View, TextInput, Button } from "react-native";
import * as Linking from "expo-linking";
import { fetch } from "expo/fetch";

export default function Login() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function login() {
    setError("");
    fetch(
      "http://localhost:9200/login?code=" + encodeURIComponent(code ?? ""),
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
        if (data.targetUrl) Linking.openURL(data.targetUrl);
        else setError("No redirect URL found");
      });
  }

  return (
    <>
      <View>
        <Text>Login</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
        />
        <Button title="Login" onPress={login} />
        {error && <Text>{error}</Text>}
      </View>
    </>
  );
}
