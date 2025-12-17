import React, { useState } from 'react';
import { 
  Sparkles, Users, DollarSign, Zap,
  Monitor, Smartphone, ChevronRight, Play, CheckCircle,
  ArrowRight, BarChart3, Lock, Camera, CreditCard, Building2, Loader2
} from 'lucide-react';

// TODO: Replace with your Formspree form ID
// 1. Go to https://formspree.io and create free account
// 2. Create new form, copy the form ID (e.g., "xabcdefg")
// 3. Replace 'YOUR_FORMSPREE_ID' below
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORMSPREE_ID';

export default function InvestorLandingPage() {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    firm: '', 
    interestType: '',
    onboardingInterest: '',
    dancerCount: '',
    message: '' 
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const marketStats = [
    { label: 'US Market Size', value: '$8.1B', subtext: 'Annual Revenue' },
    { label: 'Clubs Nationwide', value: '4,000+', subtext: 'Potential Customers' },
    { label: 'Digital Adoption', value: '< 15%', subtext: 'Massive Opportunity' },
    { label: 'Avg Revenue/Club', value: '$2.5M', subtext: 'Per Year' }
  ];

  const features = [
    { icon: Users, title: 'Dancer Management', desc: 'Compliance tracking, scheduling, performance analytics' },
    { icon: DollarSign, title: 'Revenue Tracking', desc: 'Real-time financial dashboards and reporting' },
    { icon: Monitor, title: 'DJ Queue System', desc: 'Stage management with music integration' },
    { icon: Lock, title: 'VIP Booth Control', desc: 'Session tracking, access control, billing' },
    { icon: CreditCard, title: 'White Label POS', desc: 'Front door & VIP payment processing' },
    { icon: Camera, title: 'Facial Recognition', desc: 'Patron counting, re-entry detection' }
  ];

  const roadmap = [
    { phase: 'Current', title: 'Core Platform', items: ['Dancer Management', 'DJ Queue', 'VIP Tracking', 'Revenue Dashboard'], status: 'live' },
    { phase: 'Q1 2025', title: 'POS Integration', items: ['White Label POS', 'Front Door Kiosk', 'Payment Processing'], status: 'building' },
    { phase: 'Q2 2025', title: 'Hardware Suite', items: ['Facial Recognition', 'Turnstile Integration', 'VIP Access Control'], status: 'planned' },
    { phase: 'Q3 2025', title: 'Scale', items: ['Multi-Location', 'Franchise Tools', 'API Marketplace'], status: 'planned' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('loading');

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          firm: formData.firm,
          interest_type: formData.interestType,
          onboarding_interest: formData.onboardingInterest || 'N/A',
          dancer_count: formData.dancerCount || 'N/A',
          message: formData.message || 'No message provided',
          submitted_at: new Date().toISOString(),
          source: 'Investor Landing Page'
        })
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', firm: '', interestType: '', onboardingInterest: '', dancerCount: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    }
  };

  const resetForm = () => {
    setSubmitStatus('idle');
    setShowDemoModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-[#0D9488]/10" />
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-2xl font-bold">ClubOps</span>
          </div>
          <div className="flex gap-4">
            <a href="#demo" className="px-4 py-2 text-gray-300 hover:text-white transition">Live Demo</a>
            <button 
              onClick={() => setShowDemoModal(true)}
              className="px-6 py-2 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#B8962E] transition"
            >
              Get Started
            </button>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 rounded-full mb-6">
            <Zap className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-sm font-medium">Now Live in Production</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            The Future of<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#0D9488]">
              Club Management
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10">
            ClubOps is the all-in-one SaaS platform transforming a $8.1B industry stuck in the past. 
            From dancer management to POS systems, we're building the operating system for modern entertainment venues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#B8962E] transition text-lg"
            >
              <Play className="w-5 h-5" /> Try Live Demo
            </a>
            <button 
              onClick={() => setShowDemoModal(true)}
              className="inline-flex items-center gap-2 px-8 py-4 border border-[#D4AF37] text-[#D4AF37] font-semibold rounded-lg hover:bg-[#D4AF37]/10 transition text-lg"
            >
              Schedule Presentation <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Market Opportunity */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Market Opportunity</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            A massive, underserved market with high customer lifetime value and recurring revenue potential
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {marketStats.map((stat, i) => (
              <div key={i} className="bg-[#1A1A1A] rounded-xl p-6 text-center border border-gray-800 hover:border-[#D4AF37]/50 transition">
                <div className="text-4xl font-bold text-[#D4AF37] mb-2">{stat.value}</div>
                <div className="text-white font-medium">{stat.label}</div>
                <div className="text-gray-500 text-sm">{stat.subtext}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Screenshots */}
      <section className="py-20 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Production-Ready Platform</h2>
          <p className="text-gray-400 text-center mb-12">Built for the unique needs of entertainment venues</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 to-[#0D9488]/20 rounded-xl opacity-0 group-hover:opacity-100 transition" />
              <img src="/screenshots/01-dashboard.png" alt="Dashboard" className="rounded-xl border border-gray-700 w-full" />
              <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1 rounded-lg flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm">Desktop Dashboard</span>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 to-[#0D9488]/20 rounded-xl opacity-0 group-hover:opacity-100 transition" />
              <img src="/screenshots/mobile/mobile-01-dashboard.png" alt="Mobile" className="rounded-xl border border-gray-700 w-full max-w-[300px] mx-auto" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded-lg flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm">Mobile Responsive</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Comprehensive Feature Set</h2>
          <p className="text-gray-400 text-center mb-12">Current capabilities + roadmap features</p>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="bg-[#1A1A1A] rounded-xl p-6 border border-gray-800 hover:border-[#D4AF37]/50 transition group">
                <feature.icon className="w-10 h-10 text-[#D4AF37] mb-4 group-hover:scale-110 transition" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Roadmap */}
      <section className="py-20 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Product Roadmap</h2>
          <p className="text-gray-400 text-center mb-12">Expanding from software to full hardware integration</p>
          <div className="grid md:grid-cols-4 gap-6">
            {roadmap.map((phase, i) => (
              <div key={i} className={`rounded-xl p-6 border ${phase.status === 'live' ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-[#0D0D0D] border-gray-800'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {phase.status === 'live' && <CheckCircle className="w-5 h-5 text-[#22C55E]" />}
                  {phase.status === 'building' && <Zap className="w-5 h-5 text-[#F59E0B]" />}
                  {phase.status === 'planned' && <ChevronRight className="w-5 h-5 text-gray-500" />}
                  <span className={`text-sm font-medium ${phase.status === 'live' ? 'text-[#D4AF37]' : 'text-gray-400'}`}>{phase.phase}</span>
                </div>
                <h3 className="text-lg font-semibold mb-3">{phase.title}</h3>
                <ul className="space-y-2">
                  {phase.items.map((item, j) => (
                    <li key={j} className="text-gray-400 text-sm flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${phase.status === 'live' ? 'bg-[#22C55E]' : 'bg-gray-600'}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Model */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Revenue Model</h2>
          <p className="text-gray-400 text-center mb-12">Multiple recurring revenue streams</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#1A1A1A] rounded-xl p-8 border border-gray-800">
              <BarChart3 className="w-10 h-10 text-[#D4AF37] mb-4" />
              <h3 className="text-xl font-semibold mb-2">SaaS Subscriptions</h3>
              <p className="text-gray-400 mb-4">$99 - $499/month per location</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>• Tiered feature access</li>
                <li>• Annual discounts (20%)</li>
                <li>• High retention rates</li>
              </ul>
            </div>
            <div className="bg-[#1A1A1A] rounded-xl p-8 border border-gray-800">
              <CreditCard className="w-10 h-10 text-[#0D9488] mb-4" />
              <h3 className="text-xl font-semibold mb-2">Transaction Fees</h3>
              <p className="text-gray-400 mb-4">2.5% + $0.25 per transaction</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>• POS processing revenue</li>
                <li>• Cover charge payments</li>
                <li>• VIP session billing</li>
              </ul>
            </div>
            <div className="bg-[#1A1A1A] rounded-xl p-8 border border-gray-800">
              <Building2 className="w-10 h-10 text-[#8B5CF6] mb-4" />
              <h3 className="text-xl font-semibold mb-2">Hardware Lease</h3>
              <p className="text-gray-400 mb-4">$199 - $499/month per device</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>• Kiosk systems</li>
                <li>• Facial recognition cameras</li>
                <li>• Access control hardware</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo" className="py-20 bg-gradient-to-br from-[#D4AF37]/5 to-[#0D9488]/5">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Try the Live Demo</h2>
          <p className="text-gray-400 mb-8">Experience ClubOps in production - no signup required</p>
          <div className="bg-[#1A1A1A] rounded-xl p-8 max-w-md mx-auto border border-gray-800">
            <div className="mb-6">
              <p className="text-gray-400 mb-2">Demo Credentials</p>
              <div className="bg-[#0D0D0D] rounded-lg p-4 text-left">
                <p className="text-sm"><span className="text-gray-500">Email:</span> <span className="text-white">admin@clubops.com</span></p>
                <p className="text-sm"><span className="text-gray-500">Password:</span> <span className="text-white">password</span></p>
              </div>
            </div>
            <a 
              href="https://clubops-saas-frontend.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 w-full justify-center px-6 py-4 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#B8962E] transition"
            >
              <Play className="w-5 h-5" /> Launch Demo
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 text-xl mb-8">
            Whether you're an investor or club owner, let's talk about how ClubOps can work for you
          </p>
          <button 
            onClick={() => setShowDemoModal(true)}
            className="inline-flex items-center gap-2 px-10 py-5 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#B8962E] transition text-xl"
          >
            Contact Us <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            <span className="font-bold">ClubOps</span>
            <span className="text-gray-500">© 2025</span>
          </div>
          <div className="text-gray-500 text-sm">
            Contact: <a href="mailto:hello@clubops.com" className="text-[#D4AF37] hover:underline">hello@clubops.com</a>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#1A1A1A] rounded-xl p-8 max-w-md w-full border border-gray-800 relative my-8">
            <button 
              onClick={resetForm}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              ✕
            </button>

            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-[#22C55E] mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
                <p className="text-gray-400 mb-6">We'll be in touch within 24 hours.</p>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#B8962E] transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-2">Get in Touch</h3>
                <p className="text-gray-400 mb-6">Tell us about yourself and we'll reach out within 24 hours</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                    required
                  />
                  
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address *"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                    required
                  />
                  
                  <input
                    type="text"
                    name="firm"
                    placeholder="Company / Club Name"
                    value={formData.firm}
                    onChange={(e) => setFormData({...formData, firm: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                  />

                  <select
                    name="interestType"
                    value={formData.interestType}
                    onChange={(e) => setFormData({...formData, interestType: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:outline-none text-white"
                    required
                  >
                    <option value="" className="text-gray-500">I am a... *</option>
                    <option value="investor">Investor</option>
                    <option value="club_owner">Club Owner / Operator</option>
                    <option value="manager">Club Manager</option>
                    <option value="consultant">Industry Consultant</option>
                    <option value="other">Other</option>
                  </select>

                  {/* Show onboarding options for club owners/managers */}
                  {(formData.interestType === 'club_owner' || formData.interestType === 'manager') && (
                    <>
                      <select
                        name="dancerCount"
                        value={formData.dancerCount}
                        onChange={(e) => setFormData({...formData, dancerCount: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0D0D] border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:outline-none text-white"
                      >
                        <option value="">How many dancers do you have?</option>
                        <option value="1-15">1-15 dancers</option>
                        <option value="16-30">16-30 dancers</option>
                        <option value="31-50">31-50 dancers</option>
                        <option value="51-100">51-100 dancers</option>
                        <option value="100+">100+ dancers</option>
                      </select>

                      <select
                        name="onboardingInterest"
                        value={formData.onboardingInterest}
                        onChange={(e) => setFormData({...formData, onboardingInterest: e.target.value})}
                        className="w-full px-4 py-3 bg-[#0D0D0D] border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:outline-none text-white"
                      >
                        <option value="">Onboarding preference?</option>
                        <option value="diy">DIY - I'll set it up myself (Free)</option>
                        <option value="guided">Guided Setup - 2hr Zoom session ($499)</option>
                        <option value="professional">Professional - Full setup + training ($999)</option>
                        <option value="white_glove">White Glove - On-site setup ($1,999+)</option>
                        <option value="undecided">Not sure yet - tell me more</option>
                      </select>

                      <div className="bg-[#0D0D0D] border border-gray-700 rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          💡 Need help migrating existing dancer data? We offer data migration services starting at $999 for up to 25 dancers.
                        </p>
                      </div>
                    </>
                  )}
                  
                  <textarea
                    name="message"
                    placeholder="Tell us about your needs (optional)"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-gray-700 rounded-lg focus:border-[#D4AF37] focus:outline-none h-24 resize-none"
                  />

                  {submitStatus === 'error' && (
                    <p className="text-red-500 text-sm">Something went wrong. Please try again or email us directly.</p>
                  )}
                  
                  <button
                    type="submit"
                    disabled={submitStatus === 'loading'}
                    className="w-full px-6 py-4 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#B8962E] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitStatus === 'loading' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
