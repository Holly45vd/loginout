import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { Card, Text, Button, Chip } from "react-native-paper";

type RecentCard = {
  dateId: string;
  label: string;
  icon: string;
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
    <Card style={{ borderRadius: 14 }}>
      <Card.Content>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text variant="titleMedium">최근 나의 일기</Text>
          <Button mode="text" onPress={onGoMore} compact>
            더 보기
          </Button>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 14 }}>
            {loading ? (
              <Card style={{ width: 180, borderRadius: 14 }}>
                <Card.Content style={{ alignItems: "center", paddingVertical: 22, gap: 6 }}>
                  <Text style={{ fontSize: 20 }}>…</Text>
                  <Text style={{ opacity: 0.7 }}>불러오는 중</Text>
                </Card.Content>
              </Card>
            ) : cards.length === 0 ? (
              <Card style={{ width: 180, borderRadius: 14 }}>
                <Card.Content style={{ alignItems: "center", paddingVertical: 22, gap: 6 }}>
                  <Text style={{ fontSize: 26 }}>📝</Text>
                  <Text style={{ opacity: 0.7 }}>최근 기록 없음</Text>
                </Card.Content>
              </Card>
            ) : (
              cards.map((c) => (
                <Pressable key={c.dateId} onPress={() => onGoDayDetail(c.dateId)}>
                  <Card style={{ width: 180, borderRadius: 14 }}>
                    <Card.Content style={{ alignItems: "center", paddingVertical: 16, gap: 8 }}>
                      <Text style={{ fontSize: 44 }}>{c.icon}</Text>
                      <Chip>{c.energy}</Chip>
                      <Text style={{ opacity: 0.85, fontWeight: "700" as any }}>{c.label}</Text>
                      {!!c.snippet && (
                        <Text numberOfLines={2} style={{ opacity: 0.7, textAlign: "center" }}>
                          {c.snippet}
                        </Text>
                      )}
                    </Card.Content>
                  </Card>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );
}
