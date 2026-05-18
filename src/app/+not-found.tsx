import { Link, Stack } from "expo-router";
import { ScrollView } from "react-native";
import { AppText, Card, useTheme } from "@/components/surface";

export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16 }}
      >
        <Card>
          <AppText variant="headline">Screen not found</AppText>
          <Link href="/">
            <AppText color={theme.accent}>Back to servers</AppText>
          </Link>
        </Card>
      </ScrollView>
      <Stack.Screen options={{ title: "Not Found" }} />
    </>
  );
}
