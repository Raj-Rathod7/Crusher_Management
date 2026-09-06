import { MutationCache, QueryClient } from '@tanstack/react-query'
import { getDefaultToken } from '#/lib/common/api'

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: () => {
      void queryClient.invalidateQueries()
    },
  }),
})

export function getContext() {
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
