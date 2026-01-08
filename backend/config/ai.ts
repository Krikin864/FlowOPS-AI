import OpenAI from 'openai'
import dotenv from 'dotenv'
import * as path from 'path'

// Get the base directory to load the .env file
// In Next.js, process.cwd() points to the project root
// In direct Node execution, __dirname points to the file directory
let baseDir: string
try {
  // @ts-ignore - __dirname may be available in CommonJS
  if (typeof __dirname !== 'undefined' && __dirname.includes('backend')) {
    // We're running directly from backend/
    baseDir = __dirname
  } else {
    // We're in Next.js or ESM - use process.cwd() (project root)
    baseDir = process.cwd()
  }
} catch {
  baseDir = process.cwd()
}

// Load environment variables from backend/.env using explicit path
// If baseDir is the project root, use 'backend/.env'
// If baseDir is backend/config/, use '../../backend/.env'
let envPath: string
if (baseDir.endsWith('backend/config') || baseDir.includes('backend/config')) {
  // We're in backend/config/, go up two levels
  envPath = path.resolve(baseDir, '../../backend/.env')
} else {
  // We're in the project root (Next.js)
  envPath = path.resolve(baseDir, 'backend/.env')
}

console.log('Loading .env from:', envPath)
console.log('Base directory:', baseDir)
console.log('process.cwd():', process.cwd())

// Load the .env file
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.warn('Warning: Could not load .env file:', result.error.message)
  console.warn('Attempted path:', envPath)
} else {
  console.log('Successfully loaded .env file from:', envPath)
}

// Verify that the key was loaded
const openaiApiKey = process.env.OPENAI_API_KEY

if (!openaiApiKey) {
  console.error('OPENAI_API_KEY not found in environment variables')
  console.error('Checked path:', envPath)
  throw new Error('Missing OPENAI_API_KEY environment variable. Please set it in backend/.env')
}

console.log('OPENAI_API_KEY loaded successfully')

export const openai = new OpenAI({
  apiKey: openaiApiKey,
})
