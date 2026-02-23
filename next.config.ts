import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async headers() {
          return [
            {
                      // Allow iframe embedding for preview routes
                    source: "/api/preview/:path*",
                      headers: [
                        { key: "X-Frame-Options", value: "ALLOWALL" },
                        { key: "Content-Security-Policy", value: "frame-ancestors *" },
                                ],
            },
            {
                      // Allow iframe embedding for the entire app (mobile emulators, responsive testers)
                    source: "/:path*",
                      headers: [
                        { key: "X-Frame-Options", value: "ALLOWALL" },
                        { key: "Content-Security-Policy", value: "frame-ancestors *" },
                                ],
            },
                ];
    },
};

export default nextConfig;
