const API_TOKEN = process.env.API_TOKEN;

export function verifyToken(token: string) {
  if (token !== API_TOKEN) {
    throw new Error('Invalid token');
  }
  return { userId: 'authenticated' };
}