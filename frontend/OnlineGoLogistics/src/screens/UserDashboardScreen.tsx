import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, router, useLocalSearchParams, useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import AddRecordForm from "../components/dashboard/AddRecordForm";
import QuickActionCard from "../components/dashboard/QuickActionCard";
import ShipmentCard from "../components/dashboard/ShipmentCard";
import StatCard from "../components/dashboard/StatCard";
import {
  AddShipmentPayload,
  CustomerDashboard,
  ShipmentRecord,
  addShipmentRecords,
  getCustomerDashboard,
  getRecentShipments,
  trackShipment,
} from "../services/logisticsApi";
import { DARK_GLASS_THEME } from "../../constants/theme";
import { removeToken } from "../../utils/token";
import { getProfileApi } from "../../api/auth";
import { getNotificationsApi, markAsReadApi, NotificationResponse } from "../../api/notification";
import Toast from 'react-native-toast-message';

const emptyDashboard: CustomerDashboard = {
  totalBookings: 0,
  pendingShipments: 0,
  inTransit: 0,
  delivered: 0,
  cancelled: 0,
  totalAmount: 0,
  dueAmount: 0,
};

type DashboardTab = "home" | "add" | "shipments" | "track" | "wallet" | "profile";

export default function UserDashboardScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const navigation = useNavigation();
  const [customerName, setCustomerName] = useState("Customer");
  const [dashboard, setDashboard] = useState<CustomerDashboard>(emptyDashboard);
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [activeTab, setActiveTab] = useState<DashboardTab>("home");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);

  const handleLogout = async () => {
    await removeToken();
    await AsyncStorage.clear();
    router.replace("/login");
  };

  useEffect(() => {
    const tab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
    if (tab && ["home", "add", "shipments", "track", "wallet", "profile"].includes(tab)) {
      setActiveTab(tab as DashboardTab);
    }
  }, [params.tab]);

  const loadDashboard = useCallback(async () => {
    const storedName = await AsyncStorage.getItem("userName");
    if (storedName) setCustomerName(storedName);

    const [dashboardData, recentData] = await Promise.all([
      getCustomerDashboard(),
      getRecentShipments(),
    ]);
    setDashboard(dashboardData);
    setShipments(recentData);

    try {
      const profileData = await getProfileApi();
      if (profileData.profilePhoto) {
        setProfilePhoto(profileData.profilePhoto);
      } else {
        setProfilePhoto(null);
      }
    } catch (e) {
      console.log("Failed to load profile photo in dashboard", e);
    }

    try {
      const notifs = await getNotificationsApi();
      setNotifications(notifs);
    } catch (e) {
      console.log("Failed to load notifications in dashboard", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  useEffect(() => {
    const onBackPress = () => {
      if (activeTab !== "home") {
        setActiveTab("home");
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const submitRecord = async (payloads: AddShipmentPayload[]) => {
    try {
      setSubmitting(true);
      await addShipmentRecords(payloads);
      Toast.show({ type: 'success', text1: "Success", text2: "Shipment records submitted successfully" });
      await loadDashboard();
      setActiveTab("shipments");
    } catch (error: any) {
      Toast.show({ type: 'error', text1: "Submit Failed", text2: error?.response?.data?.message || "Could not submit shipment record" });
    } finally {
      setSubmitting(false);
    }
  };

  const trackNow = async () => {
    if (!trackingId.trim()) {
      Toast.show({ type: 'error', text1: "Tracking ID required", text2: "Please enter booking or tracking ID" });
      return;
    }

    try {
      const result = await trackShipment(trackingId.trim());
      router.push({ pathname: "/drawer/track-shipment", params: { id: result.id } } as any);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: "Tracking Failed", text2: error?.response?.data?.message || "Shipment not found" });
    }
  };

  const stats = useMemo(
    () => [
      { label: "Bookings", value: dashboard.totalBookings, icon: "cube-outline" as const, colors: [DARK_GLASS_THEME.electricBlue, "#2F6F57"] as const },
      { label: "Pending", value: dashboard.pendingShipments, icon: "time-outline" as const, colors: [DARK_GLASS_THEME.orange, "#E8C76D"] as const },
      { label: "In Transit", value: dashboard.inTransit, icon: "navigate-outline" as const, colors: [DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple] as const },
      { label: "Delivered", value: dashboard.delivered, icon: "checkmark-done-outline" as const, colors: [DARK_GLASS_THEME.cyan, "#5DD39E"] as const },
    ],
    [dashboard]
  );

  // All unread notifications shown as stacked cards below hero banner
  const unreadNotifications = useMemo(() => {
    return notifications.filter((n) => !n.read).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications]);

  const handleNotifPress = async (notif: NotificationResponse) => {
    try {
      // Mark as read → card disappears from dashboard instantly
      await markAsReadApi(notif._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
      );
      // Navigate to the correct screen
      if (notif.type === "shipment") {
        router.push({ pathname: "/drawer/shipment-details", params: { id: notif.referenceId } } as any);
      } else if (notif.type === "enquiry") {
        router.push("/drawer/all-enquiries" as any);
      } else if (notif.type === "complaint") {
        router.push("/drawer/all-complaints" as any);
      }
    } catch (e) {
      console.log("Failed to process notification click", e);
    }
  };

  const getNotifAccent = (type: string) => {
    return "#10B981"; // Green notification card
  };

  const getNotifIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    if (type === "shipment") return "cube-outline";
    if (type === "enquiry") return "chatbubble-ellipses-outline";
    return "alert-circle-outline";
  };

  const getNotifTypeLabel = (type: string) => {
    if (type === "shipment") return "Shipment";
    if (type === "enquiry") return "Enquiry";
    return "Complaint";
  };

  const renderTrackingCard = () => (
    <View style={styles.trackingCard}>
      <View style={styles.trackingIcon}>
        <Ionicons name="locate-outline" size={22} color={DARK_GLASS_THEME.electricBlue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.trackingTitle}>Track Shipment</Text>
        <TextInput
          value={trackingId}
          onChangeText={setTrackingId}
          placeholder="Enter tracking / booking ID"
          placeholderTextColor="#64748B"
          style={styles.trackingInput}
        />
      </View>
      <Pressable style={styles.trackButton} onPress={trackNow}>
        <LinearGradient
          colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
          style={styles.trackButtonGrad}
        >
          <Text style={styles.trackText}>Track</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );

  const renderShipmentList = (limit?: number) => {
    const list = limit ? shipments.slice(0, limit) : shipments;
    return (
      <>
        {list.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={34} color="#64748B" />
            <Text style={styles.emptyTitle}>No shipments yet</Text>
            <Text style={styles.emptyText}>Add your first shipment record to see activity here.</Text>
          </View>
        ) : (
          list.map((shipment) => (
            <ShipmentCard
              key={shipment.id}
              shipment={shipment}
              onViewDetails={(item) =>
                router.push({ pathname: "/drawer/shipment-details", params: { id: item.id } } as any)
              }
            />
          ))
        )}
      </>
    );
  };

  const renderSupportCard = (showAll = false) => (
    <View style={styles.supportCard}>
      <SupportButton title="Call" icon="call-outline" onPress={() => Linking.openURL("tel:+910000000000")} />
      <SupportButton title="WhatsApp" icon="logo-whatsapp" onPress={() => Linking.openURL("https://wa.me/910000000000")} />
      <SupportButton title="Email" icon="mail-outline" onPress={() => Linking.openURL("mailto:support@onlinegologistics.in")} />
      <SupportButton title="FAQ" icon="help-buoy-outline" onPress={() => Toast.show({ type: 'info', text1: "FAQ", text2: "Support FAQ is ready to connect" })} />
      {showAll && (
        <>
          <SupportButton title="Send Enquiry" icon="chatbubble-ellipses-outline" onPress={() => router.push("/drawer/enquiries" as any)} />
          <SupportButton title="Send Complaint" icon="alert-circle-outline" onPress={() => router.push("/drawer/complaints" as any)} />
        </>
      )}
    </View>
  );

  const renderWalletTab = () => (
    <View style={{ marginTop: 14 }}>
      <LinearGradient
        colors={[DARK_GLASS_THEME.bgDarkBlue, "#1F2937"]}
        style={styles.walletCard}
      >
        <Text style={styles.walletLabel}>Available Balance</Text>
        <Text style={styles.walletBalance}>₹24,680.50</Text>
        <Pressable
          style={styles.addMoneyButton}
          onPress={() => Toast.show({ type: 'info', text1: "Add Money", text2: "Stripe payment gateway interface connected here" })}
        >
          <LinearGradient
            colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
            style={styles.addMoneyGrad}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addMoneyText}>Add Money</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <View style={styles.transactionList}>
        <TransactionRow title="Shipment Payment" date="23 Jun 2026" amount="- ₹2,450.00" negative />
        <TransactionRow title="Wallet Recharge" date="22 Jun 2026" amount="+ ₹5,000.00" />
        <TransactionRow title="Shipment Payment" date="21 Jun 2026" amount="- ₹1,800.00" negative />
        <TransactionRow title="Refund Received" date="20 Jun 2026" amount="+ ₹850.00" />
      </View>
    </View>
  );

  const renderTabContent = () => {
    if (activeTab === "add") {
      return <AddRecordForm onSubmit={submitRecord} loading={submitting} />;
    }

    if (activeTab === "shipments") {
      return (
        <View style={{ marginTop: 14 }}>
          {renderShipmentList()}
        </View>
      );
    }

    if (activeTab === "track") {
      return (
        <>
          <SectionTitle title="Track Shipment" />
          {renderTrackingCard()}
          <SectionTitle title="Recent Shipments" />
          {renderShipmentList()}
        </>
      );
    }

    if (activeTab === "wallet") {
      return renderWalletTab();
    }

    if (activeTab === "profile") {
      return (
        <>
          <LinearGradient
            colors={["rgba(37, 99, 235, 0.08)", "rgba(255, 255, 255, 0.95)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileHero}
          >
            <View style={styles.profileHeroTop}>
              <LinearGradient
                colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
                style={styles.profileAvatarGlow}
              >
                <View style={styles.profileAvatarInner}>
                  {profilePhoto ? (
                    <Image source={{ uri: profilePhoto }} style={styles.profileAvatarImage} />
                  ) : (
                    <Text style={styles.profileAvatarText}>{customerName.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileKicker}>Customer Account</Text>
                <Text style={styles.profileName}>{customerName}</Text>
                <Text style={styles.profileMeta}>OnlineGo Logistics</Text>
              </View>
              <Pressable style={styles.profileEditIcon} onPress={() => router.push("/drawer/profile-details" as any)}>
                <Ionicons name="create-outline" size={19} color={DARK_GLASS_THEME.electricBlue} />
              </Pressable>
            </View>

            <View style={styles.profileSummaryRow}>
              <ProfileSummaryItem label="Bookings" value={dashboard.totalBookings} />
              <ProfileSummaryItem label="In Transit" value={dashboard.inTransit} />
              <ProfileSummaryItem label="Delivered" value={dashboard.delivered} />
            </View>
          </LinearGradient>

          <View style={styles.profileActionsCard}>
            <ProfileActionRow
              title="View Profile Details"
              subtitle="Edit name, username, email and phone"
              icon="person-circle-outline"
              onPress={() => router.push("/drawer/profile-details" as any)}
              color={DARK_GLASS_THEME.electricBlue}
            />
            <ProfileActionRow
              title="Logout"
              subtitle="Sign out of your account"
              icon="log-out-outline"
              onPress={handleLogout}
              color="#EF4444"
            />
          </View>

          <SectionTitle title="Support" />
          {renderSupportCard(true)}
        </>
      );
    }

    return (
      <>
        {/* HERO ILLUST CARD FOR HOME */}
        <ImageBackground
          source={require("../../assets/images/futuristic_truck.png")}
          style={styles.heroSection}
          imageStyle={styles.heroBgImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.92)", "rgba(255, 255, 255, 0.0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroTextCol}>
            <Text style={styles.heroKicker}>Hello, {customerName} 👋</Text>
            <Text style={styles.heroTitle}>Move {"\n"}Anything,Anywhere</Text>
            <Text style={styles.heroSubtitle}>{"\n"}Fast. Safe. Reliable.</Text>
          </View>
          <View style={styles.heroButtonCol}>
            <Pressable style={styles.heroButton} onPress={() => setActiveTab("add")}>
              <LinearGradient
                colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
                style={styles.heroButtonGrad}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.heroButtonText} numberOfLines={1}>Add Shipment</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ImageBackground>

        {/* UNREAD NOTIFICATION CARDS — shown below hero banner */}
        {unreadNotifications.length > 0 && (
          <View style={styles.notifStack}>
            <View style={styles.notifStackHeader}>
              <View style={styles.notifStackBell}>
                <Ionicons name="notifications" size={14} color={DARK_GLASS_THEME.electricBlue} />
              </View>
              <Text style={styles.notifStackTitle}>
                {unreadNotifications.length} New Update{unreadNotifications.length > 1 ? "s" : ""}
              </Text>
              <Pressable onPress={() => router.push("/drawer/notifications" as any)}>
                <Text style={styles.notifStackSeeAll}>See all</Text>
              </Pressable>
            </View>

            {unreadNotifications.map((notif) => {
              const accent = getNotifAccent(notif.type);
              return (
                <Pressable
                  key={notif._id}
                  style={[styles.notifCard, { borderLeftColor: accent }]}
                  onPress={() => handleNotifPress(notif)}
                >
                  <View style={[styles.notifCardIconWrap, { backgroundColor: accent + "18" }]}>
                    <Ionicons name={getNotifIcon(notif.type)} size={18} color={accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.notifCardTopRow}>
                      <View style={[styles.notifTypePill, { backgroundColor: accent + "18" }]}>
                        <Text style={[styles.notifTypePillText, { color: accent }]}>
                          {getNotifTypeLabel(notif.type)}
                        </Text>
                      </View>
                      {(notif as any).currentStatus && (
                        <View style={styles.notifStatusPill}>
                          <View style={[styles.notifStatusDot, { backgroundColor: accent }]} />
                          <Text style={[styles.notifStatusText, { color: accent }]}>
                            {(notif as any).currentStatus}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.notifCardTitle} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    <Text style={styles.notifCardMessage} numberOfLines={2}>
                      {notif.message}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={accent} style={{ marginTop: 2 }} />
                </Pressable>
              );
            })}
          </View>
        )}

        <SectionTitle title="Overview" />
        <View style={styles.statsGrid}>
          {stats.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </View>

        <SectionTitle title="Quick Actions" />
        <View style={styles.actionsGrid}>
          <QuickActionCard title="New Shipment" icon="add-circle-outline" onPress={() => setActiveTab("add")} />
          <QuickActionCard title="Track Shipment" icon="search-outline" onPress={() => setActiveTab("track")} />
          <QuickActionCard title="My Shipments" icon="cube-outline" onPress={() => setActiveTab("shipments")} />
          <QuickActionCard title="Send Enquiry" icon="help-buoy-outline" onPress={() => router.push("/drawer/enquiries" as any)} />
          <QuickActionCard title="Branch Locator" icon="map-outline" onPress={() => router.push("/drawer/branch-locator")} />
          <QuickActionCard title="Contact Support" icon="call-outline" onPress={() => Linking.openURL("tel:+910000000000")} />
        </View>

        <SectionTitle title="Recent Shipments" />
        {renderShipmentList(5)}
        {shipments.length > 5 && (
          <Pressable
            style={styles.seeAllWrapper}
            onPress={() => setActiveTab("shipments")}
          >
            <Text style={styles.seeAllText}>See All Shipments</Text>
            <Ionicons name="arrow-forward" size={14} color={DARK_GLASS_THEME.electricBlue} />
          </Pressable>
        )}

        <SectionTitle title="Support Desk" />
        {renderSupportCard()}
      </>
    );
  };

  return (
    <LinearGradient
      colors={[DARK_GLASS_THEME.bgNavy, DARK_GLASS_THEME.bgDarkBlue]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            {/* HEADER BRAND ROW */}
            <View style={styles.brandRow}>
              <View style={styles.headerLeftGroup}>
                <Pressable
                  style={styles.menuIcon}
                  onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                >
                  <Ionicons name="menu-outline" size={24} color={DARK_GLASS_THEME.textPrimary} />
                </Pressable>
                <Image
                  source={require("../../assets/images/logo.jpg")}
                  style={styles.headerLogoCircle}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.headerActions}>
                <Pressable style={styles.headerIcon} onPress={() => router.push("/drawer/notifications")}>
                  <Ionicons name="notifications-outline" size={20} color={DARK_GLASS_THEME.textPrimary} />
                  {notifications.some((n) => !n.read) && <View style={styles.headerBadge} />}
                </Pressable>
                <Pressable style={styles.avatar} onPress={() => setActiveTab("profile")}>
                  {profilePhoto ? (
                    <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{customerName.charAt(0).toUpperCase()}</Text>
                  )}
                </Pressable>
              </View>
            </View>

            {renderTabContent()}
          </ScrollView>
        </KeyboardAvoidingView>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </SafeAreaView>
    </LinearGradient>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SupportButton({ title, icon, onPress }: { title: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable style={styles.supportButton} onPress={onPress}>
      <Ionicons name={icon} size={20} color={DARK_GLASS_THEME.electricBlue} />
      <Text style={styles.supportText}>{title}</Text>
    </Pressable>
  );
}

function ProfileSummaryItem({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.profileSummaryItem}>
      <Text style={styles.profileSummaryValue}>{value}</Text>
      <Text style={styles.profileSummaryLabel}>{label}</Text>
    </View>
  );
}

function ProfileActionRow({
  title,
  subtitle,
  icon,
  onPress,
  color,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
}) {
  const iconColor = color || DARK_GLASS_THEME.electricBlue;
  return (
    <Pressable style={styles.profileActionRow} onPress={onPress}>
      <View style={[styles.profileActionIcon, { backgroundColor: iconColor + "12" }]}>
        <Ionicons name={icon} size={21} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.profileActionTitle}>{title}</Text>
        <Text style={styles.profileActionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </Pressable>
  );
}

function TransactionRow({ title, date, amount, negative }: { title: string; date: string; amount: string; negative?: boolean }) {
  return (
    <View style={styles.transactionRow}>
      <View style={styles.transactionIconWrap}>
        <Ionicons
          name={negative ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
          size={24}
          color={negative ? DARK_GLASS_THEME.orange : DARK_GLASS_THEME.cyan}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.transactionTitle}>{title}</Text>
        <Text style={styles.transactionDate}>{date}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: negative ? "#EF4444" : DARK_GLASS_THEME.cyan }]}>
        {amount}
      </Text>
    </View>
  );
}

function BottomNav({
  activeTab,
  onChange,
}: {
  activeTab: DashboardTab;
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
        {items.map((item, index) => {
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
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    paddingBottom: 126,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
  },
  headerLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: DARK_GLASS_THEME.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  profileAvatarImage: {
    width: 62,
    height: 62,
    borderRadius: 22,
  },
  heroSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 65,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#4263EB",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    overflow: "hidden",
  },
  heroBgImage: {
    opacity: 1.0,
    borderRadius: 26,
  },
  heroTextCol: {
    flex: 1.1,
  },
  heroKicker: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
    lineHeight: 26,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
    color: '#282729ff',
  },
  heroButtonCol: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
  heroButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  heroButtonGrad: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 10,
  },
  heroButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  trackingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1.2,
    borderRadius: 22,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 8,
    ...DARK_GLASS_THEME.shadow,
  },
  trackingIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(79, 124, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  trackingTitle: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  trackingInput: {
    minHeight: 38,
    color: DARK_GLASS_THEME.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  trackButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  trackButtonGrad: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  trackText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  emptyState: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    marginHorizontal: 16,
  },
  emptyTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10,
  },
  emptyText: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginTop: 5,
  },
  supportCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    marginHorizontal: 16,
  },
  supportButton: {
    width: "48%",
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.02)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  supportText: {
    color: DARK_GLASS_THEME.textPrimary,
    fontWeight: "800",
  },
  profileHero: {
    borderRadius: 28,
    padding: 22,
    marginHorizontal: 16,
    borderWidth: 1.2,
    borderColor: "rgba(226, 232, 240, 0.8)",
    shadowColor: DARK_GLASS_THEME.electricBlue,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  profileHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  profileAvatarGlow: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: DARK_GLASS_THEME.electricBlue,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  profileAvatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 31,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  profileAvatarText: {
    color: DARK_GLASS_THEME.electricBlue,
    fontSize: 24,
    fontWeight: "900",
  },
  profileKicker: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  profileName: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  profileMeta: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  profileEditIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(37, 99, 235, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.12)",
  },
  profileSummaryRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  profileSummaryItem: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "rgba(37, 99, 235, 0.04)",
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.08)",
  },
  profileSummaryValue: {
    color: DARK_GLASS_THEME.textPrimary,
    fontWeight: "900",
    fontSize: 18,
  },
  profileSummaryLabel: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 3,
  },
  profileActionsCard: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1.2,
    borderRadius: 24,
    padding: 8,
    marginHorizontal: 16,
    marginTop: 14,
    ...DARK_GLASS_THEME.shadow,
  },
  profileActionRow: {
    minHeight: 72,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
  },
  profileActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(79, 124, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileActionTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },
  profileActionSubtitle: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
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
  walletCard: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    ...DARK_GLASS_THEME.shadow,
  },
  walletLabel: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 14,
    fontWeight: "800",
  },
  walletBalance: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 8,
  },
  addMoneyButton: {
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  addMoneyGrad: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addMoneyText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  transactionList: {
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderColor: DARK_GLASS_THEME.border,
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 8,
    marginHorizontal: 16,
    ...DARK_GLASS_THEME.shadow,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
  },
  transactionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  transactionTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  transactionDate: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "900",
  },
  seeAllWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 10,
    marginHorizontal: 16,
    gap: 4,
  },
  seeAllText: {
    color: DARK_GLASS_THEME.electricBlue,
    fontSize: 13,
    fontWeight: "800",
  },
  headerBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  notificationAlertCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: "rgba(124, 58, 237, 0.22)",
    overflow: "hidden",
  },
  notificationAlertGrad: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notifIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifAlertTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },
  notifAlertMessage: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  // New stacked notification cards
  notifStack: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 2,
    gap: 8,
  },
  notifStackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  notifStackBell: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "rgba(79, 124, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifStackTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 13,
    fontWeight: "900",
    flex: 1,
  },
  notifStackSeeAll: {
    color: DARK_GLASS_THEME.electricBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  notifCard: {
    backgroundColor: "rgba(240, 253, 244, 0.95)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    borderLeftWidth: 4,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    shadowColor: "#10B981",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  notifCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  notifCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  notifTypePill: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  notifTypePillText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  notifStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  notifStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  notifStatusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  notifCardTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 17,
  },
  notifCardMessage: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
    lineHeight: 16,
  },
});

