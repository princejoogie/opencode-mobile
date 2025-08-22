import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import { ThemedText, ThemedTextProps } from "./themed-text";

export type ThemedButtonProps = TouchableOpacityProps & {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "terminal";
  textProps?: ThemedTextProps;
  children: React.ReactNode;
  className?: string;
};

export function ThemedButton({
  variant = "terminal",
  textProps,
  children,
  className = "",
  ...rest
}: ThemedButtonProps) {
  const getVariantClassName = () => {
    switch (variant) {
      case "primary":
        return "bg-terminal-green border border-terminal-green";
      case "secondary":
        return "bg-terminal-bg-secondary border border-terminal-border";
      case "ghost":
        return "bg-transparent border border-transparent";
      case "destructive":
        return "bg-terminal-red border border-terminal-red";
      case "terminal":
      default:
        return "bg-terminal-bg-secondary border border-terminal-border";
    }
  };

  const getTextType = () => {
    switch (variant) {
      case "primary":
        return "default";
      case "destructive":
        return "default";
      default:
        return "default";
    }
  };

  const getTextClassName = () => {
    switch (variant) {
      case "primary":
        return "text-black";
      case "destructive":
        return "text-terminal-text";
      default:
        return "text-terminal-text";
    }
  };

  return (
    <TouchableOpacity
      className={`px-4 py-2 items-center justify-center min-h-8 ${getVariantClassName()} ${className}`}
      {...rest}
    >
      {typeof children === "string" ? (
        <ThemedText
           // keep within union; default is valid
          type={getTextType() as ThemedTextProps["type"]}
          className={`text-sm font-mono text-center ${getTextClassName()}`}
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
