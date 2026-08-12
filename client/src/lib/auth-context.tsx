import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getDefaultToken } from './common/api'

export interface AuthContextValue {
  isAuthenticated: boolean
  setAuthenticated: (value: boolean) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState<boolean>(() =>
    typeof window !== 'undefined' && Boolean(getDefaultToken()),
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuthenticated(Boolean(getDefaultToken()))
    }
  }, [])

  const value = useMemo(
    () => ({ isAuthenticated, setAuthenticated }),
    [isAuthenticated]
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
