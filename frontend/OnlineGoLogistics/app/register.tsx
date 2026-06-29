import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  requestRegistrationOtpApi,
  verifyRegistrationOtpApi,
} from "../api/auth";
import { saveUserSession } from "../utils/session";
import { DARK_GLASS_THEME } from "../constants/theme";
import Toast from 'react-native-toast-message';

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [showAlternate, setShowAlternate] = useState(false);
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateFields = () => {
    if (!name.trim() || !email.trim() || !mobile.trim() || !password || !address.trim()) {
      Toast.show({ type: 'error', text1: "Error", text2: "Name, email, mobile, password and address are required" });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Toast.show({ type: 'error', text1: "Validation Error", text2: "Please enter a valid email address" });
      return false;
    }
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile.trim())) {
      Toast.show({ type: 'error', text1: "Validation Error", text2: "Please enter a valid 10-digit mobile number" });
      return false;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: "Validation Error", text2: "Password must be at least 6 characters long" });
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateFields()) return;

    try {
      setLoading(true);
      // Calls backend registration which sends OTP to their entered Email (Gmail)
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        alternateMobile: showAlternate && alternateMobile.trim() ? alternateMobile.trim() : undefined,
        password,
        address: address.trim(),
      };
      const res = await requestRegistrationOtpApi(payload);
      if (res && res.emailSent === false) {
        Toast.show({ type: 'error', text1: "OTP Failed", text2: "Failed to send email. Please check server Gmail configuration." });
      } else {
        setOtpSent(true);
        Toast.show({ type: 'success', text1: "OTP Sent", text2: `OTP verification code has been sent to your Gmail.` });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: "OTP Failed", text2: error?.response?.data?.message || "Could not send OTP" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otp || otp.trim().length < 4) {
      Toast.show({ type: 'error', text1: "Error", text2: "Enter the OTP you received" });
      return;
    }

    try {
      setLoading(true);
      const user = await verifyRegistrationOtpApi({
        mobile: mobile.trim(),
        otp: otp.trim(),
      });
      await saveUserSession(user);
      router.replace("/drawer/user-dashboard");
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Verification failed";
      Alert.alert(
        "Registration Failed",
        msg,
        [
          { text: "Login", onPress: () => router.replace("/login") },
          { text: "OK", style: "cancel" }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[DARK_GLASS_THEME.bgNavy, DARK_GLASS_THEME.bgDarkBlue]}
      style={styles.container}
    >
      {/* Background Orbs */}
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
          <Text style={styles.waveTitle}>Create Account</Text>
        </LinearGradient>
        <View style={styles.waveDivider} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>Register with Gmail OTP verification</Text>

          <Input label="Full Name" value={name} onChangeText={setName} icon="person-outline" editable={!otpSent} />
          
          {/* Email with Gmail OTP */}
          <View style={[styles.inputBox, otpSent && { borderColor: '#22C55E' }]}>
            <TextInput
              placeholder="Email Address"
              style={styles.input}
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!otpSent}
            />
            <Ionicons name="mail-outline" size={20} color={otpSent ? '#22C55E' : '#94A3B8'} />
          </View>

          {/* Verified badge if OTP sent */}
          {otpSent && (
            <View style={styles.verifyBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.verifyText}>OTP sent to {email}</Text>
              <TouchableOpacity onPress={() => { setOtpSent(false); setOtp(""); }}>
                <Text style={styles.changeText}>  Change</Text>
              </TouchableOpacity>
            </View>
          )}

          <Input
            label="Mobile Number (10 digits)"
            value={mobile}
            onChangeText={setMobile}
            icon="call-outline"
            keyboardType="phone-pad"
            editable={!otpSent}
          />

          {!showAlternate ? (
            <Pressable onPress={() => setShowAlternate(true)} style={styles.addAltBtn} disabled={otpSent}>
              <Text style={styles.addAltText}>+ Add Alternate No</Text>
            </Pressable>
          ) : (
            <Input
              label="Alternate Mobile Number"
              value={alternateMobile}
              onChangeText={setAlternateMobile}
              icon="call-outline"
              keyboardType="phone-pad"
              editable={!otpSent}
            />
          )}

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            icon="key-outline"
            secureTextEntry
            editable={!otpSent}
          />
          <Input
            label="Address"
            value={address}
            onChangeText={setAddress}
            icon="home-outline"
            editable={!otpSent}
          />

          {/* OTP input - only shows after Gmail OTP sent */}
          {otpSent && (
            <View style={[styles.inputBox, { borderColor: DARK_GLASS_THEME.electricBlue }]}>
              <TextInput
                placeholder="Enter OTP from Gmail"
                style={styles.input}
                placeholderTextColor="#94A3B8"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              <Ionicons name="shield-checkmark-outline" size={20} color={DARK_GLASS_THEME.electricBlue} />
            </View>
          )}

          {/* Main action button */}
          <Pressable
            onPress={otpSent ? handleVerifyAndRegister : handleSendOtp}
            disabled={loading}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
              style={styles.primaryButton}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>
                  {otpSent ? "✓ VERIFY OTP & REGISTER" : "SEND OTP via Gmail"}
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => router.replace("/login")} style={styles.linkButton}>
            <Text style={styles.linkText}>Already registered? Login</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function Input({ label, icon, editable = true, ...props }: any) {
  return (
    <View style={[styles.inputBox, !editable && { opacity: 0.5 }]}>
      <TextInput placeholder={label} style={styles.input} placeholderTextColor="#94A3B8" editable={editable} {...props} />
      <Ionicons name={icon} size={20} color="#94A3B8" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 120,
  },
  addAltBtn: {
    alignSelf: "flex-start",
    marginTop: -8,
    marginBottom: 14,
    paddingLeft: 4,
  },
  addAltText: {
    color: "#10B981",
    fontWeight: "800",
    fontSize: 13,
  },
  verifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 14,
    paddingLeft: 4,
  },
  verifyText: {
    color: '#22C55E',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  changeText: {
    color: DARK_GLASS_THEME.cyan,
    fontWeight: '700',
    fontSize: 13,
  },
  /* Glowing Orbs */
  topOrb: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(66, 99, 235, 0.1)',
    top: -50,
    right: -50,
  },
  bottomOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(108, 76, 255, 0.1)',
    bottom: -100,
    left: -100,
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
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.85,
  },
  inputBox: {
    width: "100%",
    height: 56,
    backgroundColor: DARK_GLASS_THEME.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DARK_GLASS_THEME.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: DARK_GLASS_THEME.textPrimary,
    fontSize: 15,
  },
  buttonWrapper: {
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  primaryButton: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  linkButton: {
    alignItems: "center",
    marginTop: 18,
  },
  linkText: {
    color: DARK_GLASS_THEME.cyan,
    fontWeight: "700",
    fontSize: 14,
  },
});
