import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: resolve(import.meta.dirname, ".."),
  serverExternalPackages: ["playwright"],
  webpack: (config) => {
    config.resolve.alias["@scraper"] = resolve(import.meta.dirname, "../src");
    return config;
  },
};

export default nextConfig;
