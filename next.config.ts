import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
    // Pin the workspace root to this directory.
    //
    // Without it Turbopack walks up looking for a lockfile and can settle on
    // an unrelated one further up the tree (an empty ~/package-lock.json was
    // doing exactly that). It then watches the wrong directory, so edits to
    // files in this project never trigger a rebuild — the dev server keeps
    // serving the previous render and the change looks like it did nothing.
    turbopack: {
        root: path.resolve(__dirname),
    },
    typescript: {
        ignoreBuildErrors: true,
    },
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
