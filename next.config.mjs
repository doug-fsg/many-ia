/** @type {import('next').NextConfig} */
const nextConfig = {
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
