import React from "react";
import { PaperProvider as RNPaperProvider } from "react-native-paper";
import { paperTheme } from "../../theme/paperTheme";

export default function PaperProvider({ children }: { children: React.ReactNode }) {
  return <RNPaperProvider theme={paperTheme}>{children}</RNPaperProvider>;
}
