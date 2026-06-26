export const APP_THEME = {
  colors: {
    // Main Brand Colors - Logistics Professional Theme
    primaryBlue: '#2563EB',
    deepBlue: '#1E3A8A',
    navy: '#0F172A',

    // Accent Colors
    skyBlue: '#DBEAFE',
    softBlue: '#EFF6FF',
    amber: '#F59E0B',
    softAmber: '#FEF3C7',

    // Backgrounds
    lightBackground: '#F8FAFC',
    bgSoftBlue: '#EFF6FF',
    bgSoftGray: '#F1F5F9',

    // Cards / Glass
    whiteCard: 'rgba(255, 255, 255, 0.94)',
    borderGlass: 'rgba(226, 232, 240, 0.90)',

    // Text
    darkText: '#0F172A',
    mutedText: '#475569',
    lightMutedText: '#94A3B8',

    // Logistics Status Colors
    logisticsBlue: '#2563EB',
    logisticsOrange: '#F59E0B',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#0EA5E9',

    // Extra Status Backgrounds
    successSoft: '#D1FAE5',
    dangerSoft: '#FEE2E2',
    warningSoft: '#FEF3C7',
    infoSoft: '#E0F2FE',
  },

  gradients: {
    background: ['#F8FAFC', '#EFF6FF'] as [string, string],

    headerBlue: ['#1E3A8A', '#2563EB'] as [string, string],

    primaryButton: ['#2563EB', '#0EA5E9'] as [string, string],

    amberButton: ['#F59E0B', '#FBBF24'] as [string, string],

    softCard: ['rgba(255,255,255,0.96)', 'rgba(241,245,249,0.92)'] as [
      string,
      string
    ],
  },

  radius: {
    card: 22,
    input: 16,
    button: 16,
  },

  shadows: {
    primary: {
      shadowColor: '#2563EB',
      shadowOpacity: 0.10,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
    },

    card: {
      shadowColor: '#0F172A',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },

    amber: {
      shadowColor: '#F59E0B',
      shadowOpacity: 0.14,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
    },
  },

  glassCardStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    borderRadius: 22,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  clayCardStyle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#2563EB',
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 4, height: 8 },
    elevation: 5,
  },

  inputStyle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    color: '#0F172A',
  },
};

export const LIQUID_GLASS_THEME = {
  bgLightBlue: '#EFF6FF',
  bgLightGray: '#F8FAFC',

  primaryBlue: '#2563EB',
  deepBlue: '#1E3A8A',
  navy: '#0F172A',

  teal: '#14B8A6',
  orange: '#F59E0B',
  green: '#10B981',
  red: '#EF4444',

  cardBg: 'rgba(255, 255, 255, 0.86)',
  border: 'rgba(226, 232, 240, 0.85)',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  shadow: {
    shadowColor: '#2563EB',
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
};