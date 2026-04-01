'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTenant } from '@/providers/tenant-provider'
import { cn } from '@/lib/utils'
import { getRoleLabel } from '@/lib/rbac'
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
  icon: string
  roles: string[]
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['super_admin', 'distributor', 'business_admin', 'business_user'] },
  { label: 'Quotes', href: '/dashboard/quotes', icon: 'description', roles: ['super_admin', 'distributor', 'business_admin', 'business_user'] },
  { label: 'Invoices', href: '/dashboard/invoices', icon: 'receipt_long', roles: ['super_admin', 'distributor', 'business_admin', 'business_user'] },
  { label: 'Customers', href: '/dashboard/customers', icon: 'group', roles: ['super_admin', 'distributor', 'business_admin', 'business_user'] },
  { label: 'Products', href: '/dashboard/products', icon: 'inventory_2', roles: ['super_admin', 'distributor', 'business_admin'] },
  { label: 'Reports', href: '/dashboard/analytics', icon: 'analytics', roles: ['super_admin', 'distributor'] },
  { label: 'Distributors', href: '/admin/distributors', icon: 'corporate_fare', roles: ['super_admin'] },
  { label: 'Businesses', href: '/admin/businesses', icon: 'store', roles: ['super_admin', 'distributor'] },
  { label: 'Settings', href: '/dashboard/settings', icon: 'settings', roles: ['super_admin', 'distributor', 'business_admin'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { role, currentBusiness, availableBusinesses, setCurrentBusiness, isLoading } = useTenant()
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
      <div className="w-[240px] bg-slate-100 dark:bg-slate-900 h-screen flex flex-col py-6">
        <div className="px-6 mb-8">
          <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 px-3 space-y-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-300 dark:bg-slate-700 rounded-full animate-pulse mx-3"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <aside className="hidden md:flex w-[240px] h-screen bg-slate-100 dark:bg-slate-900 flex-col py-6">
      {/* Logo */}
      <div className="px-6 mb-8">
        <h1 className="text-xl font-bold tracking-tight text-blue-950 dark:text-blue-100">OWD CRM</h1>
        <p className="text-xs text-slate-500 font-sans mt-1">
          {role ? getRoleLabel(role) : 'Loading...'}
        </p>
      </div>

      {/* Business Switcher (for multi-business users) */}
      {availableBusinesses.length > 1 && (
        <div className="px-6 mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center justify-between w-full px-3 py-2 bg-surface-container-low hover:bg-surface-container-high text-on-surface rounded-lg cursor-pointer transition-colors">
                <span className="truncate text-sm font-medium">{currentBusiness?.name || 'Select Business'}</span>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {availableBusinesses.map((business) => (
                <DropdownMenuItem 
                  key={business.id}
                  onClick={() => setCurrentBusiness(business)}
                  className={cn(
                    currentBusiness?.id === business.id && 'bg-secondary-container/20'
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
      <nav className="flex-1 space-y-1">
        {visibleNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-2.5 gap-3 font-sans text-sm font-medium tracking-tight transition-all mx-3 rounded-full',
                isActive 
                  ? 'bg-teal-100/50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 active:scale-[0.98]' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-200 hover:bg-slate-200 dark:hover:bg-slate-800'
              )}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="mt-auto px-3">
        <button
          className="w-full flex items-center px-4 py-2.5 gap-3 font-sans text-sm font-medium tracking-tight text-slate-600 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-full"
          onClick={handleLogout}
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
