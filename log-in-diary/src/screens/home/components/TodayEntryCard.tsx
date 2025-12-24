import React from "react";
import { View, Pressable } from "react-native";
import { Card, Button, Text } from "react-native-paper";

type Props = {
  todayMMDD: string;
  loading: boolean;
  hasEntry: boolean;
  moodIcon: string;
  energyText: string;
  note: string;
  onGoDetail: () => void;
  onGoWrite: () => void;
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
  const handlePress = () => {
    // ✅ 있으면 디테일, 없으면 작성
    if (hasEntry) onGoDetail();
    else onGoWrite();
  };

  return (
    <Pressable onPress={handlePress}>
      <Card style={{ borderRadius: 22 }}>
        <Card.Content style={{ gap: 10 }}>
          <Text style={{ opacity: 0.7 }}>Today {todayMMDD}</Text>

          {loading ? (
            <Text>불러오는 중...</Text>
          ) : (
            <>
              <Text style={{ fontSize: 20, fontWeight: "900" as any }}>
                {moodIcon} 오늘의 일기
              </Text>

              <Text style={{ opacity: 0.7 }}>에너지 · {energyText}</Text>

              {!!note?.trim() && (
                <Text numberOfLines={2} style={{ opacity: 0.85 }}>
                  {note.trim()}
                </Text>
              )}

              
            </>
          )}
        </Card.Content>
      </Card>
    </Pressable>
  );
}
