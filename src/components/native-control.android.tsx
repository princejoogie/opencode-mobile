import type { ReactElement, ReactNode } from "react";
import type { ImageSourcePropType, StyleProp, ViewStyle } from "react-native";
import { Button, FilledTonalButton, Host, Icon, OutlinedTextField, RNHostView, Row, Surface, Text, TextButton } from "@expo/ui/jetpack-compose";

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
  style?: StyleProp<ViewStyle>;
};

type NativePressableProps = {
  children: ReactElement;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
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

export function NativeButton({ title, icon, variant = "secondary", disabled, onPress, style }: NativeButtonProps) {
  const Component = variant === "primary" ? Button : variant === "plain" ? TextButton : FilledTonalButton;
  const contentColor = variant === "destructive" ? "#b3261e" : undefined;

  return (
    <NativeHost style={style}>
      <Component enabled={!disabled} onClick={disabled ? undefined : onPress}>
        <Row horizontalArrangement={{ spacedBy: 8 }} verticalAlignment="center">
          {icon ? <Icon source={buttonIcons[icon]} size={18} tint={contentColor} contentDescription="" /> : null}
          <Text color={contentColor}>{title}</Text>
        </Row>
      </Component>
    </NativeHost>
  );
}

export function NativePressable({ children, disabled, onPress, style }: NativePressableProps) {
  return (
    <NativeHost style={style}>
      <Surface color="transparent" enabled={!disabled} onClick={disabled ? undefined : onPress}>
        <RNHostView matchContents>{children}</RNHostView>
      </Surface>
    </NativeHost>
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
    <NativeHost style={style} matchHorizontal={false}>
      <OutlinedTextField
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        singleLine={!multiline}
        minLines={multiline ? 2 : undefined}
        maxLines={multiline ? 5 : undefined}
        onValueChange={onValueChange}
        keyboardOptions={{
          autoCorrectEnabled: autoCorrect,
          capitalization: "none",
          keyboardType: secureInput ? "password" : kind === "url" ? "uri" : "text",
          imeAction: multiline ? "default" : kind === "search" ? "search" : kind === "message" ? "send" : "done",
        }}
      >
        {placeholder ? (
          <OutlinedTextField.Placeholder>
            <Text>{placeholder}</Text>
          </OutlinedTextField.Placeholder>
        ) : null}
      </OutlinedTextField>
    </NativeHost>
  );
}
