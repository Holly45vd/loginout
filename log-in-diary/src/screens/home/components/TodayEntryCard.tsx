// /workspaces/loginout/log-in-diary/src/screens/home/components/TodayEntryCard.tsx
import React from "react";
import { View, Image } from "react-native";
import { Card, Text, Button } from "react-native-paper";

type Props = {
  todayMMDD: string;
  loading: boolean;
  hasEntry: boolean;
  moodImage: any;         // require(...) 결과
  energyText: string;
  note: string;
  onGoDetail: () => void;
  onGoWrite: () => void;
};

export default function TodayEntryCard({
  todayMMDD,
  loading,
  hasEntry,
  moodImage,
  energyText,
  note,
  onGoDetail,
  onGoWrite,
}: Props) {
  return (
    <Card style={{ borderRadius: 18, overflow: "hidden" }}>
      <Card.Content style={{ paddingVertical: 16, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontWeight: "900" as any, fontSize: 16 }}>오늘 ({todayMMDD})</Text>
          <Text style={{ opacity: 0.7, fontWeight: "800" as any }}>
            {hasEntry ? energyText : "-"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Image
            source={moodImage}
            resizeMode="contain"
            style={{ width: 44, height: 44, opacity: hasEntry ? 1 : 0.5 }}
          />

          <View style={{ flex: 1 }}>
            {loading ? (
              <Text style={{ opacity: 0.6 }}>불러오는 중…</Text>
            ) : hasEntry ? (
              <>
                <Text numberOfLines={2} style={{ fontWeight: "800" as any }}>
                  {note?.trim() ? note.trim() : "(내용 없음)"}
                </Text>
                <Text style={{ opacity: 0.6, marginTop: 2 }}>터치해서 디테일 보기</Text>
              </>
            ) : (
              <>
                <Text style={{ opacity: 0.7, fontWeight: "700" as any }}>
                  아직 오늘 기록이 없어.
                </Text>
                <Text style={{ opacity: 0.6, marginTop: 2 }}>지금 가볍게 남겨보자.</Text>
              </>
            )}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
          {hasEntry ? (
            <>
              <Button mode="contained" onPress={onGoDetail} style={{ flex: 1, borderRadius: 14 }}>
                디테일
              </Button>
              <Button mode="outlined" onPress={onGoWrite} style={{ flex: 1, borderRadius: 14 }}>
                수정
              </Button>
            </>
          ) : (
            <Button mode="contained" onPress={onGoWrite} style={{ flex: 1, borderRadius: 14 }}>
              기록하기
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}
