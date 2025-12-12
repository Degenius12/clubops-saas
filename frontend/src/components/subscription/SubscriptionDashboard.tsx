import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store/store'
import { fetchSubscription, upgradeSubscription } from '../../store/slices/subscriptionSlice'
import {
  CreditCardIcon,
  CheckIcon,
  XMarkIcon,
  StarIcon,
  BoltIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BuildingOffice2Icon,
  ArrowTrendingUpIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

interface PlanFeature {
  name: string
  included: boolean
  highlight?: boolean
}

interface Plan {
  id: string
  name: string
  price: number
  period: string
  description: string
  icon: React.ElementType
  gradient: string
  popular: boolean
  features: PlanFeature[]
  limits: {
    dancers: number | 'unlimited'
    vipBooths: number | 'unlimited'
    monthlyReports: number | 'unlimited'
    storage: string
  }
}

const SubscriptionDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { currentPlan, usage, billing, loading } = useSelector((state: RootState) => state.subscription)
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  useEffect(() => {
    dispatch(fetchSubscription())
  }, [dispatch])

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Starter',
      price: 0,
      period: 'forever',
      description: 'Perfect for getting started',
      icon: SparklesIcon,
      gradient: 'from-slate-500 to-slate-600',
      popular: false,
      features: [
        { name: 'Up to 5 dancers', included: true },
        { name: 'Basic dancer management', included: true },
        { name: 'Simple reporting', included: true },
        { name: 'Email support', included: true },
        { name: 'VIP booth tracking', included: false },
        { name: 'Advanced analytics', included: false },
        { name: 'Fraud prevention', included: false },
        { name: 'API access', included: false }
      ],
      limits: { dancers: 5, vipBooths: 0, monthlyReports: 1, storage: '1GB' }
    },
    {
      id: 'basic',
      name: 'Professional',
      price: billingCycle === 'annual' ? 39 : 49,
      period: billingCycle === 'annual' ? '/mo billed annually' : '/month',
      description: 'For small to medium clubs',
      icon: BoltIcon,
      gradient: 'from-electric-500 to-royal-500',
      popular: false,
      features: [
        { name: 'Up to 25 dancers', included: true },
        { name: 'Full dancer management', included: true },
        { name: 'VIP booth tracking', included: true, highlight: true },
        { name: 'Revenue analytics', included: true },
        { name: 'Priority email support', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'Fraud prevention', included: false },
        { name: 'API access', included: false }
      ],
      limits: { dancers: 25, vipBooths: 5, monthlyReports: 10, storage: '10GB' }
    },
    {
      id: 'pro',
      name: 'Business',
      price: billingCycle === 'annual' ? 119 : 149,
      period: billingCycle === 'annual' ? '/mo billed annually' : '/month',
      description: 'For growing operations',
      icon: RocketLaunchIcon,
      gradient: 'from-gold-500 to-gold-600',
      popular: true,
      features: [
        { name: 'Up to 100 dancers', included: true },
        { name: 'Full dancer management', included: true },
        { name: 'Unlimited VIP booths', included: true, highlight: true },
        { name: 'Advanced analytics', included: true, highlight: true },
        { name: 'Fraud prevention suite', included: true, highlight: true },
        { name: 'Priority phone support', included: true },
        { name: 'Custom reports', included: true },
        { name: 'API access', included: false }
      ],
      limits: { dancers: 100, vipBooths: 'unlimited', monthlyReports: 'unlimited', storage: '100GB' }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: billingCycle === 'annual' ? 319 : 399,
      period: billingCycle === 'annual' ? '/mo billed annually' : '/month',
      description: 'For large operations & chains',
      icon: BuildingOffice2Icon,
      gradient: 'from-status-danger to-rose-600',
      popular: false,
      features: [
        { name: 'Unlimited dancers', included: true, highlight: true },
        { name: 'Multi-location support', included: true, highlight: true },
        { name: 'Custom integrations', included: true },
        { name: 'Full API access', included: true, highlight: true },
        { name: 'Dedicated support', included: true },
        { name: 'White-label options', included: true },
        { name: 'Custom analytics', included: true },
        { name: 'SLA guarantee', included: true }
      ],
      limits: { dancers: 'unlimited', vipBooths: 'unlimited', monthlyReports: 'unlimited', storage: '1TB' }
    }
  ]

  const currentPlanData = plans.find(p => p.id === currentPlan?.planId) || plans[0]

  const getUsagePercentage = (current: number, max: number | 'unlimited') => {
    if (max === 'unlimited') return 15
    return Math.min((current / max) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-status-danger'
    if (percentage >= 70) return 'bg-status-warning'
    return 'bg-electric-500'
  }

  const handleUpgrade = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowUpgradeModal(true)
  }

  const confirmUpgrade = () => {
    if (selectedPlan) {
      dispatch(upgradeSubscription(selectedPlan.id))
      setShowUpgradeModal(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Subscription</h1>
          <p className="text-text-tertiary mt-1">Manage your ClubOps plan and features</p>
        </div>
        
        {/* Billing Cycle Toggle */}
        <div className="flex items-center gap-3 p-1 rounded-xl bg-midnight-800/50 border border-white/10">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-electric-500/20 text-electric-400 border border-electric-500/30'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              billingCycle === 'annual'
                ? 'bg-status-success/20 text-status-success border border-status-success/30'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Annual
            <span className="px-1.5 py-0.5 rounded text-xs bg-status-success/20 text-status-success">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Current Plan Card */}
      <div className="card-premium p-6 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${currentPlanData.gradient} opacity-10 blur-3xl`}></div>
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${currentPlanData.gradient}`}>
              <currentPlanData.icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-text-primary">{currentPlanData.name}</h2>
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-status-success/10 text-status-success border border-status-success/30">
                  ACTIVE
                </span>
              </div>
              <p className="text-text-tertiary mt-1">{currentPlanData.description}</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold text-text-primary">${currentPlanData.price}</span>
                <span className="text-text-tertiary">{currentPlanData.period}</span>
              </div>
            </div>
          </div>

          {currentPlanData.id !== 'enterprise' && (
            <button
              onClick={() => handleUpgrade(plans.find(p => p.id === 'pro') || plans[2])}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              <ArrowTrendingUpIcon className="h-5 w-5" />
              Upgrade Plan
            </button>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { 
            label: 'Dancers', 
            current: usage?.dancers || 3, 
            max: currentPlanData.limits.dancers,
            icon: UsersIcon,
            color: 'electric'
          },
          { 
            label: 'VIP Booths', 
            current: usage?.vipBooths || 2, 
            max: currentPlanData.limits.vipBooths,
            icon: CurrencyDollarIcon,
            color: 'gold'
          },
          { 
            label: 'Storage Used', 
            current: 2.4, 
            max: parseFloat(currentPlanData.limits.storage) || 100,
            icon: ChartBarIcon,
            color: 'royal',
            suffix: 'GB'
          }
        ].map((stat, index) => {
          const percentage = getUsagePercentage(stat.current, stat.max)
          return (
            <div key={stat.label} className="card-premium p-5" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-${stat.color}-500/10`}>
                    <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                  </div>
                  <span className="text-text-secondary font-medium">{stat.label}</span>
                </div>
              </div>
              
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-bold text-text-primary tabular-nums">
                  {stat.current}{stat.suffix || ''}
                </span>
                <span className="text-text-tertiary">
                  / {stat.max === 'unlimited' ? '∞' : `${stat.max}${stat.suffix || ''}`}
                </span>
              </div>
              
              <div className="h-2 rounded-full bg-midnight-700 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getUsageColor(percentage)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              {percentage >= 80 && (
                <p className="text-xs text-status-warning mt-2 flex items-center gap-1">
                  <InformationCircleIcon className="h-3.5 w-3.5" />
                  Approaching limit
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-6">Available Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map((plan, index) => {
            const isCurrent = plan.id === currentPlan?.planId
            const PlanIcon = plan.icon
            
            return (
              <div 
                key={plan.id}
                className={`relative card-premium p-6 transition-all duration-300 animate-fade-in-up ${
                  plan.popular ? 'ring-2 ring-gold-500/50 border-gold-500/30' : ''
                } ${isCurrent ? 'border-electric-500/50' : ''}`}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-midnight-900 text-xs font-bold flex items-center gap-1">
                      <StarSolid className="h-3 w-3" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6 pt-2">
                  <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${plan.gradient} p-3 mb-4`}>
                    <PlanIcon className="h-full w-full text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
                  <p className="text-sm text-text-tertiary mt-1">{plan.description}</p>
                  
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-text-primary">${plan.price}</span>
                    <span className="text-text-tertiary text-sm ml-1">{plan.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-6">
                  {plan.features.slice(0, 6).map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-center gap-2.5">
                      {feature.included ? (
                        <CheckCircleIcon className={`h-5 w-5 flex-shrink-0 ${feature.highlight ? 'text-gold-500' : 'text-status-success'}`} />
                      ) : (
                        <XMarkIcon className="h-5 w-5 flex-shrink-0 text-text-tertiary/50" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-text-secondary' : 'text-text-tertiary/50'}`}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => !isCurrent && handleUpgrade(plan)}
                  disabled={isCurrent}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    isCurrent
                      ? 'bg-midnight-700 text-text-tertiary cursor-default'
                      : plan.popular
                        ? 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-midnight-900 hover:scale-[1.02]'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-text-primary hover:scale-[1.02]'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Feature Comparison Note */}
      <div className="card-premium p-5 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-electric-500/10">
          <InformationCircleIcon className="h-5 w-5 text-electric-400" />
        </div>
        <div>
          <h3 className="font-medium text-text-primary">Need help choosing?</h3>
          <p className="text-sm text-text-tertiary mt-1">
            All paid plans include a 14-day free trial. Upgrade or downgrade anytime. 
            Contact our sales team for custom enterprise solutions.
          </p>
        </div>
      </div>

      {/* Upgrade Confirmation Modal */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          />
          
          <div className="relative w-full max-w-md card-premium p-6 animate-scale-in">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-text-tertiary" />
            </button>
            
            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${selectedPlan.gradient} p-4 mb-4`}>
                <selectedPlan.icon className="h-full w-full text-white" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">Upgrade to {selectedPlan.name}</h3>
              <p className="text-text-tertiary mt-1">Unlock more features for your club</p>
            </div>

            {/* Price Display */}
            <div className="p-4 rounded-xl bg-midnight-800/50 border border-white/10 text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-text-primary">${selectedPlan.price}</span>
                <span className="text-text-tertiary">{selectedPlan.period}</span>
              </div>
              {billingCycle === 'annual' && (
                <p className="text-sm text-status-success mt-1">
                  You're saving 20% with annual billing
                </p>
              )}
            </div>

            {/* Key Features */}
            <div className="space-y-2 mb-6">
              {selectedPlan.features.filter(f => f.highlight).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircleIcon className="h-4 w-4 text-gold-500" />
                  <span className="text-text-secondary">{feature.name}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 btn-secondary py-3"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpgrade}
                className="flex-1 btn-primary py-3"
              >
                Confirm Upgrade
              </button>
            </div>

            <p className="text-xs text-text-tertiary text-center mt-4">
              You can cancel or change plans anytime
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionDashboard
