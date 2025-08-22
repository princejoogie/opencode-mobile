import { TextInput, TextInputProps } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: "default" | "success" | "error" | "warning";
  className?: string;
};

export function ThemedInput({
  lightColor,
  darkColor,
  variant = "default",
  className = "",
  style,
  ...rest
}: ThemedInputProps) {
  const textColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "text"
  );
  const backgroundColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const placeholderColor = useThemeColor({}, "muted");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const warningColor = useThemeColor({}, "warning");

  const variantBorderColor = (() => {
    switch (variant) {
      case "success":
        return successColor;
      case "error":
        return errorColor;
      case "warning":
        return warningColor;
      default:
        return borderColor;
    }
  })();

  return (
    <TextInput
      style={[
        {
          fontFamily: "GeistMono",
          color: textColor,
          backgroundColor,
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 8,
          fontSize: 14,
          minHeight: 32,
          borderColor: variantBorderColor,
        },
        style,
      ]}
      placeholderTextColor={placeholderColor}
      className={`text-sm leading-5 ${className}`}
      {...rest}
    />
  );
}
