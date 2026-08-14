import type { QueryKey } from '@tanstack/react-query'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type JsonPrimitive = string | number | boolean | null

type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

type RequestBody = BodyInit | JsonValue | Record<string, unknown> | null | undefined

type ApiRequestOptions = {
  method?: HttpMethod
  body?: RequestBody
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean | null | undefined>
  signal?: AbortSignal
  timeout?: number
  auth?: boolean
  responseType?: 'json' | 'text'
}

type ApiClientConfig = {
  baseUrl?: string
  timeout?: number
  getToken?: () => string | null
  headers?: Record<string, string>
  onUnauthorized?: () => void
}

export class ApiError extends Error {
  status: number
  statusText: string
  body: unknown

  constructor(message: string, options: { status: number; statusText: string; body?: unknown }) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.statusText = options.statusText
    this.body = options.body
  }
}

function combineSignals(...signals: Array<AbortSignal | undefined>): AbortSignal | undefined {
  const activeSignals = signals.filter((signal): signal is AbortSignal => Boolean(signal))

  if (activeSignals.length === 0) {
    return undefined
  }

  if (activeSignals.length === 1) {
    return activeSignals[0]
  }

  const controller = new AbortController()
  const abort = () => controller.abort()

  for (const signal of activeSignals) {
    if (signal.aborted) {
      abort()
      break
    }

    signal.addEventListener('abort', abort, { once: true })
  }

  return controller.signal
}

export function getDefaultToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return (
    window.localStorage.getItem('access_token')
  )
}

function getDefaultBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8081'
}

function buildUrl(baseUrl: string, path: string, params?: ApiRequestOptions['params']): URL {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${normalizedBaseUrl}${normalizedPath}`)

  if (!params) {
    return url
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue
    }

    url.searchParams.set(key, String(value))
  }

  return url
}

function parseResponseBody(response: Response, responseText: string, responseType: ApiRequestOptions['responseType']): unknown {
  if (response.status === 204 || responseText.length === 0) {
    return undefined
  }

  if (responseType === 'text') {
    return responseText
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return responseText ? JSON.parse(responseText) : undefined
  }

  return responseText
}

export function createApiClient(config: ApiClientConfig = {}) {
  const baseUrl = config.baseUrl ?? getDefaultBaseUrl()
  const timeout = config.timeout ?? 10000
  const headers = { ...(config.headers ?? {}) }
  const getToken = config.getToken ?? getDefaultToken

  const request = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
    const method = options.method ?? 'GET'
    const auth = options.auth ?? true
    const timeoutMs = options.timeout ?? timeout
    const headersFromOptions = options.headers ?? {}
    const requestHeaders = new Headers(headers)

    Object.entries(headersFromOptions).forEach(([key, value]) => {
      requestHeaders.set(key, value)
    })

    if (auth) {
      const token = getToken()
      if (token) {
        requestHeaders.set('Authorization', `Bearer ${token}`)
      }
    }

    let requestBody: BodyInit | undefined

    if (options.body !== undefined && options.body !== null) {
      if (
        typeof options.body === 'string' ||
        options.body instanceof Blob ||
        options.body instanceof ArrayBuffer ||
        options.body instanceof FormData ||
        options.body instanceof URLSearchParams
      ) {
        requestBody = options.body as BodyInit
      } else {
        requestHeaders.set('Content-Type', 'application/json')
        requestBody = JSON.stringify(options.body)
      }
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
    const signal = combineSignals(options.signal, controller.signal)

    try {
      const response = await fetch(buildUrl(baseUrl, path, options.params), {
        method,
        headers: requestHeaders,
        body: method === 'GET' ? undefined : requestBody,
        signal,
        credentials: 'include',
      })

      const responseText = await response.text()
      const data = parseResponseBody(response, responseText, options.responseType ?? 'json')

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          config.onUnauthorized?.()
        }

        const message = ((data as { message?: string } | undefined)?.message ?? response.statusText) || 'Request failed'
        throw new ApiError(message, {
          status: response.status,
          statusText: response.statusText,
          body: data,
        })
      }

      return data as T
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timed out', {
          status: 408,
          statusText: 'Request Timeout',
          body: null,
        })
      }

      throw error
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  return {
    get: <T>(path: string, options?: Omit<ApiRequestOptions, 'body' | 'method'>) => request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: RequestBody, options?: Omit<ApiRequestOptions, 'body' | 'method'>) =>
      request<T>(path, { ...options, method: 'POST', body }),
    put: <T>(path: string, body?: RequestBody, options?: Omit<ApiRequestOptions, 'body' | 'method'>) =>
      request<T>(path, { ...options, method: 'PUT', body }),
    patch: <T>(path: string, body?: RequestBody, options?: Omit<ApiRequestOptions, 'body' | 'method'>) =>
      request<T>(path, { ...options, method: 'PATCH', body }),
    delete: <T>(path: string, options?: Omit<ApiRequestOptions, 'body' | 'method'>) => request<T>(path, { ...options, method: 'DELETE' }),
    request,
  }
}


export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') {
    return
  }

  if (token) {
    window.localStorage.setItem('access_token', token)
    return
  }

  window.localStorage.removeItem('access_token')
}

export const apiClient = createApiClient({
  onUnauthorized: () => {
    setAuthToken(null)

    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
  },
})
