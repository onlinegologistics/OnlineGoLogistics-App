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
  const slideAnim = useRef(new Animated.Value(30)).current;
  const loaderFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide native splash screen so we can show our beautiful RN splash screen
    SplashScreen.hideAsync();

    // Trigger animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(loaderFade, {
        toValue: 1,
        delay: 600,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    const checkAuth = async () => {
      try {
        const token = await getToken();
        // Artificial delay for modern splash screen effect (1.5 seconds)
        setTimeout(async () => {
          if (token) {
            const role = await AsyncStorage.getItem("userRole");
            router.replace(getHomeRouteForRole(role) as any);
          } else {
            router.replace("/login" as any);
          }
        }, 1500);
      } catch (error) {
        setTimeout(() => {
          router.replace("/login" as any);
        }, 1500);
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
        colors={['rgba(11, 21, 40, 0.4)', 'rgba(11, 21, 40, 0.95)', '#0B1528']}
        style={styles.overlay}
      >
        <Animated.View 
          style={[
            styles.content, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>OG</Text>
          </View>
          <Text style={styles.title}>Online Go Logistics</Text>
          <Text style={styles.subtitle}>Delivering the future, today.</Text>
        </Animated.View>

        <Animated.View style={[styles.loaderContainer, { opacity: loaderFade }]}>
          <ActivityIndicator size="large" color={DARK_GLASS_THEME.cyan} />
          <Text style={styles.loadingText}>Initializing Secure Environment...</Text>
        </Animated.View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 100,
  },
  content: {
    alignItems: "center",
    marginTop: 80,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: DARK_GLASS_THEME.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  iconText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  loaderContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 13,
    color: DARK_GLASS_THEME.cyan,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  }
});
