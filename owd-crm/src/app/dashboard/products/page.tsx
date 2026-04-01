import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import { Sidebar } from '@/components/sidebar'

export default async function ProductsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch product catalog
  const { data: glassTypes } = await supabase
    .from('glass_types')
    .select('*')
    .order('name', { ascending: true })

  const { data: extrusions } = await supabase
    .from('extrusions')
    .select('*')
    .order('name', { ascending: true })

  const { data: hardware } = await supabase
    .from('hardware')
    .select('*')
    .order('name', { ascending: true })

  const glassTypesData = glassTypes || []
  const extrusionsData = extrusions || []
  const hardwareData = hardware || []

  const totalProducts = glassTypesData.length + extrusionsData.length + hardwareData.length

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
                placeholder="Search products..." 
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
                <span className="text-on-surface">Products</span>
              </nav>
              <h2 className="text-3xl font-black text-primary tracking-tight">Product Catalog</h2>
              <p className="text-sm text-on-surface-variant mt-1">Manage glass types, extrusions, and hardware</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="bg-surface-container-low hover:bg-surface-container-high text-on-surface font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
                <span className="material-symbols-outlined">upload</span>
                Import CSV
              </button>
              <button className="bg-gradient-to-br from-tertiary-fixed-dim to-on-tertiary-container text-on-tertiary-fixed font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg shadow-tertiary-fixed-dim/20 hover:scale-[1.02] transition-transform">
                <span className="material-symbols-outlined">add</span>
                Add Product
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <span className="material-symbols-outlined text-xl">inventory_2</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">Total Products</p>
              </div>
              <span className="text-3xl font-mono font-medium text-primary tracking-tighter">{totalProducts}</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-secondary/5 rounded-lg text-secondary">
                  <span className="material-symbols-outlined text-xl">window</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">Glass Types</p>
              </div>
              <span className="text-3xl font-mono font-medium text-secondary tracking-tighter">{glassTypesData.length}</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-tertiary-fixed/30 rounded-lg text-on-tertiary-container">
                  <span className="material-symbols-outlined text-xl">straighten</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">Extrusions</p>
              </div>
              <span className="text-3xl font-mono font-medium text-on-tertiary-container tracking-tighter">{extrusionsData.length}</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <span className="material-symbols-outlined text-xl">construction</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">Hardware</p>
              </div>
              <span className="text-3xl font-mono font-medium text-primary tracking-tighter">{hardwareData.length}</span>
            </div>
          </div>

          {/* Product Categories Tabs */}
          <div className="bg-surface-container-lowest rounded-lg overflow-hidden">
            <div className="border-b border-surface-container-high">
              <div className="flex gap-1 p-2">
                <button className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-semibold text-sm transition-all">
                  Glass Types
                </button>
                <button className="flex-1 px-4 py-3 rounded-lg hover:bg-surface-container-low font-semibold text-sm text-on-surface-variant transition-all">
                  Extrusions
                </button>
                <button className="flex-1 px-4 py-3 rounded-lg hover:bg-surface-container-low font-semibold text-sm text-on-surface-variant transition-all">
                  Hardware
                </button>
              </div>
            </div>

            {/* Glass Types Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Product Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Price per m²</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Stock Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {glassTypesData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-3 block">window</span>
                        <p className="text-sm text-on-surface-variant">No glass types found</p>
                        <p className="text-xs text-on-surface-variant/60 mt-1">Add your first glass type to get started</p>
                      </td>
                    </tr>
                  ) : (
                    glassTypesData.map((glass) => (
                      <tr key={glass.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-primary">window</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-on-surface">{glass.name}</p>
                              <p className="text-xs text-on-surface-variant">SKU: {glass.sku || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-on-surface-variant line-clamp-2">{glass.description || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono font-semibold text-primary">
                            R {parseFloat(glass.price_per_sqm || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-tertiary-fixed/20 text-on-tertiary-container">
                            <span className="material-symbols-outlined text-xs">check_circle</span>
                            In Stock
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors" title="Edit">
                              <span className="material-symbols-outlined text-sm text-secondary">edit</span>
                            </button>
                            <button className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors" title="Delete">
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

          {/* CSV Import Instructions */}
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary text-2xl">info</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-primary mb-2">CSV Import Format</h3>
                <p className="text-sm text-on-surface-variant mb-3">
                  Upload a CSV file to bulk update your product catalog. The CSV should include the following columns:
                </p>
                <div className="bg-surface-container-lowest rounded-lg p-4 font-mono text-xs text-on-surface">
                  <p>name, description, sku, price_per_sqm, category</p>
                </div>
                <button className="mt-4 text-xs font-semibold text-primary hover:underline underline-offset-4 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download Template CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
