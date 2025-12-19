import React from "react";
import { View } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../app/providers/AuthProvider";
import { getEntry } from "../../data/firebase/diaryRepo";

export default function DayDetailScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const date = route?.params?.date as string;

  const { data, isLoading } = useQuery({
    queryKey: ["entry", user?.uid, date],
    queryFn: () => getEntry(user!.uid, date),
    enabled: Boolean(user?.uid && date),
  });

  if (!user) return <View style={{ padding: 16 }}><Text>로그인이 필요합니다.</Text></View>;
  if (isLoading) return <View style={{ padding: 16 }}><Text>불러오는 중...</Text></View>;

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text variant="titleLarge">{date}</Text>

      {data ? (
        <Card>
          <Card.Content style={{ gap: 6 }}>
            <Text>주제: {data.topic || "-"}</Text>
            <Text>에너지: {data.energy ?? "-"}</Text>
            <Text>기분: {data.mood || "-"}</Text>
            <Text style={{ marginTop: 8 }}>{data.content || "(내용 없음)"}</Text>
          </Card.Content>
        </Card>
      ) : (
        <Text>이 날 기록이 없습니다.</Text>
      )}

      <Button
        mode="contained"
        onPress={() => navigation.navigate("Write", { date })}
      >
        {data ? "수정하기" : "기록하기"}
      </Button>

      <Button mode="outlined" onPress={() => navigation.goBack()}>
        뒤로
      </Button>
    </View>
  );
}
