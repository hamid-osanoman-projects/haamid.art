import type { NextConfig } from "next";

// @ts-ignore
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  serverExternalPackages: ['three', '@react-three/fiber', '@react-three/drei', 'matter-js', 'hls.js', 'stats-gl', 'three-stdlib'],
};

export default withPWA(nextConfig);
