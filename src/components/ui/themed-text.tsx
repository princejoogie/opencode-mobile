import { Text, TextProps } from "react-native";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "default"
    | "title"
    | "subtitle"
    | "muted"
    | "dim"
    | "link"
    | "success"
    | "error"
    | "warning"
    | "info"
    | "line-number";
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
        return "text-lg leading-6 font-bold text-terminal-text";
      case "subtitle":
        return "text-base leading-5 font-semibold text-terminal-text";
      case "muted":
        return "text-sm leading-5 text-terminal-text-muted";
      case "dim":
        return "text-xs leading-4 text-terminal-text-dim";
      case "link":
        return "text-sm leading-5 underline text-terminal-blue";
      case "success":
        return "text-sm leading-5 text-terminal-green";
      case "error":
        return "text-sm leading-5 text-terminal-red";
      case "warning":
        return "text-sm leading-5 text-terminal-yellow";
      case "info":
        return "text-sm leading-5 text-terminal-blue";
      case "line-number":
        return "text-xs leading-4 text-right min-w-12 pr-2 text-terminal-text-dim";
      default:
        return "text-sm leading-5 text-terminal-text";
    }
  };

  return (
    <Text
      style={{ fontFamily: "GeistMono" }}
      className={`${getTypeClassName()} ${className}`}
      {...rest}
    />
  );
}
