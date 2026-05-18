import { Pressable, Text, type GestureResponderEvent } from "react-native";
import { useTheme } from "./surface";
import type { NativeButtonIcon } from "./native-control";

type HeaderActionProps = {
  title: string;
  icon: NativeButtonIcon;
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  testID: string;
};

export function HeaderAction({ title, icon: _icon, disabled, onPress, testID }: HeaderActionProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.35 : 1 }}
      testID={testID}
    >
      <Text style={{ color: theme.accent, fontSize: 17 }}>{title}</Text>
    </Pressable>
  );
}
