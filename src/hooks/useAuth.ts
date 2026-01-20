import { useAuth as useAuthContext } from '@/contexts/AuthContext'

export function useAuth() {
  const auth = useAuthContext()
  const { user } = auth

  const permissions = {
    canAccessAdmin: user?.role === 'admin',
    canAccessValidation: user?.role === 'admin' || user?.role === 'validator',
    canAccessDataEntry:
      user?.role === 'admin' ||
      user?.role === 'validator' ||
      user?.role === 'data_entry',
    canView: true, // All authenticated users can view
    isValidator: user?.role === 'validator',
    isAdmin: user?.role === 'admin',
    isDataEntry: user?.role === 'data_entry',
  }

  return {
    ...auth,
    permissions,
  }
}
