const baseUrl = process.env.EXPO_PUBLIC_BASE_URL?.trim();

module.exports = {
  expo: {
    name: "Sports Attendance",
    slug: "sports-attendance",
    scheme: "sportsattendance",
    plugins: ["expo-router"],
    web: {
      output: "static"
    },
    experiments: {
      typedRoutes: true,
      ...(baseUrl ? { baseUrl } : {})
    }
  }
};
