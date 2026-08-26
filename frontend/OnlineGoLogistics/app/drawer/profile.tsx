import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { removeToken } from "../../utils/token";
import { clearUserSession } from "../../utils/session";

const COLORS = {
  primary: "#7C3AED",
  secondary: "#EC9BCB",
  bgTop: "#F3F4F6",
  bgBottom: "#DCCBFF",
  card: "rgba(255,255,255,0.78)",
  textPrimary: "#171424",
  textSecondary: "#7A7485",
  muted: "#A3A0AF",
  danger: "#EF4444",
  white: "#FFFFFF",
};

export default function Profile() {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem("user-language", lang);
  };

  useEffect(() => {
    const loadProfile = async () => {
      const name = await AsyncStorage.getItem("userName");
      const role = await AsyncStorage.getItem("userRole");
      const userId = await AsyncStorage.getItem("userId");

      setProfile({
        name: name || "User",
        role: role || "Customer",
        userId,
      });
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert(t("logout"), t("sign_out_confirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: async () => {
          await removeToken();
          await clearUserSession();
          router.replace("/login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </Pressable>

          <Text style={styles.headerTitle}>{t("profile")}</Text>

          <Pressable style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHero}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.name?.charAt(0)?.toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.accountLabel}>{t("profile").toUpperCase()}</Text>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileRole}>{t("app_name")}</Text>
          </View>

          <Pressable
            style={styles.editBtn}
            onPress={() => router.push("/drawer/profile-details")}
          >
            <Ionicons name="create-outline" size={22} color={COLORS.white} />
          </Pressable>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{t("bookings")}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{t("in_transit")}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{t("delivered")}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/drawer/profile-details")}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="person-circle-outline" size={28} color={COLORS.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>{t("view_profile_details")}</Text>
              <Text style={styles.menuSubtitle}>{t("edit_profile_subtitle")}</Text>
            </View>

            <Ionicons name="chevron-forward" size={22} color={COLORS.textSecondary} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.menuItem} onPress={handleLogout}>
            <View style={[styles.menuIcon, styles.dangerIcon]}>
              <Ionicons name="log-out-outline" size={26} color={COLORS.danger} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>{t("logout")}</Text>
              <Text style={styles.menuSubtitle}>{t("sign_out_subtitle")}</Text>
            </View>

            <Ionicons name="chevron-forward" size={22} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{t("select_language")}</Text>
        <View style={styles.languageContainer}>
          <Pressable 
            style={[styles.langBtn, i18n.language === "en" && styles.langBtnActive]} 
            onPress={() => changeLanguage("en")}
          >
            <Text style={[styles.langText, i18n.language === "en" && styles.langTextActive]}>{t("english")}</Text>
          </Pressable>
          <Pressable 
            style={[styles.langBtn, i18n.language === "hi" && styles.langBtnActive]} 
            onPress={() => changeLanguage("hi")}
          >
            <Text style={[styles.langText, i18n.language === "hi" && styles.langTextActive]}>{t("hindi")}</Text>
          </Pressable>
          <Pressable 
            style={[styles.langBtn, i18n.language === "mr" && styles.langBtnActive]} 
            onPress={() => changeLanguage("mr")}
          >
            <Text style={[styles.langText, i18n.language === "mr" && styles.langTextActive]}>{t("marathi")}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{t("support")}</Text>

        <View style={styles.supportGrid}>
          <Pressable style={styles.supportBtn} onPress={() => Linking.openURL("tel:9209061234")}>
            <Ionicons name="call-outline" size={24} color={COLORS.primary} />
            <Text style={styles.supportText}>{t("call")}</Text>
          </Pressable>

          <Pressable style={styles.supportBtn} onPress={() => Linking.openURL("whatsapp://send?phone=+919209061234")}>
            <Ionicons name="logo-whatsapp" size={24} color={COLORS.primary} />
            <Text style={styles.supportText}>{t("whatsapp")}</Text>
          </Pressable>

          <Pressable style={styles.supportBtn} onPress={() => Linking.openURL("mailto:onlinegologistics@gmail.com")}>
            <Ionicons name="mail-outline" size={24} color={COLORS.primary} />
            <Text style={styles.supportText}>{t("email")}</Text>
          </Pressable>

          <Pressable style={styles.supportBtn} onPress={() => router.push("/drawer/faq" as any)}>
            <Ionicons name="help-circle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.supportText}>{t("faq")}</Text>
          </Pressable>

          <Pressable style={styles.supportBtn} onPress={() => router.push("/drawer/enquiries" as any)}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.primary} />
            <Text style={styles.supportText}>{t("send_enquiry")}</Text>
          </Pressable>

          <Pressable style={styles.supportBtn} onPress={() => router.push("/drawer/complaints" as any)}>
            <Ionicons name="alert-circle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.supportText}>{t("send_complaint")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const clayShadow = {
  shadowColor: "#8B5CF6",
  shadowOpacity: 0.18,
  shadowRadius: 18,
  shadowOffset: { width: 6, height: 10 },
  elevation: 8,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  scroll: {
    padding: 20,
    paddingBottom: 120,
  },

  header: {
    marginTop: 34,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  iconBtn: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    ...clayShadow,
  },

  profileHero: {
    borderRadius: 32,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    ...clayShadow,
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.24)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },

  avatarText: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.white,
  },

  accountLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "rgba(255,255,255,0.75)",
  },

  profileName: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.white,
  },

  profileRole: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(255,255,255,0.78)",
  },

  editBtn: {
    width: 54,
    height: 54,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    ...clayShadow,
  },

  statValue: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  statLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },

  sectionCard: {
    marginTop: 26,
    backgroundColor: COLORS.card,
    borderRadius: 32,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    ...clayShadow,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },

  menuIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#EEE8FF",
    justifyContent: "center",
    alignItems: "center",
  },

  dangerIcon: {
    backgroundColor: "#FEE2E2",
  },

  menuTitle: {
    fontSize: 38,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  menuSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  divider: {
    height: 1,
    marginHorizontal: 18,
    backgroundColor: "rgba(122,116,133,0.15)",
  },

  sectionTitle: {
    marginTop: 30,
    marginBottom: 14,
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  supportGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  supportBtn: {
    width: "47.8%",
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingVertical: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    ...clayShadow,
  },

  supportText: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  languageContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 6,
    justifyContent: "space-between",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    ...clayShadow,
  },

  langBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 18,
  },

  langBtnActive: {
    backgroundColor: COLORS.primary,
  },

  langText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },

  langTextActive: {
    color: COLORS.white,
  },
});