import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { resetPassword } from "../../data/firebase/auth";

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onReset() {
    setLoading(true);
    try {
      await resetPassword(email.trim());
      alert("메일을 확인해줘.");
      navigation.goBack();
    } catch (e: any) {
      alert(e?.message ?? "요청 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text variant="headlineMedium">비밀번호 재설정</Text>
      <TextInput label="이메일" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <Button mode="contained" loading={loading} onPress={onReset}>메일 보내기</Button>
      <Button onPress={() => navigation.goBack()}>뒤로</Button>
    </View>
  );
}
