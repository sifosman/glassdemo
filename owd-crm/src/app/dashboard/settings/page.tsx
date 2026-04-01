import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import { Sidebar } from '@/components/sidebar'

export default async function SettingsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch business details
  const { data: businessUser } = await supabase
    .from('business_users')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  let businessData = null
  if (businessUser?.business_id) {
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessUser.business_id)
      .single()
    
    businessData = business
  }

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
                placeholder="Search settings..." 
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
                <span className="text-on-surface">Settings</span>
              </nav>
              <h2 className="text-3xl font-black text-primary tracking-tight">Business Settings</h2>
              <p className="text-sm text-on-surface-variant mt-1">Manage your business profile and integrations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-surface-container-lowest rounded-lg overflow-hidden sticky top-24">
                <div className="p-4 border-b border-surface-container-high">
                  <h3 className="font-bold text-on-surface text-sm">Settings Menu</h3>
                </div>
                <nav className="p-2">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-semibold text-sm transition-all">
                    <span className="material-symbols-outlined text-lg">business</span>
                    Business Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-container-low text-on-surface-variant font-semibold text-sm transition-all">
                    <span className="material-symbols-outlined text-lg">integration_instructions</span>
                    Integrations
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-container-low text-on-surface-variant font-semibold text-sm transition-all">
                    <span className="material-symbols-outlined text-lg">group</span>
                    Team Members
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-container-low text-on-surface-variant font-semibold text-sm transition-all">
                    <span className="material-symbols-outlined text-lg">notifications</span>
                    Notifications
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-container-low text-on-surface-variant font-semibold text-sm transition-all">
                    <span className="material-symbols-outlined text-lg">security</span>
                    Security
                  </button>
                </nav>
              </div>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Business Profile Section */}
              <div className="bg-surface-container-lowest rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-surface-container-high">
                  <h3 className="font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">business</span>
                    Business Profile
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-3">Business Logo</label>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden">
                        {businessData?.logo_url ? (
                          <img src={businessData.logo_url} alt="Business Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant">image</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <button className="bg-surface-container-low hover:bg-surface-container-high px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                          Upload Logo
                        </button>
                        <p className="text-xs text-on-surface-variant mt-2">Recommended: 500x500px, PNG or JPG</p>
                      </div>
                    </div>
                  </div>

                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Business Name</label>
                    <input 
                      type="text"
                      defaultValue={businessData?.name || ''}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
                      placeholder="Enter business name"
                    />
                  </div>

                  {/* Brand Color */}
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Primary Brand Color</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color"
                        defaultValue={businessData?.primary_color || '#1976D2'}
                        className="w-16 h-10 rounded-lg cursor-pointer"
                      />
                      <input 
                        type="text"
                        defaultValue={businessData?.primary_color || '#1976D2'}
                        className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
                        placeholder="#1976D2"
                      />
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-2">Phone Number</label>
                      <input 
                        type="tel"
                        defaultValue={businessData?.phone || ''}
                        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
                        placeholder="+27 XX XXX XXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-2">Email Address</label>
                      <input 
                        type="email"
                        defaultValue={businessData?.email || ''}
                        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
                        placeholder="contact@business.com"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Business Address</label>
                    <textarea 
                      defaultValue={businessData?.address || ''}
                      rows={3}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-secondary/20 transition-all outline-none resize-none"
                      placeholder="Enter full business address"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <button className="bg-gradient-to-br from-tertiary-fixed-dim to-on-tertiary-container text-on-tertiary-fixed font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg shadow-tertiary-fixed-dim/20 hover:scale-[1.02] transition-transform">
                      <span className="material-symbols-outlined">save</span>
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>

              {/* Integrations Section */}
              <div className="bg-surface-container-lowest rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-surface-container-high">
                  <h3 className="font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">integration_instructions</span>
                    Integrations
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* BotSailor Integration */}
                  <div className="border border-outline-variant/20 rounded-lg p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-2xl">chat</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface">BotSailor WhatsApp</h4>
                          <p className="text-xs text-on-surface-variant">WhatsApp messaging integration</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        businessData?.botsailor_api_token 
                          ? 'bg-tertiary-fixed/20 text-on-tertiary-container' 
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-xs">
                          {businessData?.botsailor_api_token ? 'check_circle' : 'cancel'}
                        </span>
                        {businessData?.botsailor_api_token ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">API Token</label>
                        <input 
                          type="password"
                          defaultValue={businessData?.botsailor_api_token || ''}
                          className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
                          placeholder="Enter BotSailor API Token"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Phone ID</label>
                        <input 
                          type="text"
                          defaultValue={businessData?.botsailor_phone_id || ''}
                          className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
                          placeholder="Enter Phone ID"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PayFast Integration */}
                  <div className="border border-outline-variant/20 rounded-lg p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-secondary text-2xl">payment</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface">PayFast</h4>
                          <p className="text-xs text-on-surface-variant">Payment gateway integration</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        businessData?.payfast_merchant_id 
                          ? 'bg-tertiary-fixed/20 text-on-tertiary-container' 
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-xs">
                          {businessData?.payfast_merchant_id ? 'check_circle' : 'cancel'}
                        </span>
                        {businessData?.payfast_merchant_id ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Merchant ID</label>
                        <input 
                          type="text"
                          defaultValue={businessData?.payfast_merchant_id || ''}
                          className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
                          placeholder="Enter Merchant ID"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Merchant Key</label>
                        <input 
                          type="password"
                          defaultValue={businessData?.payfast_merchant_key || ''}
                          className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
                          placeholder="Enter Merchant Key"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Passphrase</label>
                        <input 
                          type="password"
                          defaultValue={businessData?.payfast_passphrase || ''}
                          className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
                          placeholder="Enter Passphrase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <button className="bg-gradient-to-br from-tertiary-fixed-dim to-on-tertiary-container text-on-tertiary-fixed font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg shadow-tertiary-fixed-dim/20 hover:scale-[1.02] transition-transform">
                      <span className="material-symbols-outlined">save</span>
                      Save Integration Settings
                    </button>
                  </div>
                </div>
              </div>

              {/* Webhook Configuration */}
              <div className="bg-surface-container-lowest rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-surface-container-high">
                  <h3 className="font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">webhook</span>
                    Webhook Configuration
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Webhook URL</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={`https://your-domain.com/api/v1/business/${businessData?.slug || 'your-slug'}/generate-quote`}
                        readOnly
                        className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2.5 text-xs font-mono focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
                      />
                      <button className="p-2.5 hover:bg-surface-container-high rounded-lg transition-colors" title="Copy">
                        <span className="material-symbols-outlined text-sm text-secondary">content_copy</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Webhook Secret</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="password"
                        value={businessData?.webhook_secret || ''}
                        readOnly
                        className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2.5 text-xs font-mono focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
                      />
                      <button className="p-2.5 hover:bg-surface-container-high rounded-lg transition-colors" title="Copy">
                        <span className="material-symbols-outlined text-sm text-secondary">content_copy</span>
                      </button>
                      <button className="p-2.5 hover:bg-surface-container-high rounded-lg transition-colors" title="Regenerate">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">refresh</span>
                      </button>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-2">Use this secret in your n8n webhook headers as <code className="bg-surface-container-high px-1 py-0.5 rounded">x-webhook-secret</code></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
