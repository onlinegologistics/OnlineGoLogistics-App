import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { DARK_GLASS_THEME } from '../../constants/theme';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function PhoneOtpScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmResult, setConfirmResult] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Task 6 & 10: Where OTP is sent
  // This function initiates the Firebase Phone Auth verification process.
  // It triggers the real Firebase SMS transmission to the user's mobile number.
  const handleSendOtp = async () => {
    // Phone number format validation: must start with '+' followed by country code and digits
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a valid phone number with country code (e.g. +919876543210).' });
      return;
    }

    try {
      setLoading(true);
      // Firebase triggers SMS OTP transmission to the real number here:
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber.trim());
      setConfirmResult(confirmation);
      Toast.show({ type: 'success', text1: 'OTP Sent', text2: 'An OTP has been sent to your phone number via SMS.' });
    } catch (error: any) {
      console.error('Firebase signInWithPhoneNumber failed:', error.message);
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to send OTP. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Task 6, 7, 8, 9 & 10: Where OTP is verified, backend API is called, and navigation happens
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter the verification OTP.' });
      return;
    }

    if (!confirmResult) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No active verification session. Please request OTP first.' });
      return;
    }

    try {
      setLoading(true);
      // 1. Where OTP is verified on Firebase server:
      const result = await confirmResult.confirm(otp.trim());

      if (result && result.user) {
        // Verification succeeded!
        Toast.show({ type: 'success', text1: 'Success', text2: 'Phone number verified successfully!' });

        // 2. Get Firebase user uid, phone number, and ID token:
        const idToken = await result.user.getIdToken();
        const uid = result.user.uid;
        const verifiedPhone = result.user.phoneNumber;

        console.log('Firebase Verification Success:', { uid, verifiedPhone });

        // 3. Where backend login API should be called:
        // We submit the ID token to the backend for verification and user session creation.
        /*
        try {
          const response = await api.post('/auth/firebase-login', {
            idToken,
            phoneNumber: verifiedPhone,
            firebaseUid: uid,
          });
          
          // Save session locally
          if (response.data && response.data.token) {
            await saveUserSession(response.data);
          }
        } catch (apiError: any) {
          console.error('Backend firebase-login integration error:', apiError.message);
        }
        */

        // 4. Where navigation should happen:
        // TODO: Redirect user depending on their registration state.
        // - If user is new (does not exist in database), navigate to Register/Profile completion screen:
        //   router.replace('/register');
        // - If user already exists in database, navigate to Home/Dashboard:
        //   router.replace('/drawer/user-dashboard');
        
        // Default routing fallback for now:
        router.replace('/drawer/user-dashboard' as any);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'OTP verification failed. Please try again.' });
      }
    } catch (error: any) {
      console.error('Firebase confirmation confirm failed:', error.message);
      Toast.show({ type: 'error', text1: 'Verification Failed', text2: 'Invalid OTP code. Please enter the correct code.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = () => {
    setConfirmResult(null);
    setOtp('');
  };

  return (
    <LinearGradient
      colors={[DARK_GLASS_THEME.bgNavy, DARK_GLASS_THEME.bgDarkBlue]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Glowing Background Orbs */}
          <View style={styles.topOrb} />
          <View style={styles.bottomOrb} />

          {/* Logistics Design Header */}
          <View style={styles.waveHeaderContainer}>
            <LinearGradient
              colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
              style={styles.waveHeaderGrad}
            >
              <View style={styles.iconCircle}>
                <Image
                  source={require('../../assets/images/futuristic_truck.png')}
                  style={styles.headerImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.waveTitle}>Secure Login</Text>
            </LinearGradient>
            <View style={styles.waveDivider} />
          </View>

          {/* Content Area */}
          <View style={styles.content}>
            <Text style={styles.subtitle}>
              Verify your mobile number to instantly log in or register.
            </Text>

            {!confirmResult ? (
              // STEP 1: Enter Phone Number
              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>Mobile Number (with country code)</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    placeholder="e.g. +919876543210"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Ionicons name="call-outline" size={20} color="#94A3B8" />
                </View>

                <TouchableOpacity
                  style={styles.buttonContainer}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
                    style={styles.button}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Send OTP via SMS</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              // STEP 2: Enter OTP received via SMS
              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>Enter 6-Digit OTP sent to {phoneNumber}</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    placeholder="Enter verification code"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    secureTextEntry // Task: Do not show OTP on mobile screen
                    maxLength={6}
                  />
                  <Ionicons name="shield-checkmark-outline" size={20} color="#94A3B8" />
                </View>

                <TouchableOpacity
                  style={styles.buttonContainer}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
                    style={styles.button}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Verify OTP & Continue</Text>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleResetSession}
                  disabled={loading}
                >
                  <Text style={styles.resetText}>Change Phone Number</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backLink}
            >
              <Text style={styles.backLinkText}>Back to password login</Text>
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
  topOrb: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    top: -50,
    right: -50,
  },
  bottomOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
    bottom: -80,
    left: -80,
  },
  waveHeaderContainer: {
    height: 220,
    overflow: 'hidden',
  },
  waveHeaderGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  waveTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  waveDivider: {
    height: 20,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    shadowColor: '#2563EB',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 15,
    height: 54,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '500',
  },
  buttonContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
  },
  button: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    alignItems: 'center',
    marginTop: 15,
    padding: 10,
  },
  resetText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 30,
    padding: 10,
  },
  backLinkText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
