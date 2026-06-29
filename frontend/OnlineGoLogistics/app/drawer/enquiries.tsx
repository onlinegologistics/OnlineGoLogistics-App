import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { createEnquiryApi } from "../../api/enquiry";
import { DARK_GLASS_THEME } from "../../constants/theme";
import Toast from 'react-native-toast-message';

export default function EnquiriesScreen() {
  const [enquiryType, setEnquiryType] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!enquiryType.trim() || !subject.trim() || !message.trim()) {
      Toast.show({ type: 'error', text1: "Error", text2: "Please fill out Enquiry Type, Subject, and Message." });
      return;
    }

    try {
      setLoading(true);
      await createEnquiryApi({
        enquiryType: enquiryType.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      Toast.show({ type: 'success', text1: "Success", text2: "Enquiry submitted successfully! We will get back to you soon." });
      setEnquiryType("");
      setSubject("");
      setMessage("");
      router.replace("/drawer/user-dashboard");
    } catch (e: any) {
      Toast.show({ type: 'error', text1: "Error", text2: e?.response?.data?.message || "Failed to submit enquiry" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[DARK_GLASS_THEME.bgNavy, DARK_GLASS_THEME.bgDarkBlue]}
      style={styles.screen}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.82)", "rgba(255, 255, 255, 0.62)"]}
            style={styles.header}
          >
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={DARK_GLASS_THEME.textPrimary} />
            </Pressable>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.headerKicker}>Information Center</Text>
              <Text style={styles.headerTitle}>Send Enquiry</Text>
              <Text style={styles.headerSubtitle}>Ask about bulk bookings, pricing, or custom requests.</Text>
            </View>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Submit Enquiry</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Enquiry Type</Text>
              <View style={styles.inputRow}>
                <Ionicons name="help-buoy-outline" size={18} color={DARK_GLASS_THEME.electricBlue} />
                <TextInput
                  placeholder="e.g. Bulk Shipment / Pricing / General Support"
                  placeholderTextColor="#64748B"
                  value={enquiryType}
                  onChangeText={setEnquiryType}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Subject</Text>
              <View style={styles.inputRow}>
                <Ionicons name="create-outline" size={18} color={DARK_GLASS_THEME.electricBlue} />
                <TextInput
                  placeholder="e.g. Request quote for Pune to Mumbai"
                  placeholderTextColor="#64748B"
                  value={subject}
                  onChangeText={setSubject}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Message</Text>
              <View style={[styles.inputRow, styles.textAreaRow]}>
                <Ionicons name="chatbubbles-outline" size={18} color={DARK_GLASS_THEME.electricBlue} style={{ marginTop: 12 }} />
                <TextInput
                  placeholder="Provide all details about your enquiry here..."
                  placeholderTextColor="#64748B"
                  value={message}
                  onChangeText={setMessage}
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={5}
                />
              </View>
            </View>

            <Pressable onPress={handleSubmit} disabled={loading} style={styles.submitWrapper}>
              <LinearGradient
                colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
                style={styles.submitButton}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.submitText}>Submit Enquiry</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable onPress={() => router.push("/drawer/all-enquiries")} style={[styles.submitWrapper, styles.secondaryBtnWrapper]}>
              <View style={styles.secondaryButton}>
                <Ionicons name="list-outline" size={18} color={DARK_GLASS_THEME.electricBlue} />
                <Text style={styles.secondaryBtnText}>See All Enquiries</Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
        <BottomNav
          activeTab={null}
          onChange={(tab) =>
            router.replace({ pathname: "/drawer/user-dashboard", params: { tab } } as any)
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

type DashboardTab = "home" | "add" | "shipments" | "track" | "wallet" | "profile";

function BottomNav({
  activeTab,
  onChange,
}: {
  activeTab: DashboardTab | null;
  onChange: (tab: DashboardTab) => void;
}) {
  const insets = useSafeAreaInsets();
  const items: { key: DashboardTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "home", label: "Home", icon: "home-outline" },
    { key: "shipments", label: "Shipments", icon: "cube-outline" },
    { key: "add", label: "Add Shipment", icon: "add-circle-outline" },
    { key: "track", label: "Track", icon: "locate-outline" },
    { key: "profile", label: "Profile", icon: "person-outline" },
  ];

  return (
    <View style={[styles.bottomNavContainer, { bottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.bottomNav}>
        {items.map((item) => {
          const active = activeTab === item.key;
          const isCenter = item.key === "add";

          if (isCenter) {
            return (
              <Pressable
                key={item.key}
                style={styles.navCenterWrapper}
                onPress={() => onChange(item.key)}
              >
                <LinearGradient
                  colors={["#7C3AED", "#6D28D9"]}
                  style={styles.navCenterBtn}
                >
                  <Ionicons name="add" size={28} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.navLabel, active && styles.activeNavLabel, { marginTop: 4 }]}>
                  Add Shipment
                </Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={item.key}
              style={styles.navItem}
              onPress={() => onChange(item.key)}
            >
              <Ionicons
                name={active ? item.icon.replace("-outline", "") as any : item.icon}
                size={22}
                color={active ? "#7C3AED" : "#9CA3AF"}
              />
              <Text style={[styles.navLabel, active && styles.activeNavLabel]}>
                {item.label}
              </Text>
              {active && <View style={styles.activeDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 16, paddingBottom: 120 },
  header: {
    minHeight: 112,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerKicker: { color: DARK_GLASS_THEME.textSecondary, fontSize: 12, fontWeight: "900", lineHeight: 15 },
  headerTitle: { color: DARK_GLASS_THEME.textPrimary, fontSize: 21, fontWeight: "900", lineHeight: 25, marginTop: 2 },
  headerSubtitle: { color: DARK_GLASS_THEME.textSecondary, fontSize: 12, fontWeight: "700", lineHeight: 15, marginTop: 3 },
  card: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    padding: 18,
    ...DARK_GLASS_THEME.shadow,
  },
  cardTitle: { color: DARK_GLASS_THEME.textPrimary, fontSize: 18, fontWeight: "900", marginBottom: 6 },
  fieldWrap: { marginTop: 14 },
  label: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  inputRow: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  textAreaRow: {
    alignItems: "flex-start",
  },
  input: { flex: 1, color: DARK_GLASS_THEME.textPrimary, fontWeight: "800", minHeight: 50 },
  textArea: { minHeight: 84, textAlignVertical: "top", paddingTop: 14 },
  submitWrapper: {
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  submitButton: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitText: { color: "#FFFFFF", fontWeight: "900" },
  bottomNavContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  bottomNav: {
    height: 68,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
    backgroundColor: "#FFFFFF",
    overflow: "visible",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    borderRadius: 20,
    position: "relative",
  },
  activeNavItem: {
    backgroundColor: "#F5F3FF",
  },
  navCenterWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -26,
  },
  navCenterBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
  },
  navLabel: {
    color: "#9CA3AF",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },
  activeNavLabel: {
    color: "#7C3AED",
    fontWeight: "900",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#7C3AED",
    position: "absolute",
    bottom: 2,
  },
  secondaryBtnWrapper: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: DARK_GLASS_THEME.electricBlue,
  },
  secondaryButton: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: {
    color: DARK_GLASS_THEME.electricBlue,
    fontWeight: "900",
  },
});
