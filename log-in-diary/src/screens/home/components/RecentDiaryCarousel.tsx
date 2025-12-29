// /workspaces/loginout/log-in-diary/src/screens/home/components/RecentDiaryCarousel.tsx
import React from "react";
import { View, ScrollView, Pressable, Image } from "react-native";
import { Card, Text, Button, Chip } from "react-native-paper";

type RecentCard = {
  dateId: string;
  label: string;
  moodImage: any;   // require(...)
  energy: string;
  snippet: string;
};

type Props = {
  loading: boolean;
  cards: RecentCard[];
  onGoMore: () => void;
  onGoDayDetail: (dateId: string) => void;
};

export default function RecentDiaryCarousel({
  loading,
  cards,
  onGoMore,
  onGoDayDetail,
}: Props) {
  return (
    <Card style={{ borderRadius: 18 }}>
      <Card.Content style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontWeight: "900" as any, fontSize: 16 }}>최근 나의 일기</Text>
          <Button compact onPress={onGoMore}>
            더보기
          </Button>
        </View>

        {loading ? (
          <Text style={{ opacity: 0.6 }}>불러오는 중…</Text>
        ) : cards.length === 0 ? (
          <Text style={{ opacity: 0.6 }}>최근 2주 기록이 없어.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {cards.map((c) => (
              <Pressable key={c.dateId} onPress={() => onGoDayDetail(c.dateId)}>
                <View
                  style={{
                    width: 220,
                    borderRadius: 16,
                    padding: 14,
                    backgroundColor: "rgba(0,0,0,0.04)",
                    gap: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ fontWeight: "900" as any }}>{c.label}</Text>
                    <Chip compact style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
                      {c.energy}
                    </Chip>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Image source={c.moodImage} resizeMode="contain" style={{ width: 34, height: 34 }} />
                    <Text numberOfLines={2} style={{ flex: 1, opacity: 0.75, fontWeight: "700" as any }}>
                      {c.snippet || "내용 없음"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </Card.Content>
    </Card>
  );
}
