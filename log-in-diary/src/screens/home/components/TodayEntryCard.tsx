import React from "react";
import { View, Pressable } from "react-native";
import { Card, Text, Chip } from "react-native-paper";

type Props = {
  todayMMDD: string;
  loading: boolean;
  hasEntry: boolean;
  moodIcon: string;
  energyText: string;
  note: string;
  onGoDetail: () => void;      // DayDetail 이동
  onGoWrite: () => void;       // Write 이동
};

export default function TodayEntryCard({
  todayMMDD,
  loading,
  hasEntry,
  moodIcon,
  energyText,
  note,
  onGoDetail,
  onGoWrite,
}: Props) {
  // ✅ 오늘 일기 있으면 버튼 숨기고 카드 클릭으로 디테일 이동
  const Wrapper: any = hasEntry ? Pressable : View;
  const wrapperProps = hasEntry ? { onPress: onGoDetail } : {};

  return (
    <Wrapper {...wrapperProps}>
      <Card style={{ borderRadius: 14 }}>
        <Card.Content style={{ gap: 10 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text variant="titleLarge">오늘의 일기</Text>
            <Text style={{ opacity: 0.7 }}>{todayMMDD}</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 28 }}>{loading ? "…" : moodIcon}</Text>
            <Chip>{loading ? "불러오는 중" : energyText}</Chip>

            {!loading && !hasEntry ? (
              <Text style={{ opacity: 0.6 }}>아직 기록 없음</Text>
            ) : null}
          </View>

          {!!note && (
            <Text style={{ opacity: 0.75 }} numberOfLines={2}>
              {note}
            </Text>
          )}

          {/* ✅ 기록 없을 때만 버튼 노출 */}
          {!loading && !hasEntry ? (
            <Pressable onPress={onGoWrite} style={{ alignSelf: "center" }}>
              <View
                style={{
                  marginTop: 4,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: "rgba(40,40,160,0.95)",
                }}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>
                  오늘 일기 쓰기
                </Text>
              </View>
            </Pressable>
          ) : null}

          {hasEntry ? (
            <Text style={{ opacity: 0.5, textAlign: "center", marginTop: 2 }}>
              탭해서 상세 보기
            </Text>
          ) : null}
        </Card.Content>
      </Card>
    </Wrapper>
  );
}
