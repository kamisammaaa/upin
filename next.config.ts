process.env.TZ = 'Asia/Jakarta';

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,          // Aktifkan gzip/brotli compression untuk semua response (~60% lebih kecil)
  poweredByHeader: false,  // Sembunyikan "X-Powered-By: Next.js" dari response header
};

export default nextConfig;
