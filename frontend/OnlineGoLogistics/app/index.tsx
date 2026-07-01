import { useEffect, useRef } from "react";
import { router } from "expo-router";
import { getToken } from "../utils/token";
import { getHomeRouteForRole } from "../utils/roleRoutes";
import { View, Text, StyleSheet, ImageBackground, ActivityIndicator, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from "expo-linear-gradient";
import { DARK_GLASS_THEME } from "../constants/theme";

export default function Index() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const loaderFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    // Fade + slide in the overlay content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade in loader after 600ms
    Animated.timing(loaderFade, {
      toValue: 1,
      delay: 600,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const checkAuth = async () => {
      try {
        const token = await getToken();
        setTimeout(async () => {
          if (token) {
            const role = await AsyncStorage.getItem("userRole");
            router.replace(getHomeRouteForRole(role) as any);
          } else {
            router.replace("/login" as any);
          }
        }, 2500);
      } catch (error) {
        setTimeout(() => {
          router.replace("/login" as any);
        }, 2500);
      }
    };

    checkAuth();
  }, []);

  return (
    <ImageBackground
      source={require("../assets/images/futuristic_truck.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(11,21,40,0.15)', 'rgba(11,21,40,0.55)', 'rgba(11,21,40,0.97)']}
        style={styles.gradient}
      >
        {/* Top Brand Badge */}
        <Animated.View style={[styles.topBadge, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>🚚  LOGISTICS PLATFORM</Text>
          </View>
        </Animated.View>

        {/* Bottom Content */}
        <Animated.View style={[styles.bottomContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>Online Go{"\n"}Logistics</Text>
          <Text style={styles.subtitle}>Delivering the future, today.</Text>

          <Animated.View style={[styles.loaderContainer, { opacity: loaderFade }]}>
            <ActivityIndicator size="small" color={DARK_GLASS_THEME.cyan} />
            <Text style={styles.loadingText}>Initializing Secure Environment...</Text>
          </Animated.View>
        </Animated.View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1528',
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 28,
  },
  topBadge: {
    alignItems: 'flex-start',
  },
  badgePill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgePillText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  bottomContent: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 52,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 10,
    marginBottom: 36,
    letterSpacing: 0.3,
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: DARK_GLASS_THEME.cyan,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  }
});
