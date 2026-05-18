import type { ReactElement, ReactNode } from "react";
import { Pressable, Text, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

export type NativeButtonIcon = "add" | "collapse" | "expand" | "refresh" | "remove" | "send" | "share" | "stop" | "unshare" | "sidebar" | "ellipsis"   | "chevronLeft"
  | "sidebar"
  | "ellipsis"
  | "eye"
  | "eye.slash"
  | "hammer"
  | "hammer.fill";

type NativeTextFieldKind = "message" | "password" | "search" | "text" | "url" | "username";

type NativeButtonProps = {
  title: string;
  icon?: NativeButtonIcon;
  accessibilityLabel?: string;
  variant?: "primary" | "secondary" | "plain" | "destructive";
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

type NativeTextFieldProps = {
  defaultValue?: string;
  placeholder?: string;
  accessibilityLabel?: string;
  autoFocus?: boolean;
  secure?: boolean;
  kind?: NativeTextFieldKind;
  variant?: "default" | "plain";
  multiline?: boolean;
  autoCorrect?: boolean;
  onValueChange?: (value: string) => void;
  style?: StyleProp<TextStyle>;
  testID?: string;
};

type NativePressableProps = {
  children: ReactElement;
  accessibilityLabel?: string;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function NativeHost({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle>; matchHorizontal?: boolean }) {
  return <View style={style}>{children}</View>;
}

export function NativeButton({ title, accessibilityLabel, variant = "secondary", disabled, onPress, style, testID }: NativeButtonProps) {
  const backgroundColor = variant === "primary" ? "#0A84FF" : "transparent";
  const color = variant === "destructive" ? "#FF453A" : variant === "primary" ? "#fff" : "#0A84FF";

  return (
    <Pressable
      accessible
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[{ opacity: disabled ? 0.45 : 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor }, style]}
      testID={testID}
    >
      <Text style={{ color, fontWeight: "600", textAlign: "center" }}>{title}</Text>
    </Pressable>
  );
}

export function NativePressable({ children, accessibilityLabel, disabled, onPress, style, testID }: NativePressableProps) {
  return (
    <Pressable
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={style}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

export function NativeTextField({
  defaultValue,
  placeholder,
  accessibilityLabel,
  autoFocus,
  secure,
  kind = "text",
  variant = "default",
  multiline,
  autoCorrect = false,
  onValueChange,
  style,
  testID,
}: NativeTextFieldProps) {
  const secureInput = secure || kind === "password";

  return (
    <TextInput
      defaultValue={defaultValue}
      placeholder={placeholder}
      accessibilityLabel={accessibilityLabel}
      autoFocus={autoFocus}
      secureTextEntry={secureInput}
      multiline={multiline}
      autoCapitalize="none"
      autoCorrect={autoCorrect}
      spellCheck={autoCorrect}
      keyboardType={kind === "url" ? "url" : "default"}
      returnKeyType={kind === "search" ? "search" : kind === "message" ? "send" : "done"}
      textContentType={kind === "url" ? "URL" : kind === "username" ? "username" : secureInput ? "password" : "none"}
      onChangeText={onValueChange}
      placeholderTextColor="#8E8E93"
      testID={testID}
      style={[
        {
          minHeight: multiline ? 76 : 44,
          borderRadius: variant === "plain" ? 0 : 12,
          borderWidth: variant === "plain" ? 0 : 1,
          borderColor: variant === "plain" ? "transparent" : "#D1D1D6",
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: "#11181C",
          backgroundColor: "transparent",
        },
        style,
      ]}
    />
  );
}
