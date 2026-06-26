import "react-native-reanimated";
import { Drawer } from "expo-router/drawer";
import { router, usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeToken } from "../../utils/token";
import { getHomeRouteForRole, normalizeRole } from "../../utils/roleRoutes";
import {
  DrawerContentScrollView,
  useDrawerStatus,
} from "@react-navigation/drawer";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  BackHandler,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { DARK_GLASS_THEME } from "../../constants/theme";
import { getProfileApi, UserProfile } from "../../api/auth";

const COLORS = {
  textPrimary: DARK_GLASS_THEME.textPrimary,
  textSecondary: DARK_GLASS_THEME.textSecondary,
  card: DARK_GLASS_THEME.cardBg,
  border: DARK_GLASS_THEME.border,
  danger: "#EF4444",
};

function DrawerItemRow({ icon, label, onPress, danger = false }: any) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <View style={[styles.iconContainer, danger && { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? COLORS.danger : DARK_GLASS_THEME.electricBlue}
        />
      </View>
      <Text
        style={[
          styles.itemText,
          danger && { color: COLORS.danger },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CustomDrawerContent(props: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("Customer");
  const [role, setRole] = useState("customer");
  const drawerStatus = useDrawerStatus();

  const fetchProfile = useCallback(() => {
    getProfileApi()
      .then((data) => {
        setProfile(data);
        if (data.name) setName(data.name);
      })
      .catch((err) => console.log("Sidebar profile fetch error:", err));
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("userName").then((n) => setName(n || "Customer"));
    AsyncStorage.getItem("userRole").then((r) => setRole(normalizeRole(r)));
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (drawerStatus === "open") {
      fetchProfile();
    }
  }, [drawerStatus, fetchProfile]);

  const logout = async () => {
    await removeToken();
    await AsyncStorage.clear();
    router.replace("/login");
  };

  const roleValue = normalizeRole(role);
  const isCustomer = roleValue === "customer";

  return (
    <LinearGradient
      colors={[DARK_GLASS_THEME.bgNavy, DARK_GLASS_THEME.bgDarkBlue]}
      style={{ flex: 1 }}
    >
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
        style={{ backgroundColor: "transparent" }}
      >
        {/* 👤 PROFILE CARD (GLASSMORPHIC REDESIGN WITH COLOR COMBO GRADIENT) */}
        <Pressable
          onPress={() => {
            props.navigation.closeDrawer();
            router.replace({ pathname: "/drawer/user-dashboard", params: { tab: "profile" } } as any);
          }}
          style={styles.profileCardPressable}
        >
          <LinearGradient
            colors={["rgba(235, 243, 255, 0.92)", "rgba(247, 241, 255, 0.82)"]}
            style={styles.profileCard}
          >
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
                style={styles.avatarGlow}
              >
                <View style={styles.avatarInner}>
                  {profile?.profilePhoto ? (
                    <Image source={{ uri: profile.profilePhoto }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={28} color="#FFFFFF" />
                  )}
                </View>
              </LinearGradient>
              {/* Status dot */}
              <View style={styles.statusDot} />
            </View>

            <Text style={styles.name}>{name}</Text>
            
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{roleValue.toUpperCase()}</Text>
            </View>

            {profile?.email && (
              <Text style={styles.infoText} numberOfLines={1}>
                <Ionicons name="mail-outline" size={11} /> {profile.email}
              </Text>
            )}

            {profile?.mobile && (
              <Text style={styles.infoText} numberOfLines={1}>
                <Ionicons name="call-outline" size={11} /> {profile.mobile}
              </Text>
            )}
          </LinearGradient>
        </Pressable>

        {/* 📋 MENU */}
        <View style={styles.menu}>
          <DrawerItemRow
            icon="home-outline"
            label="Dashboard"
            onPress={() => router.push(getHomeRouteForRole(roleValue) as any)}
          />

          {/* Add Shipment instead of Track/Requests */}
          <DrawerItemRow
            icon="add-circle-outline"
            label="Add Shipment"
            onPress={() => router.push({ pathname: "/drawer/user-dashboard", params: { tab: "add" } } as any)}
          />

          {isCustomer && (
            <>
              <DrawerItemRow
                icon="chatbubble-ellipses-outline"
                label="Send Enquiry"
                onPress={() => router.push("/drawer/enquiries")}
              />
              <DrawerItemRow
                icon="alert-circle-outline"
                label="Raise Complaint"
                onPress={() => router.push("/drawer/complaints")}
              />
            </>
          )}

          <DrawerItemRow
            icon="map-outline"
            label="Branch Locator"
            onPress={() => router.push("/drawer/branch-locator")}
          />
          <DrawerItemRow
            icon="call-outline"
            label="Contact Us"
            onPress={() => router.push("/drawer/contact")}
          />

          <View style={styles.divider} />

          <DrawerItemRow
            icon="log-out-outline"
            label="Logout"
            danger
            onPress={logout}
          />
        </View>
      </DrawerContentScrollView>
    </LinearGradient>
  );
}

export default function DrawerLayout() {
  const pathname = usePathname();
  const [role, setRole] = useState("customer");

  useEffect(() => {
    AsyncStorage.getItem("userRole").then((r) => setRole(normalizeRole(r)));
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }

      const homeRoute = getHomeRouteForRole(role);
      if (pathname !== homeRoute) {
        router.replace(homeRoute as any);
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [pathname, role]);

  return (
    <Drawer
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >



      <Drawer.Screen
        name="user-dashboard"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="enquiries"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="all-enquiries"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="complaints"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="all-complaints"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="notifications"
        options={{ drawerItemStyle: { display: "none" } }}
      />



      <Drawer.Screen
        name="shipment-details"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="track-shipment"
        options={{ drawerItemStyle: { display: "none" } }}
      />

      <Drawer.Screen
        name="branch-locator"
        options={{ drawerItemStyle: { display: "none" } }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  profileCardPressable: {
    marginHorizontal: 16,
    borderRadius: 24,
    marginBottom: 20,
    overflow: "visible",
  },
  profileCard: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: DARK_GLASS_THEME.electricBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 37,
    backgroundColor: DARK_GLASS_THEME.bgNavy,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 37,
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  name: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  roleBadge: {
    backgroundColor: "rgba(61, 99, 242, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    marginBottom: 10,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "900",
    color: DARK_GLASS_THEME.electricBlue,
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  menu: {
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(61, 99, 242, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    marginLeft: 14,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 14,
    marginHorizontal: 16,
  },
});
