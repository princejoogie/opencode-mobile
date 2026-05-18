import type { ReactElement, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Button, Host, RNHostView, SecureField, TextField, type ButtonProps } from "@expo/ui/swift-ui";
import {
  autocorrectionDisabled,
  buttonStyle,
  controlSize,
  disabled,
  keyboardType,
  lineLimit,
  submitLabel,
  textContentType,
  textFieldStyle,
  textInputAutocapitalization,
} from "@expo/ui/swift-ui/modifiers";

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

const buttonIcons = {
  add: "plus",
  collapse: "chevron.up",
  expand: "chevron.down",
  refresh: "arrow.clockwise",
  remove: "trash",
  send: "paperplane.fill",
  share: "square.and.arrow.up",
  stop: "stop.fill",
  unshare: "xmark",
} satisfies Record<NativeButtonIcon, ButtonProps["systemImage"]>;

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

export function NativeButton({ title, icon, variant = "secondary", disabled: isDisabled, onPress, style }: NativeButtonProps) {
  const styleName = variant === "primary" ? "borderedProminent" : variant === "plain" ? "plain" : "bordered";

  return (
    <NativeHost style={style}>
      <Button
        label={title}
        systemImage={icon ? buttonIcons[icon] : undefined}
        role={variant === "destructive" ? "destructive" : "default"}
        onPress={isDisabled ? undefined : onPress}
        modifiers={[buttonStyle(styleName), controlSize("regular"), disabled(!!isDisabled)]}
      />
    </NativeHost>
  );
}

export function NativePressable({ children, disabled: isDisabled, onPress, style }: NativePressableProps) {
  return (
    <NativeHost style={style}>
      <Button onPress={isDisabled ? undefined : onPress} modifiers={[buttonStyle("plain"), disabled(!!isDisabled)]}>
        <RNHostView matchContents>{children}</RNHostView>
      </Button>
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
  const modifiers = [
    textFieldStyle("roundedBorder"),
    autocorrectionDisabled(!autoCorrect),
    textInputAutocapitalization("never"),
    submitLabel(kind === "search" ? "search" : kind === "message" ? "send" : "done"),
  ];

  if (kind === "url") {
    modifiers.push(keyboardType("url"), textContentType("URL"));
  }
  if (kind === "username") {
    modifiers.push(textContentType("username"));
  }
  if (secureInput) {
    modifiers.push(textContentType("password"));
  }
  if (multiline) {
    modifiers.push(lineLimit({ min: 2, max: 6 }));
  }

  return (
    <NativeHost style={style} matchHorizontal={false}>
      {secureInput ? (
        <SecureField
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onValueChange={onValueChange}
          modifiers={modifiers}
        />
      ) : (
        <TextField
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoFocus={autoFocus}
          axis={multiline ? "vertical" : "horizontal"}
          onValueChange={onValueChange}
          modifiers={modifiers}
        />
      )}
    </NativeHost>
  );
}
