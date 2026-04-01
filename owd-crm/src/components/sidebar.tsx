'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTenant } from '@/providers/tenant-provider'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Settings, 
  Building2, 
  UserCircle,
  LogOut,
  ChevronDown,
  BarChart3,
  Store
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRoleBadgeColor, getRoleLabel } from '@/lib/rbac'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/utils/supabase-browser'
import { useRouter } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'distributor', 'business_admin', 'business_user'] },
  { label: 'Quotes', href: '/dashboard/quotes', icon: FileText, roles: ['super_admin', 'distributor', 'business_admin', 'business_user'] },
  { label: 'Invoices', href: '/dashboard/invoices', icon: FileText, roles: ['super_admin', 'distributor', 'business_admin', 'business_user'] },
  { label: 'Customers', href: '/dashboard/customers', icon: Users, roles: ['super_admin', 'distributor', 'business_admin', 'business_user'] },
  { label: 'Products', href: '/dashboard/products', icon: Package, roles: ['super_admin', 'distributor', 'business_admin'] },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['super_admin', 'distributor'] },
  { label: 'Distributors', href: '/admin/distributors', icon: Building2, roles: ['super_admin'] },
  { label: 'Businesses', href: '/admin/businesses', icon: Store, roles: ['super_admin', 'distributor'] },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['super_admin', 'distributor', 'business_admin'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, role, currentBusiness, availableBusinesses, setCurrentBusiness, isLoading } = useTenant()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Filter nav items based on user role
  const visibleNav = navigation.filter(item => role && item.roles.includes(role))

  if (isLoading) {
    return (
      <div className="w-64 bg-slate-900 text-white h-screen flex flex-col">
        <div className="p-6">
          <div className="h-8 bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 px-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">OWD CRM</span>
        </Link>
        {currentBusiness && (
          <p className="text-xs text-slate-400 mt-1 truncate">{currentBusiness.name}</p>
        )}
      </div>

      {/* Business Switcher (for multi-business users) */}
      {availableBusinesses.length > 1 && (
        <div className="px-4 py-3 border-b border-slate-800">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center justify-between w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md cursor-pointer">
                <span className="truncate">{currentBusiness?.name || 'Select Business'}</span>
                <ChevronDown className="w-4 h-4 ml-2" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {availableBusinesses.map((business) => (
                <DropdownMenuItem 
                  key={business.id}
                  onClick={() => setCurrentBusiness(business)}
                  className={cn(
                    currentBusiness?.id === business.id && 'bg-slate-100'
                  )}
                >
                  {business.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-slate-400')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.email}</p>
            {role && (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full border',
                getRoleBadgeColor(role)
              )}>
                {getRoleLabel(role)}
              </span>
            )}
          </div>
        </div>
        <button
          className="w-full flex items-center justify-start gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  )
}
