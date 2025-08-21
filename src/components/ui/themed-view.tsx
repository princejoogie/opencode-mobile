import { useThemeColor } from "@/hooks/useThemeColor";
import { View, ViewProps } from "react-native";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: "default" | "card" | "surface" | "transparent";
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = "default",
  ...rest
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    variant === "card" || variant === "surface" ? "background" : "background"
  );

  const getVariantStyle = () => {
    switch (variant) {
      case "card":
        return {
          backgroundColor,
          borderRadius: 8,
          padding: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        };
      case "surface":
        return {
          backgroundColor,
          borderRadius: 6,
          padding: 12,
        };
      case "transparent":
        return {
          backgroundColor: "transparent",
        };
      default:
        return {
          backgroundColor,
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