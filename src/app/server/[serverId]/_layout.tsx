import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useOpencodeEvents } from "@/hooks/use-opencode-events";
import { useServers } from "@/store/servers";

export default function ServerLayout() {
  const { serverId } = useLocalSearchParams<{ serverId: string }>();
  const { ready, getServer } = useServers();
  const server = getServer(serverId);

  useOpencodeEvents(server);

  if (ready && !server) return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect: "regular",
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
      }}
    />
  );
}
