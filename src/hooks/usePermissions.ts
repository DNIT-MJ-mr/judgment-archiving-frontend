import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { USER_ROLES, UserRole } from '@/lib/constants'

interface Permissions {
  canUpload: boolean
  canValidate: boolean
  canManageUsers: boolean
  canManageCourts: boolean
  canViewAllCourts: boolean
  canDeleteJudgments: boolean
  canManageTemplates: boolean
  canAccessDataEntry: boolean
  canAccessValidation: boolean
  canAccessAdmin: boolean
  isAdmin: boolean
  isValidator: boolean
  isDataEntry: boolean
  isViewer: boolean
}

export function usePermissions(): Permissions {
  const { user } = useAuth()

  return useMemo(() => {
    if (!user) {
      return {
        canUpload: false,
        canValidate: false,
        canManageUsers: false,
        canManageCourts: false,
        canViewAllCourts: false,
        canDeleteJudgments: false,
        canManageTemplates: false,
        canAccessDataEntry: false,
        canAccessValidation: false,
        canAccessAdmin: false,
        isAdmin: false,
        isValidator: false,
        isDataEntry: false,
        isViewer: false,
      }
    }

    const role = user.role as UserRole

    // From user.permissions if available, otherwise derive from role
    const permissions = user.permissions || {
      can_upload: role === USER_ROLES.ADMIN || role === USER_ROLES.DATA_ENTRY,
      can_validate: role === USER_ROLES.ADMIN || role === USER_ROLES.VALIDATOR,
      can_manage_users: role === USER_ROLES.ADMIN,
      can_manage_courts: role === USER_ROLES.ADMIN,
      can_view_all_courts: role === USER_ROLES.ADMIN,
      can_delete_judgments: role === USER_ROLES.ADMIN || role === USER_ROLES.VALIDATOR,
    }

    return {
      canUpload: permissions.can_upload,
      canValidate: permissions.can_validate,
      canManageUsers: permissions.can_manage_users,
      canManageCourts: permissions.can_manage_courts,
      canViewAllCourts: permissions.can_view_all_courts,
      canDeleteJudgments: permissions.can_delete_judgments,
      canManageTemplates: role === USER_ROLES.ADMIN,
      canAccessDataEntry: role === USER_ROLES.ADMIN || role === USER_ROLES.DATA_ENTRY || role === USER_ROLES.VALIDATOR,
      canAccessValidation: role === USER_ROLES.ADMIN || role === USER_ROLES.VALIDATOR,
      canAccessAdmin: role === USER_ROLES.ADMIN,
      isAdmin: role === USER_ROLES.ADMIN,
      isValidator: role === USER_ROLES.VALIDATOR,
      isDataEntry: role === USER_ROLES.DATA_ENTRY,
      isViewer: role === USER_ROLES.VIEWER,
    }
  }, [user])
}

export function useHasRole(...roles: UserRole[]): boolean {
  const { user } = useAuth()
  if (!user) return false
  return roles.includes(user.role as UserRole)
}

export function useRequireRole(...roles: UserRole[]): boolean {
  const hasRole = useHasRole(...roles)
  return hasRole
}

export default usePermissions
