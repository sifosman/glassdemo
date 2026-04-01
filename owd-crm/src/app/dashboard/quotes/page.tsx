import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase'
import { Sidebar } from '@/components/sidebar'

export default async function QuotesPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch quotes for the current business
  const { data: quotes } = await supabase
    .from('quotes')
    .select(`
      *,
      customer:customers(name, phone, email),
      quote_items(*)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const quotesData = quotes || []

  // Calculate stats
  const totalQuotes = quotesData.length
  const pendingQuotes = quotesData.filter(q => q.status === 'pending').length
  const acceptedQuotes = quotesData.filter(q => q.status === 'accepted').length
  const totalValue = quotesData.reduce((sum, q) => sum + (parseFloat(q.total) || parseFloat(q.total_amount) || 0), 0)

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
                placeholder="Search quotes, customers..." 
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
                <span className="text-on-surface">Quotes</span>
              </nav>
              <h2 className="text-3xl font-black text-primary tracking-tight">Quote Management</h2>
              <p className="text-sm text-on-surface-variant mt-1">View and manage all customer quotes</p>
            </div>
            <button className="bg-gradient-to-br from-tertiary-fixed-dim to-on-tertiary-container text-on-tertiary-fixed font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg shadow-tertiary-fixed-dim/20 hover:scale-[1.02] transition-transform">
              <span className="material-symbols-outlined">add</span>
              New Quote
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <span className="material-symbols-outlined text-xl">description</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">Total Quotes</p>
              </div>
              <span className="text-3xl font-mono font-medium text-primary tracking-tighter">{totalQuotes}</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-secondary/5 rounded-lg text-secondary">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">Pending</p>
              </div>
              <span className="text-3xl font-mono font-medium text-secondary tracking-tighter">{pendingQuotes}</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-tertiary-fixed/30 rounded-lg text-on-tertiary-container">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">Accepted</p>
              </div>
              <span className="text-3xl font-mono font-medium text-on-tertiary-container tracking-tighter">{acceptedQuotes}</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <span className="material-symbols-outlined text-xl">payments</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">Total Value</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-mono font-medium text-primary tracking-tighter">R</span>
                <span className="text-3xl font-mono font-medium text-primary tracking-tighter">
                  {totalValue.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Accepted</option>
              <option>Rejected</option>
              <option>Expired</option>
            </select>

            <select className="bg-surface-container-low border-none rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-secondary/20 transition-all outline-none">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>Last 90 Days</option>
              <option>All Time</option>
            </select>

            <button className="ml-auto text-xs font-semibold text-secondary hover:underline underline-offset-4 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
          </div>

          {/* Quotes Table */}
          <div className="bg-surface-container-lowest rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Quote #</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Items</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {quotesData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-3 block">description</span>
                        <p className="text-sm text-on-surface-variant">No quotes found</p>
                        <p className="text-xs text-on-surface-variant/60 mt-1">Create your first quote to get started</p>
                      </td>
                    </tr>
                  ) : (
                    quotesData.map((quote) => (
                      <tr key={quote.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-primary">#{quote.quote_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{quote.customer?.name || 'Unknown'}</p>
                            <p className="text-xs text-on-surface-variant">{quote.customer?.phone || 'No phone'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-on-surface">
                            {new Date(quote.created_at).toLocaleDateString('en-ZA', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-on-surface">{quote.quote_items?.length || 0}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono font-semibold text-primary">
                            R {parseFloat(quote.total || quote.total_amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            quote.status === 'accepted' 
                              ? 'bg-tertiary-fixed/20 text-on-tertiary-container' 
                              : quote.status === 'pending'
                              ? 'bg-secondary/10 text-secondary'
                              : quote.status === 'rejected'
                              ? 'bg-error/10 text-error'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}>
                            <span className="material-symbols-outlined text-xs">
                              {quote.status === 'accepted' ? 'check_circle' : 
                               quote.status === 'pending' ? 'schedule' :
                               quote.status === 'rejected' ? 'cancel' : 'help'}
                            </span>
                            {quote.status?.charAt(0).toUpperCase() + quote.status?.slice(1) || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {quote.pdf_url ? (
                              <>
                                <a href={quote.pdf_url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors" title="View PDF">
                                  <span className="material-symbols-outlined text-sm text-primary">visibility</span>
                                </a>
                                <Link href={`/dashboard/quotes/${quote.id}/edit`} className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors" title="Edit">
                                  <span className="material-symbols-outlined text-sm text-secondary">edit</span>
                                </Link>
                                <a href={quote.pdf_url} download={`Quote-${quote.quote_number}.pdf`} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors" title="Download PDF">
                                  <span className="material-symbols-outlined text-sm text-on-surface-variant">download</span>
                                </a>
                              </>
                            ) : (
                              <>
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors opacity-50 cursor-not-allowed" title="No PDF available" disabled>
                                  <span className="material-symbols-outlined text-sm text-primary">visibility_off</span>
                                </button>
                                <Link href={`/dashboard/quotes/${quote.id}/edit`} className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors" title="Edit">
                                  <span className="material-symbols-outlined text-sm text-secondary">edit</span>
                                </Link>
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors opacity-50 cursor-not-allowed" title="No PDF available" disabled>
                                  <span className="material-symbols-outlined text-sm text-on-surface-variant">download</span>
                                </button>
                              </>
                            )}
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
