import React from "react";
import { View, Image } from "react-native";
import { Text, Avatar, IconButton, Surface, Button, Chip, useTheme } from "react-native-paper";

type Props = {
  name?: string;
  dateText: string; // "Today 29 Dec"
  photoURL?: string | null;

  // ✅ 오늘 카드 내용
  todayLabel: string; // "오늘 (12-29)"
  moodImage: any;
  title: string;      // "오늘도 기록했네" / "오늘 기록해"
  subtitle: string;   // "오늘도행복해" 같은 한 줄
  energyText: string; // "풀충전" / "기록 없음"

  // actions
  onPressSearch?: () => void;
  onPressSettings?: () => void;
  onPressDetail?: () => void;
  onPressEdit?: () => void;

  // 기록 없으면 디테일 버튼 비활성
  detailDisabled?: boolean;
};

export default function HomeHeroHeader({
  name = "Holly",
  dateText,
  photoURL,

  todayLabel,
  moodImage,
  title,
  subtitle,
  energyText,

  onPressSearch,
  onPressSettings,
  onPressDetail,
  onPressEdit,
  detailDisabled,
}: Props) {
  const theme = useTheme();
  const PRIMARY = theme.colors.primary;

  return (
    <View style={{ gap: 12 }}>
      {/* top row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {photoURL ? (
            <Avatar.Image size={44} source={{ uri: photoURL }} />
          ) : (
            <Avatar.Text size={44} label={(name?.[0] ?? "H").toUpperCase()} />
          )}

          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: "900" as any }}>Hello, {name}</Text>
            <Text style={{ opacity: 0.6 }}>{dateText}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <IconButton icon="magnify" size={22} onPress={onPressSearch} />
          <IconButton icon="cog-outline" size={22} onPress={onPressSettings} />
        </View>
      </View>

      {/* ✅ Hero = 오늘 카드 */}
      <Surface
        elevation={1}
        style={{
          borderRadius: 22,
          overflow: "hidden",
          backgroundColor: PRIMARY, // 보라 카드
        }}
      >
        <View style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" as any }}>{todayLabel}</Text>

            <Chip
              compact
              style={{ backgroundColor: "rgba(255,255,255,0.20)" }}
              textStyle={{ color: "#fff", fontWeight: "900" as any }}
            >
              {energyText}
            </Chip>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            {/* 큰 무드 아이콘 */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.20)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image source={moodImage} resizeMode="contain" style={{ width: 52, height: 52 }} />
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" as any }}>{title}</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)" }} numberOfLines={2}>
                {subtitle}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              mode="contained"
              onPress={onPressDetail}
              disabled={detailDisabled}
              style={{ flex: 1, borderRadius: 14 }}
              contentStyle={{ height: 44 }}
              buttonColor="rgba(255,255,255,0.18)"
              textColor="#fff"
            >
              디테일
            </Button>

            <Button
              mode="contained"
              onPress={onPressEdit}
              style={{ flex: 1, borderRadius: 14, backgroundColor: "#fff" }}
              contentStyle={{ height: 44 }}
              textColor={PRIMARY}
            >
              수정
            </Button>
          </View>
        </View>
      </Surface>
    </View>
  );
}
