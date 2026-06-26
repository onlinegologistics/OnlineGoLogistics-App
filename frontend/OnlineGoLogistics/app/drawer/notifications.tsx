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
import { getNotificationsApi, markAsReadApi, markAllAsReadApi, NotificationResponse } from "../../api/notification";
import { DARK_GLASS_THEME } from "../../constants/theme";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotificationsApi();
      setNotifications(data);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsReadApi();
      fetchNotifications();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to mark all as read");
    }
  };

  const handleNotificationClick = async (notif: NotificationResponse) => {
    try {
      if (!notif.read) {
        await markAsReadApi(notif._id);
      }
      
      // Navigate to correct screen
      if (notif.type === "shipment") {
        router.push({ pathname: "/drawer/shipment-details", params: { id: notif.referenceId } } as any);
      } else if (notif.type === "enquiry") {
        router.push("/drawer/all-enquiries");
      } else if (notif.type === "complaint") {
        router.push("/drawer/all-complaints");
      }
    } catch (e) {
      console.log("Failed to process notification click", e);
    }
  };

  const getIcon = (type: string) => {
    if (type === "shipment") return "cube-outline";
    if (type === "enquiry") return "chatbubble-ellipses-outline";
    return "alert-circle-outline";
  };

  const getIconColor = (type: string) => {
    return "#10B981";
  };

  const getStatusBadgeColor = (status: string) => {
    if (status === "Delivered" || status === "Resolved" || status === "Answered") return "#10B981";
    if (status === "In Transit" || status === "In Progress" || status === "Under Investigation") return "#3B82F6";
    if (status === "Picked Up" || status === "Open") return "#F59E0B";
    if (status === "Accepted") return "#8B5CF6";
    if (status === "Cancelled" || status === "Closed") return "#EF4444";
    return "#6B7280"; // Pending / default
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
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
              <Text style={styles.headerKicker}>Inbox</Text>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSubtitle}>Stay updated on your shipment updates & support replies.</Text>
            </View>
          </LinearGradient>

          <View style={styles.actionBar}>
            <Text style={styles.sectionTitle}>Recent Updates</Text>
            {notifications.some((n) => !n.read) && (
              <Pressable onPress={handleMarkAllRead}>
                <Text style={styles.markReadText}>Mark all as read</Text>
              </Pressable>
            )}
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={DARK_GLASS_THEME.electricBlue} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="notifications-off-outline" size={48} color={DARK_GLASS_THEME.textSecondary} />
              <Text style={styles.emptyText}>All caught up! No notifications.</Text>
            </View>
          ) : (
            notifications.map((item) => (
              <Pressable
                key={item._id}
                style={[styles.card, !item.read && styles.unreadCard]}
                onPress={() => handleNotificationClick(item)}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.iconWrap, { backgroundColor: `${getIconColor(item.type)}12` }]}>
                    <Ionicons name={getIcon(item.type)} size={20} color={getIconColor(item.type)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.messageText}>{item.message}</Text>
                    {item.currentStatus && (
                      <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(item.currentStatus) + "22" }]}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusBadgeColor(item.currentStatus) }]} />
                        <Text style={[styles.statusBadgeText, { color: getStatusBadgeColor(item.currentStatus) }]}>
                          {item.currentStatus}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
              </Pressable>
            ))
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
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  markReadText: {
    color: DARK_GLASS_THEME.electricBlue,
    fontSize: 13,
    fontWeight: "800",
  },
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
  card: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    padding: 16,
    marginBottom: 12,
    ...DARK_GLASS_THEME.shadow,
  },
  unreadCard: {
    borderColor: "rgba(16, 185, 129, 0.35)",
    backgroundColor: "rgba(240, 253, 244, 0.75)",
  },
  cardRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  messageText: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  dateText: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 8,
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
