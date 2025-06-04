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