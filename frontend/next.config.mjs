/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                // QuickChart.io — used for the favourability score radial gauge
                hostname: "quickchart.io"
            },
            {
                // Google user profile photos served from lh3.googleusercontent.com
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            }
        ],
    },
}

export default nextConfig;
