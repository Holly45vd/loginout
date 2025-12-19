import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import PaperProvider from "./PaperProvider";
import RootNavigator from "../navigation/RootNavigator";
import { AuthProvider } from "./AuthProvider";
import QueryProvider from "./QueryProvider";

export default function AppProviders() {
  return (
    <QueryProvider>
      <PaperProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </QueryProvider>
  );
}
