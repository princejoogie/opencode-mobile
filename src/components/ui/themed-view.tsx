import { View, ViewProps } from "react-native";
import { TerminalColors } from "@/constants/Colors";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: "default" | "panel" | "panel-header" | "panel-content" | "code-block" | "transparent";
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = "default",
  ...rest
}: ThemedViewProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case "panel":
        return {
          backgroundColor: TerminalColors.bgSecondary,
          borderWidth: 1,
          borderColor: TerminalColors.border,
          borderRadius: 0,
        };
      case "panel-header":
        return {
          backgroundColor: TerminalColors.bgTertiary,
          borderBottomWidth: 1,
          borderBottomColor: TerminalColors.border,
          paddingHorizontal: 16,
          paddingVertical: 8,
        };
      case "panel-content":
        return {
          backgroundColor: TerminalColors.bgSecondary,
          padding: 16,
        };
      case "code-block":
        return {
          backgroundColor: TerminalColors.bgTertiary,
          borderWidth: 1,
          borderColor: TerminalColors.border,
          borderRadius: 0,
          padding: 12,
        };
      case "transparent":
        return {
          backgroundColor: "transparent",
        };
      default:
        return {
          backgroundColor: lightColor || darkColor || TerminalColors.bg,
        };
    }
  };

  return (
    <View
      style={[
        getVariantStyle(),
        style,
      ]}
      {...rest}
    />
  );
}