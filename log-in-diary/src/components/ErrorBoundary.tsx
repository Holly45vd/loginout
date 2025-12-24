import React from "react";
import { ScrollView, View } from "react-native";
import { Card, Text, Button } from "react-native-paper";

type Props = {
  children: React.ReactNode;
  name?: string;
};

type State = {
  error?: Error;
  info?: any;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    // ✅ 여기 콘솔에 "진짜 원인"이 찍힘
    console.error(`[ErrorBoundary:${this.props.name ?? "unknown"}]`, error);
    console.error(info);
    this.setState({ info });
  }

  render() {
    if (!this.state.error) return this.props.children;

    const msg = this.state.error?.message ?? String(this.state.error);

    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card style={{ borderRadius: 18 }}>
          <Card.Content style={{ gap: 10 }}>
            <Text style={{ fontWeight: "900" as any, fontSize: 16 }}>
              ⚠️ 에러 발생: {this.props.name ?? "Component"}
            </Text>

            <Text selectable style={{ color: "#B00020" }}>
              {msg}
            </Text>

            <Text selectable style={{ opacity: 0.8, fontSize: 12 }}>
              {this.state.error?.stack ?? ""}
            </Text>

            <View style={{ height: 8 }} />

            <Button
              mode="contained"
              onPress={() => this.setState({ error: undefined, info: undefined })}
            >
              다시 시도
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }
}
