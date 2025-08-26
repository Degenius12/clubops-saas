import React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-secondary to-dark-accent flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* ClubOps Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-4xl font-bold text-gradient-premium mb-2">ClubOps</h1>
            <p className="text-accent-blue/70 text-sm">Premium Club Management SaaS</p>
          </div>
        </div>

        {/* Auth Form Container with Glass Effect */}
        <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="space-y-1 mb-6">
            <div className="h-1 bg-gradient-to-r from-accent-gold via-accent-blue to-accent-red rounded-full"></div>
          </div>
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2024 ClubOps. Premium club management solutions.
          </p>
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-blue/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-gold/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-red/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}

export default AuthLayout