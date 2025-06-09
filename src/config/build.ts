export const isBuildTime = () => {
  return process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'build'
}

export const isServer = () => {
  return typeof window === 'undefined'
}

export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development'
}

export const isProduction = () => {
  return process.env.NODE_ENV === 'production'
}

export const config = {
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
} as const 