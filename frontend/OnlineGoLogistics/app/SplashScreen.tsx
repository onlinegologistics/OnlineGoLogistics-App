import React from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DARK_GLASS_THEME } from '../constants/theme';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <LinearGradient
      colors={[DARK_GLASS_THEME.bgNavy, DARK_GLASS_THEME.bgDarkBlue]}
      style={styles.container}
    >
      {/* Glass Card */}
      <View style={styles.card}>
        {/* Illustration */}
        <Image
          source={require('../assets/images/splash_image.jpg')} 
          style={styles.image}
          resizeMode="cover"
        />

        {/* Text */}
        <Text style={styles.title}>
          Send Anything <Text style={styles.fast}>Fast</Text>
        </Text>

        <Text style={styles.subtitle}>
          Create your quick account, and the best way to transfer your items
          from one location to another.
        </Text>

        {/* Button */}
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => router.push('/login')}
        >
          <LinearGradient
            colors={[DARK_GLASS_THEME.electricBlue, DARK_GLASS_THEME.purple]}
            style={styles.button}
          >
            <Ionicons name="arrow-forward" size={26} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    width: '90%',
    height: '82%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 40,
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 60,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },

  image: {
    width: 280,
    height: 280,
    borderRadius: 24,
    marginBottom: 25,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 10,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  fast: {
    color: DARK_GLASS_THEME.cyan,
  },

  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 22,
  },

  buttonContainer: {
    marginTop: 35,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    overflow: 'hidden',
    elevation: 8,
    transform: [{ rotate: '-35deg' }],
  },

  button: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
