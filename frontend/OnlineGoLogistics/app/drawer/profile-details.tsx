import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  DeviceEventEmitter,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProfileApi, updateProfileApi, deleteAccountApi, UserProfile } from "../../api/auth";
import { removeToken } from "../../utils/token";
import { clearUserSession } from "../../utils/session";
import { DARK_GLASS_THEME } from "../../constants/theme";
import Toast from 'react-native-toast-message';

const emptyProfile: UserProfile = {
  _id: "",
  name: "",
  username: "",
  email: "",
  mobile: "",
  alternateMobile: "",
  whatsappMobile: "",
  address: "",
  company: "",
  role: "",
};

export default function ProfileDetails() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [draft, setDraft] = useState<UserProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteResultModal, setDeleteResultModal] = useState<{
    visible: boolean;
    success: boolean;
    message: string;
  }>({ visible: false, success: false, message: "" });

  const handleBack = useCallback(() => {
    router.replace({ pathname: "/drawer/user-dashboard", params: { tab: "home" } } as any);
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true; // prevent default behavior
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [handleBack]);

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Toast.show({ type: 'error', text1: "Permission required", text2: "Please allow gallery access to update your profile photo." });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        // Show preview modal for user to confirm before uploading
        setPreviewPhoto(result.assets[0].uri);
        setPreviewBase64(result.assets[0].base64);
        setShowPhotoModal(true);
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: "Error", text2: err.message || "Could not select image" });
    }
  };

  const confirmPhotoUpload = async () => {
    if (!previewBase64) return;
    try {
      setSaving(true);
      setShowPhotoModal(false);
      const base64Photo = `data:image/jpeg;base64,${previewBase64}`;
      const res = await updateProfileApi({ profilePhoto: base64Photo });
      setProfile(res.user);
      setDraft(res.user);
      await AsyncStorage.setItem("userName", res.user.name || "");
      DeviceEventEmitter.emit('PROFILE_UPDATED');
      Toast.show({ type: 'success', text1: "Success", text2: "Profile photo updated successfully!" });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: "Error", text2: err.message || "Could not update profile photo" });
    } finally {
      setSaving(false);
      setPreviewPhoto(null);
      setPreviewBase64(null);
    }
  };

  const cancelPhotoPreview = () => {
    setShowPhotoModal(false);
    setPreviewPhoto(null);
    setPreviewBase64(null);
  };

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProfileApi();
      setProfile(data);
      setDraft(data);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: "Profile Error", text2: error?.response?.data?.message || "Could not load profile" });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const setValue = (key: keyof UserProfile, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const saveProfile = async () => {
    if (!draft.name?.trim()) {
      Toast.show({ type: 'error', text1: "Validation", text2: "Name is required" });
      return;
    }

    if (!draft.username?.trim()) {
      Toast.show({ type: 'error', text1: "Validation", text2: "Username is required" });
      return;
    }

    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      Toast.show({ type: 'error', text1: "Validation", text2: "Enter a valid email address" });
      return;
    }

    if (draft.mobile && !/^[0-9]{10}$/.test(draft.mobile.trim())) {
      Toast.show({ type: 'error', text1: "Validation", text2: "Enter a valid 10 digit mobile number" });
      return;
    }

    if (draft.alternateMobile && !/^[0-9]{10}$/.test(draft.alternateMobile.trim())) {
      Toast.show({ type: 'error', text1: "Validation", text2: "Enter a valid 10 digit alternate mobile number" });
      return;
    }

    if (draft.whatsappMobile && !/^[0-9]{10}$/.test(draft.whatsappMobile.trim())) {
      Toast.show({ type: 'error', text1: "Validation", text2: "Enter a valid 10 digit WhatsApp number" });
      return;
    }

    try {
      setSaving(true);
      const res = await updateProfileApi({
        name: draft.name.trim(),
        username: draft.username.trim(),
        email: draft.email?.trim(),
        mobile: draft.mobile?.trim(),
        alternateMobile: draft.alternateMobile?.trim(),
        whatsappMobile: draft.whatsappMobile?.trim(),
        address: draft.address?.trim(),
        company: draft.company?.trim(),
      });
      setProfile(res.user);
      setDraft(res.user);
      await AsyncStorage.setItem("userName", res.user.name || "");
      DeviceEventEmitter.emit('PROFILE_UPDATED');
      setEditing(false);
      Toast.show({ type: 'success', text1: "Success", text2: "Profile updated successfully" });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: "Update Failed", text2: error?.response?.data?.message || "Could not update profile" });
    } finally {
      setSaving(false);
    }
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

  return (
    <>
    {/* Photo Preview Confirmation Modal */}
    <Modal
      visible={showPhotoModal}
      transparent
      animationType="fade"
      onRequestClose={cancelPhotoPreview}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{t("use_this_photo")}</Text>
          <Text style={styles.modalSubtitle}>{t("profile_photo_subtitle")}</Text>
          {previewPhoto && (
            <Image source={{ uri: previewPhoto }} style={styles.modalPreview} />
          )}
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancelBtn} onPress={cancelPhotoPreview}>
              <Ionicons name="close-circle-outline" size={20} color="#94A3B8" />
              <Text style={styles.modalCancelText}>{t("cancel")}</Text>
            </Pressable>
            <Pressable style={styles.modalConfirmBtn} onPress={confirmPhotoUpload} disabled={saving}>
              <LinearGradient
                colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
                style={styles.modalConfirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                    <Text style={styles.modalConfirmText}>{t("use_photo")}</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
    <LinearGradient
      colors={[DARK_GLASS_THEME.bgNavy, DARK_GLASS_THEME.bgDarkBlue]}
      style={styles.screen}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
          style={styles.header}
        >
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={22} color={DARK_GLASS_THEME.textPrimary} />
          </Pressable>
          <Pressable onPress={pickImage} style={styles.avatarWrapper}>
            <LinearGradient
              colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
              style={styles.avatarGlow}
            >
              <View style={styles.avatarInner}>
                {profile.profilePhoto ? (
                  <Image source={{ uri: profile.profilePhoto }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{(profile.name || "U").charAt(0).toUpperCase()}</Text>
                )}
              </View>
            </LinearGradient>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={12} color="#FFF" />
            </View>
          </Pressable>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={styles.headerKicker}>OnlineGo Logistics</Text>
            <Text style={styles.headerTitle}>{t("profile")}</Text>
            <Text style={styles.headerSubtitle}>{t("manage_account_identity")}</Text>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={DARK_GLASS_THEME.electricBlue} />
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.profileName}>{profile.name || "User"}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.profileRole}>{profile.role || "user"}</Text>
                    </View>
                  </View>
                  <Pressable
                    style={[styles.editButton, editing && styles.editButtonActive]}
                    onPress={() => {
                      if (editing) {
                        setDraft(profile);
                        setEditing(false);
                      } else {
                        setEditing(true);
                      }
                    }}
                  >
                    <Ionicons name={editing ? "close" : "create-outline"} size={16} color={editing ? "#EF4444" : DARK_GLASS_THEME.electricBlue} />
                    <Text style={[styles.editText, { color: editing ? "#EF4444" : DARK_GLASS_THEME.electricBlue }]}>
                      {editing ? t("cancel") : t("edit_details")}
                    </Text>
                  </Pressable>
                </View>

                <EditableField
                  label={t("full_name")}
                  icon="person-outline"
                  iconColor="#8B5CF6"
                  editable={editing}
                  value={draft.name}
                  onChangeText={(text: string) => setValue("name", text)}
                />
                <EditableField
                  label={t("company_name")}
                  icon="business-outline"
                  iconColor="#EC4899"
                  editable={editing}
                  value={draft.company || ""}
                  onChangeText={(text: string) => setValue("company", text)}
                />
                <EditableField
                  label={t("email_address")}
                  icon="mail-outline"
                  iconColor="#EF4444"
                  editable={editing}
                  value={draft.email || ""}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={(text: string) => setValue("email", text)}
                />
                <EditableField
                  label={t("phone_number")}
                  icon="call-outline"
                  iconColor="#10B981"
                  editable={editing}
                  value={draft.mobile || ""}
                  keyboardType="phone-pad"
                  onChangeText={(text: string) => setValue("mobile", text)}
                />
                <EditableField
                  label={t("alternate_number")}
                  icon="phone-portrait-outline"
                  iconColor="#06B6D4"
                  editable={editing}
                  value={draft.alternateMobile || ""}
                  keyboardType="phone-pad"
                  onChangeText={(text: string) => setValue("alternateMobile", text)}
                />
                <EditableField
                  label={t("whatsapp_number")}
                  icon="logo-whatsapp"
                  iconColor="#25D366"
                  editable={editing}
                  value={draft.whatsappMobile || ""}
                  keyboardType="phone-pad"
                  onChangeText={(text: string) => setValue("whatsappMobile", text)}
                />
                <EditableField
                  label={t("address_label")}
                  icon="location-outline"
                  iconColor="#F59E0B"
                  editable={editing}
                  value={draft.address || ""}
                  multiline
                  onChangeText={(text: string) => setValue("address", text)}
                />

                <View style={[styles.readonlySection, { marginTop: 24, marginBottom: 4 }]}>
                  <ReadonlyRow icon="shield-checkmark-outline" label={t("status")} value={profile.isActive === false ? t("inactive") : t("active")} />
                </View>

                {editing && (
                  <Pressable onPress={saveProfile} disabled={saving} style={styles.saveWrapper}>
                    <LinearGradient
                      colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
                      style={styles.saveButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {saving ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                          <Text style={styles.saveText}>{t("save_changes")}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}

                {/* Danger Zone: Delete Account */}
                <Pressable
                  onPress={handleDeleteAccount}
                  disabled={saving}
                  style={styles.deleteAccountWrapper}
                >
                  <View style={styles.deleteAccountButton}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.deleteAccountText}>{t("delete_account")}</Text>
                  </View>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>

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
                colors={deleteResultModal.success ? ["#22C55E", "#16A34A"] : [DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
                style={{ height: 48, justifyContent: "center", alignItems: "center" }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 15 }}>OK</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
    </>
  );
}

function ReadonlyRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={DARK_GLASS_THEME.electricBlue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

function EditableField({ icon, iconColor, label, editable, ...props }: any) {
  const activeColor = iconColor || DARK_GLASS_THEME.electricBlue;
  const inactiveColor = "#94A3B8";
  return (
    <View style={styles.editableWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputRow,
        !editable && styles.disabledInput,
        editable && styles.activeInputRow
      ]}>
        <View style={[
          styles.fieldIconContainer,
          { backgroundColor: editable ? `${activeColor}12` : `${inactiveColor}0C` }
        ]}>
          <Ionicons name={icon} size={18} color={editable ? activeColor : inactiveColor} />
        </View>
        <TextInput
          editable={editable}
          placeholder={label}
          placeholderTextColor="#94A3B8"
          style={[styles.input, props.multiline && styles.textArea, { marginLeft: 6 }]}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  fieldIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    minHeight: 112,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    shadowColor: DARK_GLASS_THEME.electricBlue,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarGlow: {
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
  avatarInner: {
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
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 31,
  },
  cameraBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DARK_GLASS_THEME.electricBlue,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatarText: {
    color: DARK_GLASS_THEME.electricBlue,
    fontSize: 24,
    fontWeight: "900",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
  },
  headerKicker: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
    marginTop: 2,
  },
  headerSubtitle: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: "rgba(226, 232, 240, 0.8)",
    padding: 20,
    shadowColor: DARK_GLASS_THEME.electricBlue,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.6)",
  },
  profileName: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  profileRole: {
    color: DARK_GLASS_THEME.electricBlue,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(37, 99, 235, 0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.12)",
  },
  editButtonActive: {
    backgroundColor: "rgba(239, 68, 68, 0.06)",
    borderColor: "rgba(239, 68, 68, 0.15)",
  },
  editText: {
    fontSize: 13,
    fontWeight: "800",
  },
  readonlySection: {
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.03)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  value: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  editableWrap: {
    marginTop: 16,
  },
  inputRow: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    backgroundColor: "rgba(248, 250, 252, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  activeInputRow: {
    borderColor: DARK_GLASS_THEME.electricBlue,
    backgroundColor: "#FFFFFF",
    shadowColor: DARK_GLASS_THEME.electricBlue,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  disabledInput: {
    backgroundColor: "rgba(241, 245, 249, 0.5)",
    borderColor: "rgba(226, 232, 240, 0.4)",
    opacity: 0.75,
  },
  input: {
    flex: 1,
    color: DARK_GLASS_THEME.textPrimary,
    fontWeight: "700",
    fontSize: 14,
    minHeight: 48,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  saveWrapper: {
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: DARK_GLASS_THEME.electricBlue,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  saveButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    padding: 24,
    width: "100%",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  modalTitle: {
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  modalSubtitle: {
    color: DARK_GLASS_THEME.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  modalPreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: DARK_GLASS_THEME.electricBlue,
    marginVertical: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    backgroundColor: "rgba(241, 245, 249, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  modalCancelText: {
    color: DARK_GLASS_THEME.textSecondary,
    fontWeight: "800",
    fontSize: 14,
  },
  modalConfirmBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  modalConfirmGradient: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },
  deleteAccountWrapper: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    overflow: "hidden",
  },
  deleteAccountButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteAccountText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "800",
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
});
