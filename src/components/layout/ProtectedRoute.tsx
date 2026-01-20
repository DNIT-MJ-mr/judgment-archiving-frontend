import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { UserRole } from '@/lib/constants'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  requiredPermission?: keyof ReturnType<typeof usePermissions>
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermission,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const permissions = usePermissions()
  const location = useLocation()

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role requirements
  if (requiredRoles && user) {
    const hasRequiredRole = requiredRoles.includes(user.role as UserRole)
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />
    }
  }

  // Check permission requirements
  if (requiredPermission) {
    const hasPermission = permissions[requiredPermission]
    if (!hasPermission) {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute
