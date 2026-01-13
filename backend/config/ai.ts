import OpenAI from 'openai'

// Next.js automatically loads environment variables from .env.local
// When running in Next.js context, variables are available via process.env
// When running standalone scripts, ensure environment variables are set
const openaiApiKey = process.env.OPENAI_API_KEY

if (!openaiApiKey) {
  throw new Error(
    'Missing OPENAI_API_KEY environment variable. Please set it in .env.local or as an environment variable'
  )
}

export const openai = new OpenAI({
  apiKey: openaiApiKey,
})
