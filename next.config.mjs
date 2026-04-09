/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Vercel, ignora los errores de estilo y publica la página
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;