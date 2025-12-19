import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { signUpEmailPassword } from "../../data/firebase/auth";

export default function SignupScreen({ navigation }: any) {
  const [name, setName] = useState("Holly");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSignup() {
    setLoading(true);
    try {
      await signUpEmailPassword(email.trim(), pw, name.trim());
    } catch (e: any) {
      alert(e?.message ?? "회원가입 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text variant="headlineMedium">회원가입</Text>
      <TextInput label="닉네임" value={name} onChangeText={setName} />
      <TextInput label="이메일" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput label="비밀번호" value={pw} onChangeText={setPw} secureTextEntry />
      <Button mode="contained" loading={loading} onPress={onSignup}>계정 만들기</Button>
      <Button onPress={() => navigation.goBack()}>뒤로</Button>
    </View>
  );
}
