import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";

const COLORS = {
  primary: "#062D27",
  emerald: "#064E44",
  bgTop: "#F4FAF7",
  bgBottom: "#E6F2EE",
  textPrimary: "#0F172A",
  textSecondary: "#6B7280",
};

export default function AboutScreen() {
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
          <Text style={styles.headerTitle}>About Us</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.card}>
          <Text style={styles.title}>OnlineGoLogistics</Text>

          <Text style={styles.text}>
            OnlineGoLogistics is a modern logistics and parcel delivery platform
            designed to make shipping simple, fast, and reliable.
          </Text>

          <Text style={styles.text}>
            Our application allows users to easily create parcel bookings,
            track delivery status, and manage shipments directly from their
            mobile devices.
          </Text>

          <Text style={styles.text}>
            We aim to provide secure and efficient logistics services for both
            individuals and businesses, ensuring every parcel reaches its
            destination safely and on time.
          </Text>

          <Text style={styles.text}>
            With real-time updates, digital booking, and easy tracking,
            OnlineGoLogistics simplifies the logistics experience for everyone.
          </Text>
        </View>
      </ScrollView>
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
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    shadowColor: "#064E44",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 22,
  },
});