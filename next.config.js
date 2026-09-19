/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  webpack: (config) => {
    // pdfjs-dist (UMD) mereferensikan 'canvas' (native Node) secara opsional.
    // Di browser itu tidak dipakai, jadi jangan ikut di-bundle oleh webpack.
    config.externals = [...config.externals, { canvas: "canvas" }];
    return config;
  },
}

module.exports = nextConfig
