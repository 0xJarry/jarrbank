import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  DATABASE_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)
  
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    const errorMessage = `Invalid environment variables: ${JSON.stringify(fieldErrors, null, 2)}`
    throw new Error(errorMessage)
  }
  
  return result.data
}

export const env = validateEnv()