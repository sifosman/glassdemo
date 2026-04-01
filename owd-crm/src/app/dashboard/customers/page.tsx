import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import { Sidebar } from '@/components/sidebar'

export default async function CustomersPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch customers with their quote counts and total spent
  const { data: customers } = await supabase
    .from('customers')
    .select(`
      *,
      quotes(id, total_amount, status)
    `)
    .order('created_at', { ascending: false })

  const customersData = customers || []

  // Calculate stats
  const totalCustomers = customersData.length
  const activeCustomers = customersData.filter(c => 
    c.quotes && c.quotes.some((q: { status: string }) => q.status === 'accepted')
  ).length
  const totalRevenue = customersData.reduce((sum, c) => {
    const customerRevenue = c.quotes?.reduce((qSum: number, q: { total_amount: string, status: string }) => 
      q.status === 'accepted' ? qSum + parseFloat(q.total_amount || '0') : qSum, 0) || 0
    return sum + customerRevenue
  }, 0)

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
                placeholder="Search customers..." 
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
            <button className="text-slate-500 hover:text-secondary transition-colors">
              <span className="material-symbols-outlined">dark_mode</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center text-white overflow-hidden">
              <span className="material-symbols-outlined text-sm">person</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
                <span>CRM</span>
                <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                <span className="text-on-surface">Customers</span>
              </nav>
              <h2 className="text-3xl font-black text-primary tracking-tight">Customer Management</h2>
              <p className="text-sm text-on-surface-variant mt-1">Manage customer relationships and track interactions</p>
            </div>
            <button className="bg-gradient-to-br from-tertiary-fixed-dim to-on-tertiary-container text-on-tertiary-fixed font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg shadow-tertiary-fixed-dim/20 hover:scale-[1.02] transition-transform">
              <span className="material-symbols-outlined">person_add</span>
              Add Customer
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <span className="material-symbols-outlined text-xl">group</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">Total Customers</p>
              </div>
              <span className="text-3xl font-mono font-medium text-primary tracking-tighter">{totalCustomers}</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-tertiary-fixed/30 rounded-lg text-on-tertiary-container">
                  <span className="material-symbols-outlined text-xl">person_check</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">Active Customers</p>
              </div>
              <span className="text-3xl font-mono font-medium text-on-tertiary-container tracking-tighter">{activeCustomers}</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-secondary/5 rounded-lg text-secondary">
                  <span className="material-symbols-outlined text-xl">payments</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">Total Revenue</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-mono font-medium text-primary tracking-tighter">R</span>
                <span className="text-3xl font-mono font-medium text-primary tracking-tighter">
                  {totalRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-surface-container-lowest p-4 rounded-lg flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-sm">filter_list</span>
              <span className="text-xs font-semibold text-on-surface-variant">Filters:</span>
            </div>
            
            <select className="bg-surface-container-low border-none rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-secondary/20 transition-all outline-none">
              <option>All Customers</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <select className="bg-surface-container-low border-none rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-secondary/20 transition-all outline-none">
              <option>Sort by: Recent</option>
              <option>Sort by: Name (A-Z)</option>
              <option>Sort by: Total Spent</option>
              <option>Sort by: Quote Count</option>
            </select>

            <button className="ml-auto text-xs font-semibold text-secondary hover:underline underline-offset-4 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
          </div>

          {/* Customers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customersData.length === 0 ? (
              <div className="col-span-full bg-surface-container-lowest rounded-lg p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4 block">group</span>
                <p className="text-sm text-on-surface-variant">No customers found</p>
                <p className="text-xs text-on-surface-variant/60 mt-1">Add your first customer to get started</p>
              </div>
            ) : (
              customersData.map((customer) => {
                const quoteCount = customer.quotes?.length || 0
                const totalSpent = customer.quotes?.reduce((sum: number, q: { total_amount: string, status: string }) => 
                  q.status === 'accepted' ? sum + parseFloat(q.total_amount || '0') : sum, 0) || 0
                const hasActiveQuotes = customer.quotes?.some((q: { status: string }) => q.status === 'accepted')

                return (
                  <div key={customer.id} className="bg-surface-container-lowest rounded-lg p-6 shadow-sm border border-outline-variant/10 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-2xl">person</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors">{customer.name}</h3>
                          {hasActiveQuotes && (
                            <span className="inline-flex items-center gap-1 text-xs text-tertiary-fixed-dim">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim"></span>
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">phone</span>
                        <span>{customer.phone || 'No phone'}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">email</span>
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-surface-container-high">
                      <div>
                        <p className="text-xs text-on-surface-variant mb-1">Quotes</p>
                        <span className="text-xl font-mono font-semibold text-primary">{quoteCount}</span>
                      </div>
                      <div>
                        <p className="text-xs text-on-surface-variant mb-1">Total Spent</p>
                        <span className="text-xl font-mono font-semibold text-primary">
                          R {totalSpent.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="flex-1 bg-surface-container-low hover:bg-surface-container-high py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        View Details
                      </button>
                      <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-sm text-secondary">edit</span>
                      </button>
                      <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors" title="More">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">more_vert</span>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
