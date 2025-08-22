/** @type {import('next').NextConfig} */
const nextConfig = {
  // SPA mode for Netlify
  trailingSlash: true,

  // إعدادات الصور
  images: {
    domains: ['res.cloudinary.com', 'lh3.googleusercontent.com'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: true
  },

  compress: true,

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

};

module.exports = nextConfig;
