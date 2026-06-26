import React from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#062D27",
  emerald: "#064E44",
  bgTop: "#F4FAF7",
  bgBottom: "#E6F2EE",
  textPrimary: "#0F172A",
  textSecondary: "#6B7280",
};

export default function ContactScreen() {
  return (
    <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} style={{ flex: 1 }}>
      
      {/* HEADER */}
      <View style={{ height: 180 }}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={COLORS.emerald} />
              <Stop offset="100%" stopColor={COLORS.primary} />
            </SvgGradient>
          </Defs>
          <Path d="M0,0 L100,0 L100,65 Q50,95 0,65 Z" fill="url(#grad)" />
        </Svg>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Contact Us</Text>
        </View>
      </View>

      <View style={{ padding: 20 }}>

        <Pressable
          style={styles.card}
          onPress={() => Linking.openURL("tel:9209061234")}
        >
          <Ionicons name="call-outline" size={22} color={COLORS.primary} />
          <Text style={styles.text}>9209061234</Text>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() => Linking.openURL("mailto:onlinego@gmail.com")}
        >
          <Ionicons name="mail-outline" size={22} color={COLORS.primary} />
          <Text style={styles.text}>onlinego@gmail.com</Text>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() => Linking.openURL("https://www.onlinegologistics.in")}
        >
          <Ionicons name="globe-outline" size={22} color={COLORS.primary} />
          <Text style={styles.text}>www.onlinegologistics.in</Text>
        </Pressable>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerText: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#064E44",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
});