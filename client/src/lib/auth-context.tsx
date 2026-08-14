import { useQuery } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ApiError, apiClient, getDefaultToken, setAuthToken } from './common/api'

export const authQueryKey = ['auth', 'is-authenticated'] as const
export const authQueryStaleTime = 60_000

export interface AuthContextValue {
  isAuthenticated: boolean
  isChecking: boolean
  setAuthenticated: (value: boolean) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hasToken, setHasToken] = useState(() =>
    typeof window !== 'undefined' && Boolean(getDefaultToken()),
  )

  const authentication = useQuery({
    queryKey: authQueryKey,
    queryFn: () => apiClient.get<boolean>('/users/is-authenticated'),
    enabled: hasToken,
    retry: false,
    staleTime: authQueryStaleTime,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (
      authentication.error instanceof ApiError &&
      (authentication.error.status === 401 || authentication.error.status === 403)
    ) {
      setAuthToken(null)
      setHasToken(false)
    }
  }, [authentication.error])

  const isAuthenticated = hasToken && authentication.data === true
  const isChecking = hasToken && authentication.isPending

  const setAuthenticated = (value: boolean) => {
    if (!value) {
      setAuthToken(null)
    }

    setHasToken(value)
  }

  const value = useMemo(
    () => ({ isAuthenticated, isChecking, setAuthenticated }),
    [isAuthenticated, isChecking]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function hasAuthToken(): boolean {
  return Boolean(getDefaultToken())
}
