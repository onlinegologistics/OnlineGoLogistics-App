import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { getMyComplaintsApi, MobileUserComplaintResponse } from "../../api/complaint";
import { DARK_GLASS_THEME } from "../../constants/theme";

export default function AllComplaintsScreen() {
  const [complaints, setComplaints] = useState<MobileUserComplaintResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await getMyComplaintsApi();
      setComplaints(data);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "pending") return { bg: "#FEF3C7", text: "#D97706" }; // Amber
    if (s === "resolved" || s === "approved" || s === "done") return { bg: "#D1FAE5", text: "#059669" }; // Green
    if (s === "in progress" || s === "processing") return { bg: "#DBEAFE", text: "#2563EB" }; // Blue
    return { bg: "#F3F4F6", text: "#4B5563" }; // Gray
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <LinearGradient
      colors={[DARK_GLASS_THEME.bgNavy, DARK_GLASS_THEME.bgDarkBlue]}
      style={styles.screen}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right", "bottom"]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.82)", "rgba(255, 255, 255, 0.62)"]}
            style={styles.header}
          >
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={DARK_GLASS_THEME.textPrimary} />
            </Pressable>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.headerKicker}>Support Center</Text>
              <Text style={styles.headerTitle}>All Complaints</Text>
              <Text style={styles.headerSubtitle}>View status and resolutions of your complaints.</Text>
            </View>
          </LinearGradient>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={DARK_GLASS_THEME.electricBlue} />
            </View>
          ) : complaints.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="alert-circle-outline" size={48} color={DARK_GLASS_THEME.textSecondary} />
              <Text style={styles.emptyText}>No complaints submitted yet.</Text>
              <Pressable style={styles.createBtn} onPress={() => router.push("/drawer/complaints")}>
                <Text style={styles.createBtnText}>Send New Complaint</Text>
              </Pressable>
            </View>
          ) : (
            complaints.map((item) => {
              const statusStyle = getStatusColor(item.status);
              return (
                <View key={item._id} style={styles.complaintCard}>
                  <View style={styles.cardRow}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>LR: {item.receiptNo}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.subjectText}>{item.subject}</Text>
                  <Text style={styles.messageText}>{item.description}</Text>

                  <View style={styles.divider} />

                  <View style={styles.footerRow}>
                    <Ionicons name="time-outline" size={14} color={DARK_GLASS_THEME.textSecondary} />
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
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
  container: { padding: 16, paddingBottom: 110 },
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
  loader: {
    paddingVertical: 50,
    alignItems: "center",
  },
  emptyCard: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    padding: 30,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  createBtn: {
    backgroundColor: DARK_GLASS_THEME.electricBlue,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 6,
  },
  createBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  complaintCard: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    padding: 18,
    marginBottom: 14,
    ...DARK_GLASS_THEME.shadow,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeBadge: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.15)",
  },
  typeText: {
    color: DARK_GLASS_THEME.electricBlue,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  subjectText: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 12,
  },
  messageText: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
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
});
