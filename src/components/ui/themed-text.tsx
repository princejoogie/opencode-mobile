import { StyleSheet, Text, TextProps } from "react-native";
import { TerminalColors } from "@/constants/Colors";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "subtitle" | "muted" | "dim" | "link" | "success" | "error" | "warning" | "info" | "line-number";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const getTypeStyle = () => {
    switch (type) {
      case "title":
        return {
          ...styles.title,
          color: TerminalColors.text,
        };
      case "subtitle":
        return {
          ...styles.subtitle,
          color: TerminalColors.text,
        };
      case "muted":
        return {
          ...styles.muted,
          color: TerminalColors.textMuted,
        };
      case "dim":
        return {
          ...styles.dim,
          color: TerminalColors.textDim,
        };
      case "link":
        return {
          ...styles.link,
          color: TerminalColors.blue,
        };
      case "success":
        return {
          ...styles.default,
          color: TerminalColors.green,
        };
      case "error":
        return {
          ...styles.default,
          color: TerminalColors.red,
        };
      case "warning":
        return {
          ...styles.default,
          color: TerminalColors.yellow,
        };
      case "info":
        return {
          ...styles.default,
          color: TerminalColors.blue,
        };
      case "line-number":
        return {
          ...styles.lineNumber,
          color: TerminalColors.textDim,
        };
      default:
        return {
          ...styles.default,
          color: lightColor || darkColor || TerminalColors.text,
        };
    }
  };

  return (
    <Text
      style={[
        getTypeStyle(),
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "monospace",
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "monospace",
  },
  dim: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "monospace",
  },
  link: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "monospace",
    textDecorationLine: "underline",
  },
  lineNumber: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "monospace",
    textAlign: "right",
    minWidth: 48,
    paddingRight: 8,
  },
});
