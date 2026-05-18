import type { ReactNode } from "react";
import { ActivityIndicator, Text, View, useColorScheme, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { NativePressable } from "./native-control";

export function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  return {
    dark,
    background: dark ? "#0B0D10" : "#F7F7F8",
    card: dark ? "#171A1F" : "#FFFFFF",
    elevated: dark ? "#20242B" : "#F0F1F3",
    border: dark ? "#2B3038" : "#DADDE3",
    text: dark ? "#F3F4F6" : "#17181C",
    muted: dark ? "#9CA3AF" : "#69707D",
    subtle: dark ? "#6B7280" : "#8A9099",
    accent: "#0A84FF",
    success: "#34C759",
    warning: "#FFB020",
    danger: "#FF453A",
    purple: "#BF5AF2",
  };
}

export function AppText({
  children,
  variant = "body",
  color,
  selectable,
  numberOfLines,
  style,
}: {
  children: ReactNode;
  variant?: "title" | "headline" | "body" | "caption" | "mono";
  color?: string;
  selectable?: boolean;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}) {
  const theme = useTheme();
  const base: TextStyle = {
    color: color ?? theme.text,
    fontSize: variant === "title" ? 28 : variant === "headline" ? 17 : variant === "caption" ? 12 : 15,
    fontWeight: variant === "title" || variant === "headline" ? "700" : "400",
    lineHeight: variant === "title" ? 34 : variant === "caption" ? 16 : 21,
    fontFamily: variant === "mono" ? "GeistMono" : undefined,
  };

  return (
    <Text selectable={selectable} numberOfLines={numberOfLines} style={[base, style]}>
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 18,
          borderCurve: "continuous",
          padding: 14,
          gap: 10,
          boxShadow: theme.dark ? "0 1px 0 rgba(255,255,255,0.04)" : "0 2px 10px rgba(15,23,42,0.06)",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Row({
  children,
  accessibilityLabel,
  onPress,
  style,
  testID,
}: {
  children: ReactNode;
  accessibilityLabel?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const theme = useTheme();
  const content = (
    <View
      style={[
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 16,
          borderCurve: "continuous",
          padding: 14,
          gap: 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;
  return (
    <NativePressable accessibilityLabel={accessibilityLabel} onPress={onPress} style={{ alignSelf: "stretch" }} testID={testID}>
      {content}
    </NativePressable>
  );
}

export function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 }}>
      <AppText variant="headline">{title}</AppText>
      {detail ? (
        <AppText variant="caption" color={theme.muted}>
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "accent" }) {
  const theme = useTheme();
  const color =
    tone === "success" ? theme.success : tone === "warning" ? theme.warning : tone === "danger" ? theme.danger : tone === "accent" ? theme.accent : theme.muted;

  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: 999,
        backgroundColor: `${color}22`,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <AppText variant="caption" color={color} style={{ fontWeight: "700" }}>
        {children}
      </AppText>
    </View>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  const theme = useTheme();

  return (
    <View style={{ alignItems: "center", justifyContent: "center", padding: 32, gap: 8 }}>
      <AppText variant="headline" style={{ textAlign: "center" }}>
        {title}
      </AppText>
      {detail ? (
        <AppText variant="body" color={theme.muted} style={{ textAlign: "center" }}>
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

export function LoadingState({ title = "Loading" }: { title?: string }) {
  const theme = useTheme();

  return (
    <View style={{ alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
      <ActivityIndicator color={theme.accent} />
      <AppText color={theme.muted}>{title}</AppText>
    </View>
  );
}
