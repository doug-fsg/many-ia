import { User } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: User & {
      isIntegrationUser: boolean;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    isIntegrationUser: boolean;
  }
}
