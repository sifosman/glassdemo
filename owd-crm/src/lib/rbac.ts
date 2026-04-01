import { UserRole } from '@/providers/tenant-provider'

export const ROLES = {
  SUPER_ADMIN: 'super_admin' as UserRole,
  DISTRIBUTOR: 'distributor' as UserRole,
  BUSINESS_ADMIN: 'business_admin' as UserRole,
  BUSINESS_USER: 'business_user' as UserRole,
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 4,
  distributor: 3,
  business_admin: 2,
  business_user: 1,
}

export function checkRole(userRole: UserRole | null, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false
  return requiredRoles.includes(userRole)
}

export function checkRoleLevel(userRole: UserRole | null, minLevel: number): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= minLevel
}

// Route access definitions
export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  // Super Admin only
  '/admin/distributors': [ROLES.SUPER_ADMIN],
  '/admin/businesses': [ROLES.SUPER_ADMIN],
  '/admin/system': [ROLES.SUPER_ADMIN],
  
  // Distributor and above
  '/distributor/businesses': [ROLES.SUPER_ADMIN, ROLES.DISTRIBUTOR],
  '/distributor/analytics': [ROLES.SUPER_ADMIN, ROLES.DISTRIBUTOR],
  
  // Business admin and above
  '/dashboard/settings': [ROLES.SUPER_ADMIN, ROLES.DISTRIBUTOR, ROLES.BUSINESS_ADMIN],
  '/dashboard/team': [ROLES.SUPER_ADMIN, ROLES.DISTRIBUTOR, ROLES.BUSINESS_ADMIN],
  '/dashboard/pricing': [ROLES.SUPER_ADMIN, ROLES.DISTRIBUTOR, ROLES.BUSINESS_ADMIN],
  
  // All authenticated users
  '/dashboard': [ROLES.SUPER_ADMIN, ROLES.DISTRIBUTOR, ROLES.BUSINESS_ADMIN, ROLES.BUSINESS_USER],
  '/dashboard/quotes': [ROLES.SUPER_ADMIN, ROLES.DISTRIBUTOR, ROLES.BUSINESS_ADMIN, ROLES.BUSINESS_USER],
  '/dashboard/invoices': [ROLES.SUPER_ADMIN, ROLES.DISTRIBUTOR, ROLES.BUSINESS_ADMIN, ROLES.BUSINESS_USER],
  '/dashboard/customers': [ROLES.SUPER_ADMIN, ROLES.DISTRIBUTOR, ROLES.BUSINESS_ADMIN, ROLES.BUSINESS_USER],
}

export function canAccessRoute(userRole: UserRole | null, path: string): boolean {
  if (!userRole) return false
  
  // Find the most specific matching route
  const matchingRoute = Object.keys(ROUTE_ACCESS)
    .filter(route => path.startsWith(route))
    .sort((a, b) => b.length - a.length)[0]
  
  if (!matchingRoute) {
    // Default allow if no specific restriction
    return true
  }
  
  return checkRole(userRole, ROUTE_ACCESS[matchingRoute])
}

export function getDefaultRedirect(userRole: UserRole | null): string {
  switch (userRole) {
    case 'super_admin':
      return '/admin/distributors'
    case 'distributor':
      return '/distributor/businesses'
    case 'business_admin':
    case 'business_user':
    default:
      return '/dashboard'
  }
}

export function getRoleLabel(role: UserRole | null): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin'
    case 'distributor':
      return 'Distributor'
    case 'business_admin':
      return 'Business Admin'
    case 'business_user':
      return 'User'
    default:
      return 'Unknown'
  }
}

export function getRoleBadgeColor(role: UserRole | null): string {
  switch (role) {
    case 'super_admin':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'distributor':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'business_admin':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'business_user':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
