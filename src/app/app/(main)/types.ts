import { ReturnTypeWithoutPromise } from '@/types/return-type-without-promise'
import { getUserAIConfigs } from './actions'

export type AIConfig = ReturnTypeWithoutPromise<typeof getUserAIConfigs>[0]
