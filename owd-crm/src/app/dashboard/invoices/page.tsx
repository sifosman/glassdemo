import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import { Sidebar } from '@/components/sidebar'

export default async function InvoicesPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch invoices with customer and payment details
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(name, phone, email),
      quote:quotes(quote_number)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const invoicesData = invoices || []

  // Calculate stats
  const totalInvoices = invoicesData.length
  const paidInvoices = invoicesData.filter(i => i.payment_status === 'paid').length
  const pendingInvoices = invoicesData.filter(i => i.payment_status === 'pending').length
  const totalRevenue = invoicesData
    .filter(i => i.payment_status === 'paid')
    .reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0)
  const pendingAmount = invoicesData
    .filter(i => i.payment_status === 'pending')
    .reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0)

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
                placeholder="Search invoices..." 
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
                <span className="text-on-surface">Invoices</span>
              </nav>
              <h2 className="text-3xl font-black text-primary tracking-tight">Invoice Management</h2>
              <p className="text-sm text-on-surface-variant mt-1">Track payments and manage invoices</p>
            </div>
            <button className="bg-gradient-to-br from-tertiary-fixed-dim to-on-tertiary-container text-on-tertiary-fixed font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg shadow-tertiary-fixed-dim/20 hover:scale-[1.02] transition-transform">
              <span className="material-symbols-outlined">add</span>
              New Invoice
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <span className="material-symbols-outlined text-xl">receipt_long</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">Total Invoices</p>
              </div>
              <span className="text-3xl font-mono font-medium text-primary tracking-tighter">{totalInvoices}</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-tertiary-fixed/30 rounded-lg text-on-tertiary-container">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">Paid</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-medium text-on-tertiary-container tracking-tighter">{paidInvoices}</span>
                <span className="text-sm font-mono text-on-surface-variant">
                  R {totalRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-secondary/5 rounded-lg text-secondary">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">Pending</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-medium text-secondary tracking-tighter">{pendingInvoices}</span>
                <span className="text-sm font-mono text-on-surface-variant">
                  R {pendingAmount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
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
              <option>All Statuses</option>
              <option>Paid</option>
              <option>Pending</option>
              <option>Overdue</option>
              <option>Cancelled</option>
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

          {/* Invoices Table */}
          <div className="bg-surface-container-lowest rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Quote #</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Payment Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {invoicesData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-3 block">receipt_long</span>
                        <p className="text-sm text-on-surface-variant">No invoices found</p>
                        <p className="text-xs text-on-surface-variant/60 mt-1">Create your first invoice to get started</p>
                      </td>
                    </tr>
                  ) : (
                    invoicesData.map((invoice) => {
                      const isOverdue = invoice.payment_status === 'pending' && 
                        invoice.due_date && 
                        new Date(invoice.due_date) < new Date()

                      return (
                        <tr key={invoice.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm font-semibold text-primary">#{invoice.invoice_number}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold text-on-surface">{invoice.customer?.name || 'Unknown'}</p>
                              <p className="text-xs text-on-surface-variant">{invoice.customer?.phone || 'No phone'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm text-on-surface-variant">
                              {invoice.quote?.quote_number ? `#${invoice.quote.quote_number}` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-on-surface">
                              {new Date(invoice.created_at).toLocaleDateString('en-ZA', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-mono font-semibold text-primary">
                              R {parseFloat(invoice.total_amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              invoice.payment_status === 'paid' 
                                ? 'bg-tertiary-fixed/20 text-on-tertiary-container' 
                                : isOverdue
                                ? 'bg-error/10 text-error'
                                : invoice.payment_status === 'pending'
                                ? 'bg-secondary/10 text-secondary'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}>
                              <span className="material-symbols-outlined text-xs">
                                {invoice.payment_status === 'paid' ? 'check_circle' : 
                                 isOverdue ? 'error' :
                                 invoice.payment_status === 'pending' ? 'schedule' : 'help'}
                              </span>
                              {isOverdue ? 'Overdue' : invoice.payment_status?.charAt(0).toUpperCase() + invoice.payment_status?.slice(1) || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-on-surface-variant">
                              {invoice.payment_method || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors" title="View">
                                <span className="material-symbols-outlined text-sm text-primary">visibility</span>
                              </button>
                              <button className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors" title="Download PDF">
                                <span className="material-symbols-outlined text-sm text-secondary">download</span>
                              </button>
                              {invoice.payment_status === 'pending' && (
                                <button className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors" title="Send Reminder">
                                  <span className="material-symbols-outlined text-sm text-on-surface-variant">send</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
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
