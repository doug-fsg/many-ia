import jwt from 'jsonwebtoken';

// Definindo o tipo para o payload do token decodificado
export interface DecodedToken {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Função para verificar e decodificar um token JWT
export function verifyToken(token: string): DecodedToken {
  try {
    // Usando uma variável de ambiente para o segredo JWT ou um valor padrão para desenvolvimento
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    // Verificando e decodificando o token
    const decoded = jwt.verify(token, secret) as DecodedToken;
    return decoded;
  } catch (error) {
    // Lançando um erro se a verificação falhar
    throw new Error('Invalid or expired token');
  }
} 