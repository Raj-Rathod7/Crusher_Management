import { QueryClient } from '@tanstack/react-query'
import { getDefaultToken } from '#/lib/common/api'

export function getContext() {
  const queryClient = new QueryClient()
  const isClient = typeof window !== 'undefined'
  const isAuthenticated = isClient && Boolean(getDefaultToken())

  return {
    queryClient,
    auth: {
      isAuthenticated,
    },
  }
}
export default function TanstackQueryProvider() {}
