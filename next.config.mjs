/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignorar erros de tipo durante o build
    ignoreBuildErrors: true
  },
  eslint: {
    // Ignorar erros de lint durante o build
    ignoreDuringBuilds: true
  },
  // Configurações adicionais de segurança
  reactStrictMode: true,
  // Configuração experimental para pacotes externos do servidor
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
    // Adicionar proteção contra version skew
    serverActions: {
      allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
      bodySizeLimit: '2mb'
    }
  },
  // Lidar com warnings de build
  webpack: (config, { isServer }) => {
    config.ignoreWarnings = [/Failed to parse source map/]
    return config
  },
  // Configurações de CORS para a API
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
  // Otimizações de imagem
  images: {
    domains: ['*'],
    minimumCacheTTL: 60,
  },
  // Compressão de resposta
  compress: true,
  // Configuração de poweredBy
  poweredByHeader: false,
};

export default nextConfig;
