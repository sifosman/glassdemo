import { login } from './actions'

export default function LoginPage({ searchParams }: { searchParams: { message: string } }) {
  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        {/* Background decorative elements: Glass refraction effect */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        
        {/* Main Login Card */}
        <main className="relative bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(0,28,59,0.06)] overflow-hidden">
          <div className="p-8 md:p-10">
            {/* Brand Header */}
            <div className="flex flex-col items-center mb-10">
              <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-lg bg-primary-container text-white">
                <span className="material-symbols-outlined text-2xl">window</span>
              </div>
              <h1 className="font-headline font-black text-2xl tracking-tight text-primary">OWD CRM</h1>
              <p className="text-on-surface-variant text-sm mt-1">Glass Industry Management</p>
            </div>
            
            {/* Form Section */}
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-on-surface">Welcome back</h2>
                <p className="text-on-surface-variant text-sm">Please enter your credentials to access your dashboard.</p>
              </div>
              
              <form className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative group">
                    <input
                      className="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant focus:border-transparent focus:ring-0 focus:outline-none transition-all rounded-lg text-on-surface placeholder:text-on-surface-variant/50 focus:shadow-[0_2px_0_0_#006a61]"
                      id="email"
                      name="email"
                      placeholder="name@company.com"
                      type="email"
                      required
                    />
                  </div>
                </div>
                
                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-on-surface" htmlFor="password">
                      Password
                    </label>
                    <a className="text-xs font-semibold text-secondary hover:text-secondary-fixed-dim transition-colors" href="#">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative group">
                    <input
                      className="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant focus:border-transparent focus:ring-0 focus:outline-none transition-all rounded-lg text-on-surface placeholder:text-on-surface-variant/50 focus:shadow-[0_2px_0_0_#006a61]"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      type="password"
                      required
                    />
                  </div>
                </div>
                
                {/* Error Message */}
                {searchParams?.message && (
                  <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm">
                    {searchParams.message}
                  </div>
                )}
                
                {/* Sign In Button */}
                <button
                  formAction={login}
                  className="w-full h-12 primary-gradient text-on-primary font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 shadow-sm"
                  type="submit"
                >
                  Sign In
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </form>
            </div>
            
            {/* Footnote */}
            <div className="mt-10 pt-8 border-t border-surface-container-high text-center">
              <p className="text-on-surface-variant text-xs">
                Don&apos;t have an account?
                <a className="text-secondary font-bold hover:underline ml-1" href="#">Contact Support</a>
              </p>
            </div>
          </div>
          
          {/* Side Visual Accent (Hidden on mobile) */}
          <div className="hidden md:block absolute top-0 right-0 w-1 h-full primary-gradient opacity-20"></div>
        </main>
        
        {/* Trust Indicator */}
        <div className="mt-8 flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            <span className="text-[10px] font-mono uppercase tracking-widest">Secure 256-bit SSL</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="text-[10px] font-mono uppercase tracking-widest">ISO 27001 Certified</span>
          </div>
        </div>
      </div>
    </div>
  )
}
