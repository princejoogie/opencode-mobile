import "../global.css";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "react-native-reanimated";
import { TerminalColors } from "@/constants/Colors";
import { GlobalProvider } from "@/store/global";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: TerminalColors.bg,
            },
            headerTintColor: TerminalColors.green,
            headerTitleStyle: {
              fontFamily: "monospace",
              fontSize: 16,
            },
            contentStyle: {
              backgroundColor: TerminalColors.bg,
            },
          }}
        >
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" backgroundColor={TerminalColors.bg} />
      </GlobalProvider>
    </QueryClientProvider>
  );
}
