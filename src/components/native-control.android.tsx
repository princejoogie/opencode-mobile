import type { ReactElement, ReactNode } from "react";
import type { ImageSourcePropType, StyleProp, ViewStyle } from "react-native";
import { Button, FilledTonalButton, Host, Icon, OutlinedTextField, RNHostView, Row, Surface, Text, TextButton } from "@expo/ui/jetpack-compose";
import { testID as nativeTestID } from "@expo/ui/jetpack-compose/modifiers";

export type NativeButtonIcon = "add" | "collapse" | "expand" | "refresh" | "remove" | "send" | "share" | "stop" | "unshare";

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
  multiline?: boolean;
  autoCorrect?: boolean;
  onValueChange?: (value: string) => void;
  style?: StyleProp<ViewStyle>;
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

const buttonIcons: Record<NativeButtonIcon, ImageSourcePropType> = {
  add: require("../assets/icons/add.xml"),
  collapse: require("../assets/icons/expand-less.xml"),
  expand: require("../assets/icons/expand-more.xml"),
  refresh: require("../assets/icons/refresh.xml"),
  remove: require("../assets/icons/trash.xml"),
  send: require("../assets/icons/send.xml"),
  share: require("../assets/icons/share.xml"),
  stop: require("../assets/icons/stop.xml"),
  unshare: require("../assets/icons/close.xml"),
};

export function NativeHost({
  children,
  style,
  matchHorizontal = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  matchHorizontal?: boolean;
}) {
  return (
    <Host matchContents={{ vertical: true, horizontal: matchHorizontal }} style={style}>
      {children}
    </Host>
  );
}

export function NativeButton({ title, icon, variant = "secondary", disabled, onPress, style, testID }: NativeButtonProps) {
  const Component = variant === "primary" ? Button : variant === "plain" ? TextButton : FilledTonalButton;
  const contentColor = variant === "destructive" ? "#b3261e" : undefined;

  return (
    <NativeHost style={style}>
      <Component enabled={!disabled} onClick={disabled ? undefined : onPress} modifiers={testID ? [nativeTestID(testID)] : undefined}>
        <Row horizontalArrangement={{ spacedBy: 8 }} verticalAlignment="center">
          {icon ? <Icon source={buttonIcons[icon]} size={18} tint={contentColor} contentDescription="" /> : null}
          <Text color={contentColor}>{title}</Text>
        </Row>
      </Component>
    </NativeHost>
  );
}

export function NativePressable({ children, disabled, onPress, style, testID }: NativePressableProps) {
  return (
    <NativeHost style={style}>
      <Surface color="transparent" enabled={!disabled} onClick={disabled ? undefined : onPress} modifiers={testID ? [nativeTestID(testID)] : undefined}>
        <RNHostView matchContents>{children}</RNHostView>
      </Surface>
    </NativeHost>
  );
}

export function NativeTextField({
  defaultValue,
  placeholder,
  accessibilityLabel,
  autoFocus,
  secure,
  kind = "text",
  multiline,
  autoCorrect = false,
  onValueChange,
  style,
  testID,
}: NativeTextFieldProps) {
  const secureInput = secure || kind === "password";
  const modifiers = testID ? [nativeTestID(testID)] : undefined;

  return (
    <NativeHost style={style} matchHorizontal={false}>
      <OutlinedTextField
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        singleLine={!multiline}
        minLines={multiline ? 2 : undefined}
        maxLines={multiline ? 5 : undefined}
        onValueChange={onValueChange}
        modifiers={modifiers}
        keyboardOptions={{
          autoCorrectEnabled: autoCorrect,
          capitalization: "none",
          keyboardType: secureInput ? "password" : kind === "url" ? "uri" : "text",
          imeAction: multiline ? "default" : kind === "search" ? "search" : kind === "message" ? "send" : "done",
        }}
      >
        {accessibilityLabel ? <OutlinedTextField.Label>{accessibilityLabel}</OutlinedTextField.Label> : null}
        {placeholder ? (
          <OutlinedTextField.Placeholder>
            <Text>{placeholder}</Text>
          </OutlinedTextField.Placeholder>
        ) : null}
      </OutlinedTextField>
    </NativeHost>
  );
}
