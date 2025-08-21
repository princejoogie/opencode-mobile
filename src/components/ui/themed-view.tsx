import { View, ViewProps } from "react-native";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: "default" | "panel" | "panel-header" | "panel-content" | "code-block" | "transparent";
  className?: string;
};

export function ThemedView({
  lightColor,
  darkColor,
  variant = "default",
  className = "",
  ...rest
}: ThemedViewProps) {
  const getVariantClassName = () => {
    switch (variant) {
      case "panel":
        return "bg-terminal-bg-secondary border border-terminal-border";
      case "panel-header":
        return "bg-terminal-bg-tertiary border-b border-terminal-border px-4 py-2";
      case "panel-content":
        return "bg-terminal-bg-secondary p-4";
      case "code-block":
        return "bg-terminal-bg-tertiary border border-terminal-border p-3";
      case "transparent":
        return "bg-transparent";
      default:
        return "bg-terminal-bg";
    }
  };

  return (
    <View
      className={`${getVariantClassName()} ${className}`}
      {...rest}
    />
  );
}