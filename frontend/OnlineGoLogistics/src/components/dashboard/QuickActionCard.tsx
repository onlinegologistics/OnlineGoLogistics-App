import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DARK_GLASS_THEME } from "../../../constants/theme";

interface QuickActionCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

export default function QuickActionCard({ title, icon, onPress }: QuickActionCardProps) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color={DARK_GLASS_THEME.electricBlue} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "31.5%",
    minHeight: 104,
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1.2,
    borderRadius: 22,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    ...DARK_GLASS_THEME.shadow,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(79, 124, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 16,
  },
});
