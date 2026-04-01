import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import { Sidebar } from '@/components/sidebar'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* TopNavBar (StickyHeader) */}
        <header className="h-16 w-full sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 glass-header flex items-center justify-between px-6 shadow-sm dark:shadow-none tonal-transition">
          <div className="flex items-center gap-8">
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input 
                className="w-full bg-surface-container-low border-none rounded-full py-1.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-secondary/20 transition-all outline-none" 
                placeholder="Search glass specs, quotes..." 
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
          {/* Page Header & Action */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
                <span>CRM</span>
                <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                <span className="text-on-surface">Dashboard</span>
              </nav>
              <h2 className="text-3xl font-black text-primary tracking-tight">Dashboard Overview</h2>
            </div>
            <button className="bg-gradient-to-br from-tertiary-fixed-dim to-on-tertiary-container text-on-tertiary-fixed font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg shadow-tertiary-fixed-dim/20 hover:scale-[1.02] transition-transform">
              <span className="material-symbols-outlined">add</span>
              New Quote
            </button>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Revenue Widget */}
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10 group hover:bg-surface-bright transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div className="flex items-center gap-1 text-secondary text-xs font-bold">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  +12.5%
                </div>
              </div>
              <p className="text-xs text-on-surface-variant font-medium mb-1">Total Revenue</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-mono font-medium text-primary tracking-tighter">$</span>
                <span className="text-3xl font-mono font-medium text-primary tracking-tighter">0</span>
              </div>
              <div className="mt-4 h-8 flex items-end gap-1">
                <div className="w-full bg-secondary/10 h-3 rounded-t-sm"></div>
                <div className="w-full bg-secondary/20 h-5 rounded-t-sm"></div>
                <div className="w-full bg-secondary/30 h-4 rounded-t-sm"></div>
                <div className="w-full bg-secondary/40 h-7 rounded-t-sm"></div>
                <div className="w-full bg-secondary/50 h-5 rounded-t-sm"></div>
                <div className="w-full bg-secondary/60 h-8 rounded-t-sm"></div>
              </div>
            </div>

            {/* Pending Quotes */}
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10 group hover:bg-surface-bright transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-secondary/5 rounded-lg text-secondary">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant text-xs font-bold">
                  <span className="material-symbols-outlined text-[14px]">horizontal_rule</span>
                  Static
                </div>
              </div>
              <p className="text-xs text-on-surface-variant font-medium mb-1">Pending Quotes</p>
              <span className="text-3xl font-mono font-medium text-primary tracking-tighter">0</span>
              <div className="mt-4 h-8 flex items-end gap-1">
                <div className="w-full bg-slate-200 h-6 rounded-t-sm"></div>
                <div className="w-full bg-slate-200 h-6 rounded-t-sm"></div>
                <div className="w-full bg-slate-200 h-6 rounded-t-sm"></div>
                <div className="w-full bg-slate-200 h-6 rounded-t-sm"></div>
                <div className="w-full bg-slate-200 h-6 rounded-t-sm"></div>
                <div className="w-full bg-slate-200 h-6 rounded-t-sm"></div>
              </div>
            </div>

            {/* Active Customers */}
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10 group hover:bg-surface-bright transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-secondary-container/20 rounded-lg text-secondary">
                  <span className="material-symbols-outlined">person_check</span>
                </div>
                <div className="flex items-center gap-1 text-secondary text-xs font-bold">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  +0
                </div>
              </div>
              <p className="text-xs text-on-surface-variant font-medium mb-1">Active Customers</p>
              <span className="text-3xl font-mono font-medium text-primary tracking-tighter">0</span>
              <div className="mt-4 flex -space-x-2">
                <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-container-high text-[8px] flex items-center justify-center font-bold">+0</div>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10 group hover:bg-surface-bright transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-tertiary-fixed/30 rounded-lg text-on-tertiary-container">
                  <span className="material-symbols-outlined">auto_graph</span>
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant text-xs font-bold">
                  <span className="material-symbols-outlined text-[14px]">horizontal_rule</span>
                  0%
                </div>
              </div>
              <p className="text-xs text-on-surface-variant font-medium mb-1">Conversion Rate</p>
              <span className="text-3xl font-mono font-medium text-primary tracking-tighter">0%</span>
              <div className="mt-4 bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>

          {/* Main Section Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-surface-container-lowest rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-surface-container-high flex justify-between items-center">
                  <h3 className="font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">history</span>
                    Recent Activity
                  </h3>
                  <button className="text-xs font-semibold text-secondary hover:underline underline-offset-4">View All</button>
                </div>
                <div className="divide-y divide-surface-container-low">
                  <div className="px-6 py-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">inbox</span>
                    <p className="text-sm">No recent activity found.</p>
                    <p className="text-xs mt-1">Activity will appear here as you use the system.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar Widgets */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="bg-surface-container-low p-6 rounded-lg">
                <h3 className="font-bold text-primary mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">bolt</span>
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button className="w-full bg-surface-container-lowest py-3 px-4 rounded-lg flex items-center justify-between group hover:shadow-md transition-all active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary group-hover:text-secondary transition-colors">receipt</span>
                      <span className="text-sm font-semibold">Create Invoice</span>
                    </div>
                    <span className="material-symbols-outlined text-xs text-on-surface-variant">arrow_forward</span>
                  </button>
                  <button className="w-full bg-surface-container-lowest py-3 px-4 rounded-lg flex items-center justify-between group hover:shadow-md transition-all active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary group-hover:text-secondary transition-colors">person_add</span>
                      <span className="text-sm font-semibold">Add Customer</span>
                    </div>
                    <span className="material-symbols-outlined text-xs text-on-surface-variant">arrow_forward</span>
                  </button>
                  <button className="w-full bg-surface-container-lowest py-3 px-4 rounded-lg flex items-center justify-between group hover:shadow-md transition-all active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary group-hover:text-secondary transition-colors">summarize</span>
                      <span className="text-sm font-semibold">Generate Report</span>
                    </div>
                    <span className="material-symbols-outlined text-xs text-on-surface-variant">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* System Status / Mini-Card */}
              <div className="bg-primary p-6 rounded-lg text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-xs font-bold text-secondary-fixed mb-2 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
                    System Active
                  </div>
                  <h4 className="text-xl font-black mb-1">Getting Started</h4>
                  <p className="text-xs text-primary-fixed-dim mb-4 leading-relaxed">
                    Start by creating your first quote or adding a customer to the system.
                  </p>
                  <button className="text-xs font-bold py-2 px-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                    View Guide
                  </button>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <span className="material-symbols-outlined text-9xl">lightbulb</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
