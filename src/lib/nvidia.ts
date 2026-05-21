import OpenAI from 'openai'

export const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY!,
  baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
})

export const MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct'
