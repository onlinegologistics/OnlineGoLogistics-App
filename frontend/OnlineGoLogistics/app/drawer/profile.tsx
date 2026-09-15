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
  Platform,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { removeToken } from "../../utils/token";
import { clearUserSession } from "../../utils/session";
import { deleteAccountApi } from "../../api/auth";

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

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteResultModal, setDeleteResultModal] = useState<{
    visible: boolean;
    success: boolean;
    message: string;
  }>({ visible: false, success: false, message: "" });

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

  const executeDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      await deleteAccountApi();
      await removeToken();
      await clearUserSession();
      setDeleteModalVisible(false);
      setDeleteResultModal({
        visible: true,
        success: true,
        message: t("delete_account_success") || "Your account has been deleted successfully.",
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Could not delete account. Please try again.";
      setDeleteModalVisible(false);
      setDeleteResultModal({
        visible: true,
        success: false,
        message: msg,
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteModalVisible(true);
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

        {/* Delete Account below Support */}
        <View style={styles.deleteAccountCardWrapper}>
          <Pressable style={styles.deleteAccountCard} onPress={handleDeleteAccount}>
            <View style={[styles.menuIcon, styles.dangerIcon]}>
              <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: COLORS.danger }]}>{t("delete_account")}</Text>
              <Text style={styles.menuSubtitle}>{t("delete_account_subtitle")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.danger} />
          </Pressable>
        </View>
      </ScrollView>

      {/* 🗑️ BEAUTIFUL CUSTOM DELETE ACCOUNT CONFIRMATION MODAL */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deletingAccount) setDeleteModalVisible(false);
        }}
      >
        <View style={styles.customModalOverlay}>
          <View style={styles.customModalCard}>
            {/* Danger Icon Container */}
            <View style={styles.dangerIconContainer}>
              <View style={styles.dangerIconGlow} />
              <Ionicons name="trash-outline" size={36} color="#EF4444" />
            </View>

            {/* Warning Pill */}
            <View style={styles.warningPill}>
              <Ionicons name="warning-outline" size={13} color="#DC2626" />
              <Text style={styles.warningPillText}>Permanent Action</Text>
            </View>

            <Text style={styles.customModalTitle}>{t("delete_account_confirm_title")}</Text>
            <Text style={styles.customModalMessage}>
              {t("delete_account_confirm_message")}
            </Text>

            {/* Action Buttons */}
            <View style={styles.customModalActions}>
              <Pressable
                style={styles.customModalCancelBtn}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deletingAccount}
              >
                <Text style={styles.customModalCancelText}>{t("cancel")}</Text>
              </Pressable>

              <Pressable
                style={styles.customModalDeleteBtn}
                onPress={executeDeleteAccount}
                disabled={deletingAccount}
              >
                <LinearGradient
                  colors={["#EF4444", "#DC2626"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.customModalDeleteGrad}
                >
                  {deletingAccount ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="trash" size={17} color="#FFFFFF" />
                      <Text style={styles.customModalDeleteText}>{t("delete_account")}</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📋 CUSTOM RESULT MODAL (SUCCESS / ERROR) */}
      <Modal
        visible={deleteResultModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (deleteResultModal.success) {
            setDeleteResultModal((prev: any) => ({ ...prev, visible: false }));
            router.replace("/login");
          } else {
            setDeleteResultModal((prev: any) => ({ ...prev, visible: false }));
          }
        }}
      >
        <View style={styles.customModalOverlay}>
          <View style={styles.customModalCard}>
            <View style={[
              styles.dangerIconContainer,
              deleteResultModal.success 
                ? { backgroundColor: "rgba(34, 197, 94, 0.12)", borderColor: "rgba(34, 197, 94, 0.25)" } 
                : { backgroundColor: "rgba(239, 68, 68, 0.12)", borderColor: "rgba(239, 68, 68, 0.25)" }
            ]}>
              <Ionicons
                name={deleteResultModal.success ? "checkmark-circle" : "alert-circle"}
                size={38}
                color={deleteResultModal.success ? "#22C55E" : "#EF4444"}
              />
            </View>

            <Text style={styles.customModalTitle}>
              {deleteResultModal.success ? "Account Deleted" : "Deletion Failed"}
            </Text>
            <Text style={styles.customModalMessage}>
              {deleteResultModal.message}
            </Text>

            <Pressable
              style={{ width: "100%", borderRadius: 14, overflow: "hidden" }}
              onPress={() => {
                const isSuccess = deleteResultModal.success;
                setDeleteResultModal((prev: any) => ({ ...prev, visible: false }));
                if (isSuccess) {
                  router.replace("/login");
                }
              }}
            >
              <LinearGradient
                colors={deleteResultModal.success ? ["#22C55E", "#16A34A"] : [COLORS.primary, COLORS.secondary]}
                style={{ height: 48, justifyContent: "center", alignItems: "center" }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 15 }}>OK</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  deleteAccountCardWrapper: {
    marginTop: 22,
    marginBottom: 16,
  },
  deleteAccountCard: {
    borderRadius: 24,
    backgroundColor: "rgba(254, 242, 242, 0.9)",
    borderWidth: 1.2,
    borderColor: "rgba(239, 68, 68, 0.35)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...clayShadow,
  },
  /* Custom Delete / Confirmation Modal */
  customModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(11, 21, 40, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  customModalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  dangerIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  dangerIconGlow: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: "rgba(239, 68, 68, 0.06)",
  },
  warningPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    marginBottom: 12,
  },
  warningPillText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  customModalTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  customModalMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  customModalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  customModalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  customModalCancelText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "800",
  },
  customModalDeleteBtn: {
    flex: 1.3,
    borderRadius: 15,
    overflow: "hidden",
  },
  customModalDeleteGrad: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  customModalDeleteText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
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