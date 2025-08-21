import { Text, TextProps } from "react-native";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "subtitle" | "muted" | "dim" | "link" | "success" | "error" | "warning" | "info" | "line-number";
  className?: string;
};

export function ThemedText({
  lightColor,
  darkColor,
  type = "default",
  className = "",
  ...rest
}: ThemedTextProps) {
  const getTypeClassName = () => {
    switch (type) {
      case "title":
        return "text-lg leading-6 font-mono font-bold text-terminal-text";
      case "subtitle":
        return "text-base leading-5 font-mono font-semibold text-terminal-text";
      case "muted":
        return "text-sm leading-5 font-mono text-terminal-text-muted";
      case "dim":
        return "text-xs leading-4 font-mono text-terminal-text-dim";
      case "link":
        return "text-sm leading-5 font-mono underline text-terminal-blue";
      case "success":
        return "text-sm leading-5 font-mono text-terminal-green";
      case "error":
        return "text-sm leading-5 font-mono text-terminal-red";
      case "warning":
        return "text-sm leading-5 font-mono text-terminal-yellow";
      case "info":
        return "text-sm leading-5 font-mono text-terminal-blue";
      case "line-number":
        return "text-xs leading-4 font-mono text-right min-w-12 pr-2 text-terminal-text-dim";
      default:
        return "text-sm leading-5 font-mono text-terminal-text";
    }
  };

  return (
    <Text
      className={`${getTypeClassName()} ${className}`}
      {...rest}
    />
  );
}
