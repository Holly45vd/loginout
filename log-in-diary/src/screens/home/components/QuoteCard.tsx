import React from "react";
import { View } from "react-native";
import { Card, Text, Button, IconButton } from "react-native-paper";

type Props = {
  quoteOpen: boolean;
  onToggle: () => void;            // "오늘의 명언 보기" 토글
  onCloseToday: () => Promise<void>; // 오늘 닫기 저장
  loading: boolean;
  quoteText?: string;
  quoteAuthor?: string;
};

export default function QuoteCard({
  quoteOpen,
  onToggle,
  onCloseToday,
  loading,
  quoteText,
  quoteAuthor,
}: Props) {
  return (
    <>

      {quoteOpen && (
        <Card style={{ borderRadius: 14, overflow: "hidden" }}>
          <Card.Content style={{ paddingVertical: 10 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text variant="titleSmall" style={{ opacity: 0.8 }}>
                오늘의 한 문장
              </Text>

              <IconButton
                icon="close"
                size={18}
                onPress={onCloseToday}
              />
            </View>

            {/* ✅ 카드 너무 커지지 않게: 2줄 정도로 제한 */}
            <Text numberOfLines={2} style={{ lineHeight: 18 }}>
              {loading ? "불러오는 중..." : quoteText ?? "오늘의 문장을 준비 중입니다."}
            </Text>

            {!!quoteAuthor && (
              <Text style={{ marginTop: 6, opacity: 0.65 }} numberOfLines={1}>
                — {quoteAuthor}
              </Text>
            )}
          </Card.Content>
        </Card>
      )}
    </>
  );
}
