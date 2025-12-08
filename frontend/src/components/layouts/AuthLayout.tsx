import React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-midnight-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-royal-500/10 rounded-full blur-3xl" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-electric-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative w-full max-w-md z-10">
        {/* Auth Form Container */}
        <div className="card-premium p-8 animate-fade-in-up">
          {/* Decorative top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-gold-500 via-royal-500 to-electric-500 rounded-full -mt-8 mb-8 -mx-8 w-[calc(100%+4rem)]"></div>
          
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-text-muted text-xs">
            © 2024 ClubOps. Premium club management platform.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout