const baseUrl = process.env.EXPO_PUBLIC_BASE_URL?.trim();

module.exports = {
  expo: {
    name: "Witnessed",
    slug: "fandomhub",
    scheme: "fandomhub",
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
