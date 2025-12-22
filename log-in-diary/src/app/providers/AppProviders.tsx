import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import PaperProvider from "./PaperProvider";
import RootNavigator from "../navigation/RootNavigator";
import { AuthProvider } from "./AuthProvider";
import QueryProvider from "./QueryProvider";

import { config, library } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

import {
  faFaceSadTear,
  faFaceTired,
  faFaceMeh,
  faFaceSmileWink,
  faFaceLaughBeam,
} from "@fortawesome/free-solid-svg-icons";

library.add(
  faFaceSadTear,
  faFaceTired,
  faFaceMeh,
  faFaceSmileWink,
  faFaceLaughBeam
);

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
