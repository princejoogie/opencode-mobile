import type { ReactElement, ReactNode } from "react";
import { Pressable, Text, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

export type NativeButtonIcon = "add" | "collapse" | "expand" | "refresh" | "remove" | "send" | "share" | "stop" | "unshare";

type NativeTextFieldKind = "message" | "password" | "search" | "text" | "url" | "username";

type NativeButtonProps = {
  title: string;
  icon?: NativeButtonIcon;
  variant?: "primary" | "secondary" | "plain" | "destructive";
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

type NativeTextFieldProps = {
  defaultValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  secure?: boolean;
  kind?: NativeTextFieldKind;
  multiline?: boolean;
  autoCorrect?: boolean;
  onValueChange?: (value: string) => void;
  style?: StyleProp<TextStyle>;
};

type NativePressableProps = {
  children: ReactElement;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function NativeHost({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle>; matchHorizontal?: boolean }) {
  return <View style={style}>{children}</View>;
}

export function NativeButton({ title, variant = "secondary", disabled, onPress, style }: NativeButtonProps) {
  const backgroundColor = variant === "primary" ? "#0A84FF" : "transparent";
  const color = variant === "destructive" ? "#FF453A" : variant === "primary" ? "#fff" : "#0A84FF";

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[{ opacity: disabled ? 0.45 : 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor }, style]}
    >
      <Text style={{ color, fontWeight: "600", textAlign: "center" }}>{title}</Text>
    </Pressable>
  );
}

export function NativePressable({ children, disabled, onPress, style }: NativePressableProps) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={style}>
      {children}
    </Pressable>
  );
}

export function NativeTextField({
  defaultValue,
  placeholder,
  autoFocus,
  secure,
  kind = "text",
  multiline,
  autoCorrect = false,
  onValueChange,
  style,
}: NativeTextFieldProps) {
  const secureInput = secure || kind === "password";

  return (
    <TextInput
      defaultValue={defaultValue}
      placeholder={placeholder}
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
      style={[
        {
          minHeight: multiline ? 76 : 44,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#D1D1D6",
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: "#11181C",
        },
        style,
      ]}
    />
  );
}
