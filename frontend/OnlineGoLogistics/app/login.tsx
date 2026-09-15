import React from 'react';
import { router } from 'expo-router';
import { useState, useEffect } from "react";
import { loginApi, requestLoginOtpApi, verifyLoginOtpApi, forgotPasswordApi } from "../api/auth";
import { getHomeRouteForRole } from "../utils/roleRoutes";
import { saveUserSession } from "../utils/session";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DARK_GLASS_THEME } from '../constants/theme';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

const { height } = Dimensions.get('window');

export default function Login() {
  const { t, i18n } = useTranslation();
  const [langModalVisible, setLangModalVisible] = useState(false);

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem("user-language", lang);
    setLangModalVisible(false);
  };

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; message: string; type: 'info' | 'success' | 'error' }>({ visible: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem('saved_username');
        const savedPassword = await AsyncStorage.getItem('saved_password');
        if (savedUsername && savedPassword) {
          setUsername(savedUsername);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (error) {
        console.log("Error loading credentials", error);
      }
    };
    loadSavedCredentials();
  }, []);

  // Email OTP state
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Toast.show({ type: 'error', text1: "Error", text2: "Username and password are required" });
      return;
    }

    try {
      setLoading(true);
      const res = await loginApi({
        username: username.trim().toLowerCase(),
        password: password,
      });

      if (res && res.token) {
        await saveUserSession(res);
        if (rememberMe) {
          await AsyncStorage.setItem('saved_username', username.trim().toLowerCase());
          await AsyncStorage.setItem('saved_password', password);
        } else {
          await AsyncStorage.removeItem('saved_username');
          await AsyncStorage.removeItem('saved_password');
        }
        router.replace(getHomeRouteForRole(res.role) as any);
      } else {
        Toast.show({ type: 'error', text1: "Error", text2: "Login succeeded but token is missing" });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: "Login Failed",
        text2: error?.response?.data?.message || "Invalid credentials or network error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      Toast.show({ type: 'error', text1: "Error", text2: "Enter your username, email, or mobile number" });
      return;
    }

    try {
      setLoading(true);
      const res = await requestLoginOtpApi({ identifier: trimmed.toLowerCase() });
      if (res && res.emailSent === false && !res.smsSent) {
        Toast.show({ type: 'error', text1: "OTP Failed", text2: "Failed to send OTP. Please check server configuration." });
      } else {
        setOtpSent(true);
        const isMobile = /^\d+$/.test(trimmed);
        const method = (res.smsSent || isMobile) ? "Mobile Number via SMS" : "Email";
        Toast.show({ type: 'success', text1: "OTP Sent", text2: `OTP verification code has been sent to your ${method}.` });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: "OTP Failed", text2: error?.response?.data?.message || "Could not send OTP" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedIdentifier = username.trim().toLowerCase();
    if (!otp || otp.trim().length < 4) {
      Toast.show({ type: 'error', text1: "Error", text2: "Enter the OTP you received" });
      return;
    }

    try {
      setLoading(true);
      const res = await verifyLoginOtpApi({
        identifier: trimmedIdentifier,
        otp: otp.trim(),
      });
      await saveUserSession(res);
      router.replace(getHomeRouteForRole(res.role) as any);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: "Verification Failed", text2: error?.response?.data?.message || "Invalid OTP" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailInput = username.trim();
    if (!emailInput) {
      setAlertModal({
        visible: true,
        title: t("forgot_password_title"),
        message: t("forgot_password_empty_msg"),
        type: 'info'
      });
      return;
    }

    try {
      setLoading(true);
      await forgotPasswordApi(emailInput);
      setAlertModal({
        visible: true,
        title: t("reset_link_sent_title"),
        message: t("reset_link_sent_msg"),
        type: 'success'
      });
    } catch (error: any) {
      setAlertModal({
        visible: true,
        title: t("reset_failed_title"),
        message: error?.response?.data?.message || t("reset_failed_default_msg"),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[DARK_GLASS_THEME.bgNavy, DARK_GLASS_THEME.bgDarkBlue]}
      style={styles.container}
    >
      {/* LANGUAGE PICKER MODAL */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable style={styles.langOverlay} onPress={() => setLangModalVisible(false)}>
          <Pressable style={styles.langSheet} onPress={() => {}}>
            <View style={styles.langSheetHandle} />
            <View style={styles.langSheetHeader}>
              <Ionicons name="language-outline" size={32} color={DARK_GLASS_THEME.electricBlue} />
              <Text style={styles.langSheetTitle}>{t("choose_language")}</Text>
              <Text style={styles.langSheetSubtitle}>{t("choose_language_subtitle")}</Text>
            </View>
            {[
              { code: "en", label: "English", native: "English", flag: "🇬🇧" },
              { code: "hi", label: "Hindi", native: "हिंदी", flag: "🇮🇳" },
              { code: "mr", label: "Marathi", native: "मराठी", flag: "🟠" },
            ].map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.langOption,
                  i18n.language === lang.code && styles.langOptionActive,
                ]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langOptionLabel, i18n.language === lang.code && styles.langOptionLabelActive]}>
                    {lang.native}
                  </Text>
                  <Text style={styles.langOptionSub}>{lang.label}</Text>
                </View>
                {i18n.language === lang.code && (
                  <Ionicons name="checkmark-circle" size={22} color={DARK_GLASS_THEME.electricBlue} />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* CUSTOM ALERT MODAL */}
      <Modal
        visible={alertModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <View style={[styles.alertIconContainer, 
              alertModal.type === 'success' ? { backgroundColor: 'rgba(34, 197, 94, 0.15)' } : 
              alertModal.type === 'error' ? { backgroundColor: 'rgba(239, 68, 68, 0.15)' } : 
              { backgroundColor: 'rgba(79, 124, 255, 0.15)' }
            ]}>
              <Ionicons 
                name={
                  alertModal.type === 'success' ? 'checkmark-circle' :
                  alertModal.type === 'error' ? 'close-circle' : 'information-circle'
                } 
                size={40} 
                color={
                  alertModal.type === 'success' ? '#22C55E' :
                  alertModal.type === 'error' ? '#EF4444' : DARK_GLASS_THEME.electricBlue
                } 
              />
            </View>
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertMessage}>{alertModal.message}</Text>
            <TouchableOpacity 
              style={styles.alertButton}
              onPress={() => setAlertModal(prev => ({ ...prev, visible: false }))}
            >
              <LinearGradient
                colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
                style={styles.alertButtonGrad}
              >
                <Text style={styles.alertButtonText}>{t("OK") || "OK"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FLOATING LANGUAGE BUTTON */}
      <Pressable style={styles.floatingLangBtn} onPress={() => setLangModalVisible(true)}>
        <Ionicons name="language-outline" size={16} color="#FFFFFF" />
        <Text style={styles.floatingLangText}>Language / भाषा</Text>
      </Pressable>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Background Glowing Orbs */}
          <View style={styles.topOrb} />
          <View style={styles.bottomOrb} />

      {/* TOP GRADIENT HEADER WITH TRUCK ICON & WAVE */}
      <View style={styles.waveHeaderContainer}>
        <LinearGradient
          colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
          style={styles.waveHeaderGrad}
        >
          <View style={styles.iconCircle}>
            <Image
              source={require('../assets/images/futuristic_truck.png')}
              style={styles.headerImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.waveTitle}>{t("hello_again")}</Text>
        </LinearGradient>
        <View style={styles.waveDivider} />
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>{t("login_subtitle")}</Text>
        
        {/* Login Mode Switch */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeButton, loginMode === "password" && styles.activeMode]}
            onPress={() => { setLoginMode("password"); setOtpSent(false); }}
          >
            <Text style={[styles.modeText, loginMode === "password" && styles.activeModeText]}>
              {t("password")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, loginMode === "otp" && styles.activeMode]}
            onPress={() => { setLoginMode("otp"); setOtpSent(false); }}
          >
            <Text style={[styles.modeText, loginMode === "otp" && styles.activeModeText]}>
              {t("otp")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Username/Email/Mobile input */}
        <View style={styles.inputBox}>
          <TextInput
            placeholder={loginMode === "otp" ? t("mail_otp") : t("email_id")}
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!otpSent}
          />
          <Ionicons name="person-outline" size={20} color="#94A3B8" />
        </View>

        {loginMode === "password" ? (
          <>
            <View style={styles.inputBox}>
              <TextInput
                placeholder={t("password_label")}
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={rememberMe ? "checkbox" : "square-outline"} 
                  size={22} 
                  color={rememberMe ? DARK_GLASS_THEME.cyan : DARK_GLASS_THEME.textSecondary} 
                />
                <Text style={[styles.remember, rememberMe && { color: DARK_GLASS_THEME.textPrimary }]}>
                  {t("remember_me")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgot}>{t("forgot_password")}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Send OTP Button */}
            {!otpSent && (
              <TouchableOpacity
                style={styles.sendOtpBtn}
                onPress={handleSendOtp}
                disabled={loading}
              >
                <LinearGradient
                  colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
                  style={styles.sendOtpGrad}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.sendOtpText}>{t("send_otp_mail")}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
 
            {/* OTP Input */}
            {otpSent && (
              <>
                <View style={[styles.inputBox, { borderColor: DARK_GLASS_THEME.electricBlue }]}>
                  <TextInput
                    placeholder={t("enter_otp")}
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <Ionicons name="shield-checkmark-outline" size={20} color={DARK_GLASS_THEME.electricBlue} />
                </View>
                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={() => { setOtpSent(false); setOtp(""); }}
                >
                  <Text style={styles.resendText}>{t("change_details_resend_otp")}</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>

      {/* BOTTOM ACTION AREA */}
      <View style={styles.bottomArea}>
        {(loginMode === "password" || otpSent) && (
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={loginMode === "password" ? handleLogin : handleVerifyOtp}
            disabled={loading}
          >
            <LinearGradient
              colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons
                  name="arrow-forward"
                  size={26}
                  color="#fff"
                  style={{ transform: [{ rotate: '35deg' }] }}
                />
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => router.replace("/register")}
        >
          <Text style={styles.registerText}>{t("new_user_create_account")}</Text>
        </TouchableOpacity>
      </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Glowing Orbs */
  topOrb: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(66, 99, 235, 0.12)',
    top: -50,
    right: -50,
  },

  bottomOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(108, 76, 255, 0.12)',
    bottom: -100,
    left: -100,
  },

  /* Main content */
  content: {
    width: '88%',
    marginTop: 10,
    zIndex: 2,
    alignSelf: 'center',
  },

  waveHeaderContainer: {
    width: '100%',
    height: 240,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },

  waveHeaderGrad: {
    width: '100%',
    height: '92%',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    overflow: 'hidden',
  },

  headerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },

  waveTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  waveDivider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'transparent',
  },

  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_GLASS_THEME.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.85,
  },

  modeRow: {
    flexDirection: "row",
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },

  modeButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  activeMode: {
    backgroundColor: DARK_GLASS_THEME.electricBlue,
  },

  modeText: {
    color: DARK_GLASS_THEME.textSecondary,
    fontWeight: "700",
  },

  activeModeText: {
    color: "#FFFFFF",
  },

  inputBox: {
    width: '100%',
    height: 56,
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 16,
  },

  input: {
    flex: 1,
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 15,
  },

  sendOtpBtn: {
    marginTop: -4,
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },

  sendOtpGrad: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendOtpText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },

  resendBtn: {
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 16,
  },

  resendText: {
    color: DARK_GLASS_THEME.cyan,
    fontWeight: '700',
    fontSize: 13,
  },

  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  remember: {
    fontSize: 14,
    color: DARK_GLASS_THEME.textSecondary,
    fontWeight: '500',
  },

  forgot: {
    fontSize: 13,
    color: DARK_GLASS_THEME.cyan,
    fontWeight: '600',
  },

  /* Bottom area */
  bottomArea: {
    alignItems: 'center',
    marginTop: 35,
    zIndex: 5,
  },

  buttonContainer: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    overflow: 'hidden',
    transform: [{ rotate: '-35deg' }],
  },

  button: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  registerLink: {
    marginTop: 20,
    zIndex: 5,
    alignSelf: 'center',
  },

  registerText: {
    color: DARK_GLASS_THEME.cyan,
    fontWeight: "700",
    fontSize: 14,
  },

  // Language Picker
  floatingLangBtn: {
    position: "absolute",
    top: 52,
    right: 16,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(79,124,255,0.88)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: DARK_GLASS_THEME.electricBlue,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingLangText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  langOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  langSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingBottom: 44,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  langSheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 22,
  },
  langSheetHeader: {
    alignItems: "center",
    marginBottom: 26,
    gap: 6,
  },
  langSheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 8,
    letterSpacing: 0.2,
  },
  langSheetSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  langOptionActive: {
    backgroundColor: "#EEF2FF",
    borderColor: DARK_GLASS_THEME.electricBlue,
  },
  langFlag: {
    fontSize: 30,
  },
  langOptionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  langOptionLabelActive: {
    color: DARK_GLASS_THEME.electricBlue,
  },
  langOptionSub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
    fontWeight: "500",
  },
  
  /* Custom Alert Modal */
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 21, 40, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: DARK_GLASS_THEME.electricBlue,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  alertIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  alertMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  alertButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
  },
  alertButtonGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
