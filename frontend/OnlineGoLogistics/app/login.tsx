import React from 'react';
import { router } from 'expo-router';
import { useState } from "react";
import { loginApi, requestLoginOtpApi, verifyLoginOtpApi } from "../api/auth";
import { getHomeRouteForRole } from "../utils/roleRoutes";
import { saveUserSession } from "../utils/session";
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DARK_GLASS_THEME } from '../constants/theme';

const { height } = Dimensions.get('window');

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Username and password are required");
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
        router.replace(getHomeRouteForRole(res.role) as any);
      } else {
        Alert.alert("Error", "Login succeeded but token is missing");
      }
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error?.response?.data?.message || "Invalid credentials or network error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpRequest = async () => {
    if (!username) {
      Alert.alert("Error", "Enter mobile, email or username");
      return;
    }

    try {
      setLoading(true);
      const res = await requestLoginOtpApi({ identifier: username.trim().toLowerCase() });
      setOtpRequested(true);
      Alert.alert(
        "OTP Sent",
        res.devOtp ? `Development OTP: ${res.devOtp}` : "Please check your email or mobile for OTP"
      );
    } catch (error: any) {
      Alert.alert("OTP Failed", error?.response?.data?.message || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    if (!username || !otp) {
      Alert.alert("Error", "Identifier and OTP are required");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyLoginOtpApi({
        identifier: username.trim().toLowerCase(),
        otp: otp.trim(),
      });
      await saveUserSession(res);
      router.replace(getHomeRouteForRole(res.role) as any);
    } catch (error: any) {
      Alert.alert("OTP Login Failed", error?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[DARK_GLASS_THEME.bgNavy, DARK_GLASS_THEME.bgDarkBlue]}
      style={styles.container}
    >
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
          <Text style={styles.waveTitle}>Hello again!</Text>
        </LinearGradient>
        <View style={styles.waveDivider} />
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>Log in to your account to continue.</Text>
        
        {/* Login Mode Switch */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeButton, loginMode === "password" && styles.activeMode]}
            onPress={() => setLoginMode("password")}
          >
            <Text style={[styles.modeText, loginMode === "password" && styles.activeModeText]}>
              Password
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, loginMode === "otp" && styles.activeMode]}
            onPress={() => setLoginMode("otp")}
          >
            <Text style={[styles.modeText, loginMode === "otp" && styles.activeModeText]}>
              OTP
            </Text>
          </TouchableOpacity>
        </View>

        {/* Username */}
        <View style={styles.inputBox}>
          <TextInput
            placeholder={loginMode === "otp" ? "Mobile / Email" : "Username"}
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <Ionicons name="person-outline" size={20} color="#94A3B8" />
        </View>

        {/* Password */}
        {loginMode === "password" ? (
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
            <Ionicons name="key-outline" size={20} color="#94A3B8" />
          </View>
        ) : (
          <>
            {otpRequested ? (
              <>
                <View style={styles.inputBox}>
                  <TextInput
                    placeholder="OTP"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                  />
                  <Ionicons name="shield-checkmark-outline" size={20} color="#94A3B8" />
                </View>
                <TouchableOpacity
                  style={styles.otpButton}
                  onPress={handleOtpRequest}
                  disabled={loading}
                >
                  <Text style={styles.otpText}>Resend OTP</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </>
        )}

        {/* Options */}
        <View style={styles.optionsRow}>
          <Text style={styles.remember}>☑ Remember Me</Text>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </View>
      </View>

      {/* BOTTOM ACTION AREA */}
      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={
            loginMode === "password"
              ? handleLogin
              : otpRequested
                ? handleOtpLogin
                : handleOtpRequest
          }
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
      </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity
        style={styles.registerLink}
        onPress={() => router.replace("/register")}
      >
        <Text style={styles.registerText}>New user? Create account</Text>
      </TouchableOpacity>
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

  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },

  remember: {
    fontSize: 13,
    color: DARK_GLASS_THEME.textSecondary,
  },

  forgot: {
    fontSize: 13,
    color: DARK_GLASS_THEME.cyan,
    fontWeight: '600',
  },

  otpButton: {
    alignItems: "center",
    marginTop: -4,
    marginBottom: 16,
  },

  otpText: {
    color: DARK_GLASS_THEME.cyan,
    fontWeight: "700",
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
});
