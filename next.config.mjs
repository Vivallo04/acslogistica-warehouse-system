import {withSentryConfig} from "@sentry/nextjs";
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds:
      process.env.NODE_ENV !== "production" && process.env.CI !== "true",
  },
  typescript: {
    ignoreBuildErrors:
      process.env.NODE_ENV !== "production" && process.env.CI !== "true",
  },
  images: {
    unoptimized: false,
  },
}

// Conditionally apply Sentry config only when auth token is available
export default process.env.SENTRY_AUTH_TOKEN 
  ? withSentryConfig(nextConfig, {
      org: "lambda-qv",
      project: "acslogistica-control-center",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : nextConfig;