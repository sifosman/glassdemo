import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import { Sidebar } from '@/components/sidebar'

export default async function DistributorsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user role
  const { data: businessUser } = await supabase
    .from('business_users')
    .select('role')
    .eq('email', user.email)
    .single()

  // Only super_admin can access this page
  if (businessUser?.role !== 'super_admin') {
    redirect('/dashboard')
  }

  // Fetch all distributors
  const { data: distributors } = await supabase
    .from('distributors')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch distributor stats
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, distributor_id, is_active')

  // Calculate stats per distributor
  const distributorStats = distributors?.map(dist => {
    const distBusinesses = businesses?.filter(b => b.distributor_id === dist.id) || []
    const activeBusinesses = distBusinesses.filter(b => b.is_active).length
    
    return {
      ...dist,
      total_businesses: distBusinesses.length,
      active_businesses: activeBusinesses,
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
                placeholder="Search distributors..." 
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
                <span className="text-on-surface">Distributors</span>
              </nav>
              <h2 className="text-3xl font-black text-primary tracking-tight">Distributor Management</h2>
              <p className="text-on-surface-variant mt-1">Manage distributor accounts and monitor their businesses</p>
            </div>
            <button className="bg-gradient-to-br from-tertiary-fixed-dim to-on-tertiary-container text-on-tertiary-fixed font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg shadow-tertiary-fixed-dim/20 hover:scale-[1.02] transition-transform">
              <span className="material-symbols-outlined">add</span>
              New Distributor
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <span className="material-symbols-outlined">corporate_fare</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Total Distributors</p>
                  <p className="text-2xl font-mono font-bold text-primary">{distributors?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-secondary/5 rounded-lg text-secondary">
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
                <div className="p-2 bg-secondary-container/20 rounded-lg text-secondary">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Active Businesses</p>
                  <p className="text-2xl font-mono font-bold text-primary">
                    {businesses?.filter(b => b.is_active).length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-tertiary-fixed/30 rounded-lg text-on-tertiary-container">
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Avg. per Distributor</p>
                  <p className="text-2xl font-mono font-bold text-primary">
                    {distributors?.length ? Math.round((businesses?.length || 0) / distributors.length) : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Distributors Table */}
          <div className="bg-surface-container-lowest rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-surface-container-high flex justify-between items-center">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">corporate_fare</span>
                All Distributors
              </h3>
              <div className="flex items-center gap-3">
                <button className="text-xs font-semibold text-secondary hover:underline underline-offset-4 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">filter_list</span>
                  Filter
                </button>
                <button className="text-xs font-semibold text-secondary hover:underline underline-offset-4 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">download</span>
                  Export
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-low/30">
                  <tr className="text-left">
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Distributor</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Businesses</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Active</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {distributorStats.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant/20">corporate_fare</span>
                          <p className="text-sm text-on-surface-variant">No distributors found</p>
                          <button className="text-xs font-semibold text-secondary hover:underline">
                            Create your first distributor
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    distributorStats.map((dist) => (
                      <tr key={dist.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-primary">corporate_fare</span>
                            </div>
                            <div>
                              <p className="font-semibold text-on-surface">{dist.name}</p>
                              <p className="text-xs text-on-surface-variant font-mono">ID: {dist.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface">{dist.email}</td>
                        <td className="px-6 py-4">
                          <span className="font-mono font-semibold text-primary">{dist.total_businesses}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono font-semibold text-secondary">{dist.active_businesses}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                          {new Date(dist.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
                              <span className="material-symbols-outlined text-sm text-primary">edit</span>
                            </button>
                            <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
                              <span className="material-symbols-outlined text-sm text-secondary">visibility</span>
                            </button>
                            <button className="p-2 hover:bg-error-container rounded-lg transition-colors">
                              <span className="material-symbols-outlined text-sm text-error">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
