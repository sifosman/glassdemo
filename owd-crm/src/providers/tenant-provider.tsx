'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/utils/supabase-browser'

type UserRole = 'super_admin' | 'distributor' | 'business_admin' | 'business_user'

interface Business {
  id: string
  name: string
  slug: string
  logo_url?: string
  primary_color?: string
}

interface Distributor {
  id: string
  name: string
}

interface BusinessUser {
  id: string
  email: string
  role: UserRole
  business_id: string
  distributor_id?: string
  businesses?: Business[]
  distributors?: Distributor[]
}

interface TenantContextType {
  user: BusinessUser | null
  role: UserRole | null
  currentBusiness: Business | null
  availableBusinesses: Business[]
  distributor: Distributor | null
  isLoading: boolean
  setCurrentBusiness: (business: Business) => void
  refreshUser: () => Promise<void>
  hasRole: (roles: UserRole[]) => boolean
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BusinessUser | null>(null)
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null)
  const [availableBusinesses, setAvailableBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser?.email) {
        setUser(null)
        setCurrentBusiness(null)
        setAvailableBusinesses([])
        return
      }

      // Fetch user profile with business/distributor info
      const { data: businessUser, error } = await supabase
        .from('business_users')
        .select(`
          id,
          email,
          role,
          business_id,
          distributor_id,
          businesses:business_id (id, name, slug, logo_url, primary_color),
          distributors:distributor_id (id, name)
        `)
        .eq('email', authUser.email)
        .single()

      if (error || !businessUser) {
        console.error('Error fetching user:', error)
        setUser(null)
        return
      }

      setUser(businessUser as unknown as BusinessUser)

      // Set current business (get first from array)
      if (businessUser.businesses && businessUser.businesses.length > 0) {
        setCurrentBusiness(businessUser.businesses[0])
      }

      // For super_admin and distributor, fetch all accessible businesses
      if (businessUser.role === 'super_admin') {
        const { data: allBusinesses } = await supabase
          .from('businesses')
          .select('id, name, slug, logo_url, primary_color')
        setAvailableBusinesses(allBusinesses || [])
      } else if (businessUser.role === 'distributor' && businessUser.distributor_id) {
        const { data: distBusinesses } = await supabase
          .from('businesses')
          .select('id, name, slug, logo_url, primary_color')
          .eq('distributor_id', businessUser.distributor_id)
        setAvailableBusinesses(distBusinesses || [])
      } else {
        // Business users only see their own business
        setAvailableBusinesses(businessUser.businesses || [])
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserData()
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasRole = (roles: UserRole[]) => {
    if (!user?.role) return false
    return roles.includes(user.role)
  }

  const value: TenantContextType = {
    user,
    role: user?.role || null,
    currentBusiness,
    availableBusinesses,
    distributor: user?.distributors?.[0] || null,
    isLoading,
    setCurrentBusiness,
    refreshUser: fetchUserData,
    hasRole,
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

export type { UserRole, Business, BusinessUser, Distributor }
