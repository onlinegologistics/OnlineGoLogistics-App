import { Stack } from "expo-router";
import { LogBox } from "react-native";
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import "../src/i18n";

// Suppress benign development warnings
LogBox.ignoreLogs([
  "setLayoutAnimationEnabledExperimental is currently a no-op",
  "Unable to activate keep awake",
]);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore error if it's already hidden
});

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast />
    </>
  );
}
