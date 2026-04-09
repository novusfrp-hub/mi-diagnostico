/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Vercel, por favor ignora las advertencias de estilo y compila mi app
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig