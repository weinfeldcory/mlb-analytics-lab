import { useWindowDimensions } from "react-native";

export const breakpoints = {
  phone: 480,
  largePhone: 640,
  tablet: 900,
  desktop: 1200
} as const;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  const isPhone = width < breakpoints.phone;
  const isLargePhone = width >= breakpoints.phone && width < breakpoints.largePhone;
  const isTablet = width >= breakpoints.largePhone && width < breakpoints.tablet;
  const isDesktop = width >= breakpoints.tablet;
  const isWideDesktop = width >= breakpoints.desktop;
  const isCompact = width < breakpoints.largePhone;
  const isNarrow = width < breakpoints.tablet;

  return {
    width,
    height,
    isPhone,
    isLargePhone,
    isTablet,
    isDesktop,
    isWideDesktop,
    isCompact,
    isNarrow,
    pagePadding: isPhone ? 12 : isLargePhone ? 16 : 20,
    sectionPadding: isPhone ? 16 : isLargePhone ? 18 : 20,
    cardGap: isPhone ? 12 : 16
  };
}
