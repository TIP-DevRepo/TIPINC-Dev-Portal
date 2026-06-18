import { useIsAuthenticated } from '@azure/msal-react'
import Login from '../pages/Login'

export default function ProtectedRoute({ children }) {
  // TODO: Remove this bypass when Entra credentials are configured
  if (import.meta.env.DEV) return children

  const isAuthenticated = useIsAuthenticated()
  return isAuthenticated ? children : <Login />
}