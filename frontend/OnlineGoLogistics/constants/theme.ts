/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const LOGISTICS_THEME = {
  primary: '#0F3D2E',
  primaryDark: '#062D27',
  accent: '#D7A84F',
  background: '#F4FAF7',
  card: '#FFFFFF',
  cardSoft: '#F8FBF9',
  textPrimary: '#0F172A',
  textSecondary: '#6B7280',
  border: '#D7E8E1',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#F59E0B',
  infoSoft: '#E6F4EF',
  headerTextSoft: '#D8EEE6',
};

export const DARK_GLASS_THEME = {
  bgNavy: '#F8FAFC',
  bgDarkBlue: '#EFF6FF',
  electricBlue: '#2563EB',
  purple: '#0EA5E9',
  cyan: '#14B8A6',
  orange: '#F59E0B',
  cardBg: 'rgba(255, 255, 255, 0.88)',
  border: 'rgba(226, 232, 240, 0.85)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  shadow: {
    shadowColor: '#2563EB',
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  }
};
