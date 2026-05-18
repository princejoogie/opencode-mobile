import { useFonts } from "expo-font";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "react-native-reanimated";
import { ServerProvider } from "@/store/servers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 15_000,
      gcTime: 5 * 60_000,
    },
  },
});

export default function RootLayout() {
  const [loaded] = useFonts({
    GeistMono: require("../assets/fonts/GeistMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ServerProvider>
        <Stack
          screenOptions={{
            headerLargeTitle: true,
            headerTransparent: true,
            headerBlurEffect: "regular",
            headerShadowVisible: false,
            headerBackButtonDisplayMode: "minimal",
          }}
        >
          <Stack.Screen name="index" options={{ title: "Servers" }} />
          <Stack.Screen name="server/[serverId]" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ title: "Not Found" }} />
        </Stack>
        <StatusBar style="auto" />
      </ServerProvider>
    </QueryClientProvider>
  );
}
