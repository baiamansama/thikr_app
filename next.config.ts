import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// next-intl needs a Next.js plugin so server components like `getTranslations`
// can resolve the runtime config (especially with Turbopack).
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Google OAuth avatars
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { dev }) => {
    // Work around occasional Webpack dev runtime/HMR corruption issues
    // (e.g. "__webpack_modules__[moduleId] is not a function") by avoiding
    // filesystem cache in development.
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
