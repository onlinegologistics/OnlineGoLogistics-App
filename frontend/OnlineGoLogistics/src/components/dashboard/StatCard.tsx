import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { DARK_GLASS_THEME } from "../../../constants/theme";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  colors: readonly [string, string];
}

export default function StatCard({ label, value, icon, colors }: StatCardProps) {
  return (
    <View style={styles.card}>
      <LinearGradient colors={colors} style={styles.iconWrap}>
        <Ionicons name={icon} size={14} color="#FFFFFF" />
      </LinearGradient>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "23%",
    aspectRatio: 0.95,
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1.1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    ...DARK_GLASS_THEME.shadow,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  value: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },
  label: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 8,
    fontWeight: "900",
    marginTop: 2,
    textAlign: "center",
    textTransform: "uppercase",
  },
});
