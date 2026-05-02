export const colors = {
  navy: "#11243d",
  navySoft: "#21476f",
  green: "#1b7f6a",
  amber: "#e5a93d",
  red: "#b84d3d",
  white: "#fffdf8",
  slate050: "#f8f3eb",
  slate100: "#efe5d6",
  slate200: "#ddcfbb",
  slate300: "#cbbca6",
  slate400: "#9a907f",
  slate500: "#6a6258",
  slate700: "#3f3b35",
  slate900: "#1f1b17",
  canvas: "#f4ecdf",
  canvasAlt: "#ede2d1",
  clay: "#d27b52",
  sky: "#d9e6f2",
  ink: "#181410",
  text: "#1f1b17",
  textMuted: "#5e564b",
  textSoft: "#8d8376",
  textInverse: "#fffdf8",
  surface: "#fffdf8",
  surfaceRaised: "#ffffff",
  surfaceMuted: "#f7f1e7",
  surfaceDark: "#11243d",
  surfaceDarkAlt: "#193151",
  surfaceAccent: "#edf4fb",
  surfaceSuccess: "#e7f5ef",
  surfaceWarning: "#fcf2de",
  surfaceDanger: "#f8e9e5",
  line: "#e2d7c6",
  lineSoft: "#f1e9dd",
  lineStrong: "#c7b79d",
  primary: "#11243d",
  primarySoft: "#21476f",
  success: "#1b7f6a",
  warning: "#e5a93d",
  danger: "#b84d3d",
  info: "#d9e6f2",
  shadow: "#17120d",
  overlay: "rgba(17,36,61,0.08)"
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  "4xl": 56
} as const;

export const radii = {
  xs: 10,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999
} as const;

export const shadows = {
  subtle: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1
  },
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  raised: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4
  },
  hero: {
    shadowColor: colors.navy,
    shadowOpacity: 0.24,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6
  }
} as const;

export const typography = {
  eyebrow: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5
  },
  body: {
    fontSize: 15,
    lineHeight: 22
  },
  bodyLarge: {
    fontSize: 17,
    lineHeight: 25
  },
  titleSm: {
    fontSize: 18,
    lineHeight: 24
  },
  titleMd: {
    fontSize: 24,
    lineHeight: 30
  },
  titleLg: {
    fontSize: 34,
    lineHeight: 40
  },
  display: {
    fontSize: 44,
    lineHeight: 48
  }
} as const;
