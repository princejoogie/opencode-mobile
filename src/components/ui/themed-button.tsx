import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { ThemedText, ThemedTextProps } from "./themed-text";
import { TerminalColors } from "@/constants/Colors";

export type ThemedButtonProps = TouchableOpacityProps & {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "terminal";
  textProps?: ThemedTextProps;
  children: React.ReactNode;
};

export function ThemedButton({
  style,
  variant = "terminal",
  textProps,
  children,
  ...rest
}: ThemedButtonProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: TerminalColors.green,
          borderColor: TerminalColors.green,
          borderWidth: 1,
        };
      case "secondary":
        return {
          backgroundColor: TerminalColors.bgSecondary,
          borderColor: TerminalColors.border,
          borderWidth: 1,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderColor: "transparent",
          borderWidth: 1,
        };
      case "destructive":
        return {
          backgroundColor: TerminalColors.red,
          borderColor: TerminalColors.red,
          borderWidth: 1,
        };
      case "terminal":
      default:
        return {
          backgroundColor: TerminalColors.bgSecondary,
          borderColor: TerminalColors.border,
          borderWidth: 1,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "primary":
        return TerminalColors.bg;
      case "destructive":
        return TerminalColors.text;
      default:
        return TerminalColors.text;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        getVariantStyle(),
        style,
      ]}
      {...rest}
    >
      {typeof children === "string" ? (
        <ThemedText
          style={[
            styles.text,
            { color: getTextColor() },
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
    paddingVertical: 8,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
  },
  text: {
    fontSize: 14,
    fontFamily: "monospace",
    textAlign: "center",
  },
});