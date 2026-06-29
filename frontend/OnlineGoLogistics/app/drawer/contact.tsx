import React from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#0B1528",
  emerald: "#2563EB",
  bgTop: "#F8FAFC",
  bgBottom: "#EFF6FF",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
};

export default function ContactScreen() {
  return (
    <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} style={{ flex: 1 }}>
      
      {/* HEADER */}
      <View style={{ height: 180 }}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#2563EB" />
              <Stop offset="100%" stopColor="#0B1528" />
            </SvgGradient>
          </Defs>
          <Path d="M0,0 L100,0 L100,65 Q50,95 0,65 Z" fill="url(#grad)" />
        </Svg>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Support</Text>
        </View>
      </View>

      {/* SUPPORT CARDS */}
      <View style={{ padding: 20 }}>

        {/* 1. Phone Contact */}
        <Pressable
          style={styles.card}
          onPress={() => Linking.openURL("tel:9209061234")}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="call" size={24} color="#2563EB" />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Call Us</Text>
            <Text style={styles.text}>9209061234</Text>
          </View>
        </Pressable>

        {/* 2. WhatsApp Contact */}
        <Pressable
          style={styles.card}
          onPress={() => Linking.openURL("https://wa.me/919209061234")}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="logo-whatsapp" size={24} color="#10B981" />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.label}>WhatsApp</Text>
            <Text style={styles.text}>9209061234</Text>
          </View>
        </Pressable>

        {/* 3. Email Contact */}
        <Pressable
          style={styles.card}
          onPress={() => Linking.openURL("mailto:onlinegologistics@gmail.com")}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FDF2F8' }]}>
            <Ionicons name="mail" size={24} color="#EC4899" />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Email Support</Text>
            <Text style={styles.text}>onlinegologistics@gmail.com</Text>
          </View>
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
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#2563EB",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
});