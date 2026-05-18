import type { ReactElement, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Button, Host, RNHostView, SecureField, TextField, type ButtonProps } from "@expo/ui/swift-ui";
import {
  autocorrectionDisabled,
  accessibilityLabel as nativeAccessibilityLabel,
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

export function NativeButton({ title, icon, accessibilityLabel, variant = "secondary", disabled: isDisabled, onPress, style, testID }: NativeButtonProps) {
  const styleName = variant === "primary" ? "borderedProminent" : variant === "plain" ? "plain" : "bordered";

  return (
    <NativeHost style={style}>
      <Button
        label={title}
        systemImage={icon ? buttonIcons[icon] : undefined}
        role={variant === "destructive" ? "destructive" : "default"}
        onPress={isDisabled ? undefined : onPress}
        testID={testID}
        modifiers={[buttonStyle(styleName), controlSize("regular"), disabled(!!isDisabled), nativeAccessibilityLabel(accessibilityLabel ?? title)]}
      />
    </NativeHost>
  );
}

export function NativePressable({ children, accessibilityLabel, disabled: isDisabled, onPress, style, testID }: NativePressableProps) {
  const modifiers = [buttonStyle("plain"), disabled(!!isDisabled)];

  if (accessibilityLabel) {
    modifiers.push(nativeAccessibilityLabel(accessibilityLabel));
  }

  return (
    <NativeHost style={style}>
      <Button onPress={isDisabled ? undefined : onPress} testID={testID} modifiers={modifiers}>
        <RNHostView matchContents>{children}</RNHostView>
      </Button>
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
  if (accessibilityLabel) {
    modifiers.push(nativeAccessibilityLabel(accessibilityLabel));
  }

  return (
    <NativeHost style={style} matchHorizontal={false}>
      {secureInput ? (
        <SecureField
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onValueChange={onValueChange}
          testID={testID}
          modifiers={modifiers}
        />
      ) : (
        <TextField
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoFocus={autoFocus}
          axis={multiline ? "vertical" : "horizontal"}
          onValueChange={onValueChange}
          testID={testID}
          modifiers={modifiers}
        />
      )}
    </NativeHost>
  );
}
