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
  // Lidar com warnings de build
  webpack: (config, { isServer }) => {
    config.ignoreWarnings = [/Failed to parse source map/]
    return config
  },
  async headers() {
    return [
      {
        source: "/api/:path*", // Aplica os cabeçalhos para todas as rotas na API
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // Libera acesso de qualquer origem
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS", // Métodos HTTP permitidos
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization", // Cabeçalhos permitidos
          },
        ],
      },
    ];
  },
};

export default nextConfig;
