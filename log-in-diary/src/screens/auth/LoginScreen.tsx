import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { signInEmailPassword } from "../../data/firebase/auth";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setLoading(true);
    try {
      await signInEmailPassword(email.trim(), pw);
    } catch (e: any) {
      alert(e?.message ?? "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text variant="headlineMedium">로그인</Text>
      <TextInput label="이메일" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput label="비밀번호" value={pw} onChangeText={setPw} secureTextEntry />
      <Button mode="contained" loading={loading} onPress={onLogin}>로그인</Button>
      <Button onPress={() => navigation.navigate("Signup")}>회원가입</Button>
      <Button onPress={() => navigation.navigate("Forgot")}>비밀번호 재설정</Button>
    </View>
  );
}
