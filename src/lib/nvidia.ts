import OpenAI from 'openai'

export const MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct'

let _client: OpenAI | null = null

export function getNvidiaClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY || 'placeholder',
      baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    })
  }
  return _client
}

// Keep backward compat export — resolved lazily
export const nvidiaClient = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getNvidiaClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
