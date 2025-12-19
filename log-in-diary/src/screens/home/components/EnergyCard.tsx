import React from "react";
import { View } from "react-native";
import { Card, Text, Button } from "react-native-paper";

// ✅ 라이브러리 없이 View로 스파크라인(좀 크게)
function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 4,
        height: 100,          // ✅ 크게 유지
        paddingTop: 10,
      }}
    >
      {values.map((v, i) => {
        const vv = Math.max(0, Math.min(5, v));
        const h = Math.max(6, Math.round((vv / max) * 92));
        return (
          <View
            key={i}
            style={{
              width: 8,
              height: h,
              borderRadius: 10,
              backgroundColor: "rgba(40,40,120,0.92)",
              opacity: 0.12 + (vv / max) * 0.88,
            }}
          />
        );
      })}
    </View>
  );
}

type Props = {
  loading: boolean;
  values: number[];
  onGoReport: () => void;
};

export default function EnergyCard({ loading, values, onGoReport }: Props) {
  return (
    <Card style={{ borderRadius: 14 }}>
      <Card.Content>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          {/* ✅ 타이틀 변경 */}
          <Text variant="titleMedium">최근 에너지</Text>
          <Button mode="text" onPress={onGoReport} compact>
            리포트로
          </Button>
        </View>

        {loading ? (
          <Text style={{ marginTop: 10 }}>불러오는 중...</Text>
        ) : (
          <>
            <Sparkline values={values} />
            <Text style={{ opacity: 0.6, marginTop: 8 }}>* 기록 없는 날은 0</Text>
          </>
        )}
      </Card.Content>
    </Card>
  );
}
