import { config as buildConfig } from './build'

export const config = {
  ...buildConfig,
  stripe: {
    ...buildConfig.stripe,
    prices: {
      standard: process.env.STRIPE_PRICE_ID,
    },
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    plans: {
      free: {
        priceId: process.env.STRIPE_FREE_PRICE_ID || '',
        quota: {
          credits: 100
        }
      },
      pro: {
        priceId: process.env.STRIPE_PRO_PRICE_ID || '',
        quota: {
          credits: 1000
        }
      }
    }
  }
} as const 