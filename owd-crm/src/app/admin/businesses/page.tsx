import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import { Sidebar } from '@/components/sidebar'

export default async function BusinessesPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user role and business context
  const { data: businessUser } = await supabase
    .from('business_users')
    .select('role, business_id')
    .eq('email', user.email)
    .single()

  // Only super_admin and distributor can access this page
  if (!businessUser || !['super_admin', 'distributor'].includes(businessUser.role)) {
    redirect('/dashboard')
  }

  // Fetch businesses based on role
  let businessesQuery = supabase
    .from('businesses')
    .select(`
      *,
      distributors (
        id,
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  // If distributor, only show their businesses
  if (businessUser.role === 'distributor') {
    // Get distributor_id from their business
    const { data: userBusiness } = await supabase
      .from('businesses')
      .select('distributor_id')
      .eq('id', businessUser.business_id)
      .single()

    if (userBusiness?.distributor_id) {
      businessesQuery = businessesQuery.eq('distributor_id', userBusiness.distributor_id)
    }
  }

  const { data: businesses } = await businessesQuery

  // Fetch business stats (quotes count per business)
  const { data: quotes } = await supabase
    .from('quotes')
    .select('business_id, total')

  // Calculate stats per business
  const businessStats = businesses?.map(biz => {
    const bizQuotes = quotes?.filter(q => q.business_id === biz.id) || []
    const totalRevenue = bizQuotes.reduce((sum, q) => sum + (Number(q.total) || 0), 0)
    
    return {
      ...biz,
      total_quotes: bizQuotes.length,
      total_revenue: totalRevenue,
    }
  }) || []

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* TopNavBar */}
        <header className="h-16 w-full sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 glass-header flex items-center justify-between px-6 shadow-sm dark:shadow-none tonal-transition">
          <div className="flex items-center gap-8">
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input 
                className="w-full bg-surface-container-low border-none rounded-full py-1.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-secondary/20 transition-all outline-none" 
                placeholder="Search businesses..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button className="text-slate-500 hover:text-secondary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-slate-500 hover:text-secondary transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center text-white overflow-hidden">
              <span className="material-symbols-outlined text-sm">person</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          {/* Page Header & Action */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
                <span>Admin</span>
                <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                <span className="text-on-surface">Businesses</span>
              </nav>
              <h2 className="text-3xl font-black text-primary tracking-tight">Business Management</h2>
              <p className="text-on-surface-variant mt-1">
                {businessUser.role === 'super_admin' 
                  ? 'Manage all businesses across all distributors' 
                  : 'Manage your businesses and subscriptions'}
              </p>
            </div>
            <button className="bg-gradient-to-br from-tertiary-fixed-dim to-on-tertiary-container text-on-tertiary-fixed font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg shadow-tertiary-fixed-dim/20 hover:scale-[1.02] transition-transform">
              <span className="material-symbols-outlined">add</span>
              New Business
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <span className="material-symbols-outlined">store</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Total Businesses</p>
                  <p className="text-2xl font-mono font-bold text-primary">{businesses?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-secondary/5 rounded-lg text-secondary">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Active</p>
                  <p className="text-2xl font-mono font-bold text-primary">
                    {businesses?.filter(b => b.is_active).length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-secondary-container/20 rounded-lg text-secondary">
                  <span className="material-symbols-outlined">receipt_long</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Total Quotes</p>
                  <p className="text-2xl font-mono font-bold text-primary">
                    {businessStats.reduce((sum, b) => sum + b.total_quotes, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-tertiary-fixed/30 rounded-lg text-on-tertiary-container">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Total Revenue</p>
                  <p className="text-xl font-mono font-bold text-primary">
                    R {businessStats.reduce((sum, b) => sum + b.total_revenue, 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Businesses Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {businessStats.length === 0 ? (
              <div className="col-span-full bg-surface-container-lowest rounded-lg p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4">store</span>
                <p className="text-sm text-on-surface-variant mb-4">No businesses found</p>
                <button className="text-xs font-semibold text-secondary hover:underline">
                  Create your first business
                </button>
              </div>
            ) : (
              businessStats.map((biz) => (
                <div key={biz.id} className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm border border-outline-variant/10 hover:shadow-md transition-all group">
                  {/* Card Header */}
                  <div className="p-6 border-b border-surface-container-high">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {biz.logo_url ? (
                          <img src={biz.logo_url} alt={biz.name} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">store</span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-on-surface">{biz.name}</h3>
                          <p className="text-xs text-on-surface-variant">/{biz.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {biz.is_active ? (
                          <span className="px-2 py-1 bg-secondary-container/20 text-secondary text-xs font-bold rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-error-container text-error text-xs font-bold rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Distributor Info */}
                    {biz.distributors && (
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">corporate_fare</span>
                        <span>{biz.distributors.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="p-6 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-on-surface-variant mb-1">Quotes</p>
                      <p className="text-xl font-mono font-bold text-primary">{biz.total_quotes}</p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant mb-1">Revenue</p>
                      <p className="text-lg font-mono font-bold text-secondary">
                        R {biz.total_revenue.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  {/* Integration Status */}
                  <div className="px-6 pb-6 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">BotSailor</span>
                      {biz.botsailor_api_token ? (
                        <span className="flex items-center gap-1 text-secondary">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          Not configured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">PayFast</span>
                      {biz.payfast_merchant_id ? (
                        <span className="flex items-center gap-1 text-secondary">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          Not configured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-6 pb-6 flex items-center gap-2">
                    <button className="flex-1 py-2 px-4 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Edit
                    </button>
                    <button className="flex-1 py-2 px-4 bg-primary hover:opacity-90 text-on-primary rounded-lg text-sm font-semibold transition-opacity flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      View
                    </button>
                  </div>

                  {/* Created Date */}
                  <div className="px-6 pb-4 text-xs text-on-surface-variant">
                    Created {new Date(biz.created_at).toLocaleDateString('en-ZA', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
