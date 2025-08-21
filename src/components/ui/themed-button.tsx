import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { ThemedText, ThemedTextProps } from "./themed-text";

export type ThemedButtonProps = TouchableOpacityProps & {
  lightColor?: string;
  darkColor?: string;
  lightTextColor?: string;
  darkTextColor?: string;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  textProps?: ThemedTextProps;
  children: React.ReactNode;
};

export function ThemedButton({
  style,
  lightColor,
  darkColor,
  lightTextColor,
  darkTextColor,
  variant = "primary",
  textProps,
  children,
  ...rest
}: ThemedButtonProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    variant === "primary" ? "tint" : 
    variant === "secondary" ? "background" : 
    variant === "destructive" ? "background" : "background"
  );

  const textColor = useThemeColor(
    { light: lightTextColor, dark: darkTextColor },
    variant === "primary" ? "background" : 
    variant === "destructive" ? "text" : "text"
  );

  const borderColor = useThemeColor({}, variant === "secondary" ? "tint" : "background");

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor,
          ...(variant === "secondary" && { borderColor, borderWidth: 1 }),
          ...(variant === "ghost" && { backgroundColor: "transparent" }),
          ...(variant === "destructive" && { borderColor: "#dc2626", borderWidth: 1 }),
        },
        style,
      ]}
      {...rest}
    >
      {typeof children === "string" ? (
        <ThemedText
          style={[
            styles.text,
            { color: textColor },
            variant === "destructive" && { color: "#dc2626" },
          ]}
          {...textProps}
        >
          {children}
        </ThemedText>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});