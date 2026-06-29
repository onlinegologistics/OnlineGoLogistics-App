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
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProfileApi, updateProfileApi, UserProfile } from "../../api/auth";
import { DARK_GLASS_THEME } from "../../constants/theme";
import Toast from 'react-native-toast-message';

const emptyProfile: UserProfile = {
  _id: "",
  name: "",
  username: "",
  email: "",
  mobile: "",
  address: "",
  company: "",
  role: "",
};

export default function ProfileDetails() {
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [draft, setDraft] = useState<UserProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

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

    try {
      setSaving(true);
      const res = await updateProfileApi({
        name: draft.name.trim(),
        username: draft.username.trim(),
        email: draft.email?.trim(),
        mobile: draft.mobile?.trim(),
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
          <Text style={styles.modalTitle}>Use this photo?</Text>
          <Text style={styles.modalSubtitle}>This will be your new profile photo.</Text>
          {previewPhoto && (
            <Image source={{ uri: previewPhoto }} style={styles.modalPreview} />
          )}
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancelBtn} onPress={cancelPhotoPreview}>
              <Ionicons name="close-circle-outline" size={20} color="#94A3B8" />
              <Text style={styles.modalCancelText}>Cancel</Text>
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
                    <Text style={styles.modalConfirmText}>Use Photo</Text>
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
            <Text style={styles.headerTitle}>Profile Details</Text>
            <Text style={styles.headerSubtitle}>Manage your account & identity</Text>
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
                      {editing ? "Cancel" : "Edit Details"}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.readonlySection}>
                  <ReadonlyRow icon="finger-print-outline" label="User ID" value={profile._id} />
                  <ReadonlyRow icon="shield-checkmark-outline" label="Status" value={profile.isActive === false ? "Inactive" : "Active"} />
                </View>

                <EditableField
                  label="Full Name"
                  icon="person-outline"
                  editable={editing}
                  value={draft.name}
                  onChangeText={(text: string) => setValue("name", text)}
                />
                <EditableField
                  label="Username"
                  icon="person-circle-outline"
                  editable={editing}
                  value={draft.username}
                  autoCapitalize="none"
                  onChangeText={(text: string) => setValue("username", text)}
                />
                <EditableField
                  label="Email Address"
                  icon="mail-outline"
                  editable={editing}
                  value={draft.email || ""}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={(text: string) => setValue("email", text)}
                />
                <EditableField
                  label="Phone Number"
                  icon="call-outline"
                  editable={editing}
                  value={draft.mobile || ""}
                  keyboardType="phone-pad"
                  onChangeText={(text: string) => setValue("mobile", text)}
                />
                <EditableField
                  label="Address"
                  icon="location-outline"
                  editable={editing}
                  value={draft.address || ""}
                  multiline
                  onChangeText={(text: string) => setValue("address", text)}
                />
                <EditableField
                  label="Company"
                  icon="business-outline"
                  editable={editing}
                  value={draft.company || ""}
                  onChangeText={(text: string) => setValue("company", text)}
                />

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
                          <Text style={styles.saveText}>Save Changes</Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
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

function EditableField({ icon, label, editable, ...props }: any) {
  return (
    <View style={styles.editableWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputRow,
        !editable && styles.disabledInput,
        editable && styles.activeInputRow
      ]}>
        <Ionicons name={icon} size={18} color={editable ? DARK_GLASS_THEME.electricBlue : "#94A3B8"} />
        <TextInput
          editable={editable}
          placeholder={label}
          placeholderTextColor="#94A3B8"
          style={[styles.input, props.multiline && styles.textArea]}
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
});
