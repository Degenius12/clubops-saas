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
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

const SubscriptionDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { 
    currentPlan, 
    usage, 
    billing, 
    loading 
  } = useSelector((state: RootState) => state.subscription)
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')

  useEffect(() => {
    dispatch(fetchSubscription())
  }, [dispatch])

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'Forever',
      description: 'Perfect for getting started',
      color: 'gray',
      popular: false,
      features: [
        { name: 'Up to 5 dancers', included: true },
        { name: 'Basic dancer management', included: true },
        { name: 'Simple reporting', included: true },
        { name: 'Email support', included: true },
        { name: 'VIP room tracking', included: false },
        { name: 'Advanced analytics', included: false },
        { name: 'Multi-location support', included: false },
        { name: 'API access', included: false }
      ],
      limits: {
        dancers: 5,
        vipRooms: 0,
        monthlyReports: 1,
        storage: '1GB'
      }
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 49,
      period: 'per month',
      description: 'For small to medium clubs',
      color: 'blue',
      popular: false,
      features: [
        { name: 'Up to 25 dancers', included: true },
        { name: 'Full dancer management', included: true },
        { name: 'VIP room tracking', included: true },
        { name: 'Revenue analytics', included: true },
        { name: 'Priority email support', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'Multi-location support', included: false },
        { name: 'API access', included: false }
      ],
      limits: {
        dancers: 25,
        vipRooms: 5,
        monthlyReports: 10,
        storage: '10GB'
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 149,
      period: 'per month',
      description: 'For growing businesses',
      color: 'gold',
      popular: true,
      features: [
        { name: 'Up to 100 dancers', included: true },
        { name: 'Full dancer management', included: true },
        { name: 'Unlimited VIP rooms', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Revenue forecasting', included: true },
        { name: 'Priority phone support', included: true },
        { name: 'Multi-location support', included: false },
        { name: 'API access', included: false }
      ],
      limits: {
        dancers: 100,
        vipRooms: 'unlimited',
        monthlyReports: 'unlimited',
        storage: '100GB'
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 399,
      period: 'per month',
      description: 'For large operations',
      color: 'red',
      popular: false,
      features: [
        { name: 'Unlimited dancers', included: true },
        { name: 'Full platform access', included: true },
        { name: 'Multi-location support', included: true },
        { name: 'Custom analytics', included: true },
        { name: 'API access', included: true },
        { name: 'Dedicated support', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'White-label options', included: true }
      ],
      limits: {
        dancers: 'unlimited',
        vipRooms: 'unlimited',
        monthlyReports: 'unlimited',
        storage: '1TB'
      }
    }
  ]

  const currentPlanData = plans.find(p => p.id === currentPlan?.planId) || plans[0]

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId)
    setShowUpgradeModal(true)
  }

  const confirmUpgrade = () => {
    if (selectedPlan) {
      dispatch(upgradeSubscription(selectedPlan))
      setShowUpgradeModal(false)
    }
  }

  const getPlanColor = (color: string) => {
    switch (color) {
      case 'blue': return 'accent-blue'
      case 'gold': return 'accent-gold'
      case 'red': return 'accent-red'
      default: return 'gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Subscription Management</h1>
          <p className="text-gray-400 mt-1">
            Manage your ClubOps plan and billing settings
          </p>
        </div>
      </div>

      {/* Current Plan Status */}
      <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className={`p-4 bg-${getPlanColor(currentPlanData.color)}/20 rounded-xl`}>
              {currentPlanData.id === 'enterprise' && <ShieldCheckIcon className={`h-8 w-8 text-${getPlanColor(currentPlanData.color)}`} />}
              {currentPlanData.id === 'pro' && <StarIcon className={`h-8 w-8 text-${getPlanColor(currentPlanData.color)}`} />}
              {currentPlanData.id === 'basic' && <BoltIcon className={`h-8 w-8 text-${getPlanColor(currentPlanData.color)}`} />}
              {currentPlanData.id === 'free' && <CreditCardIcon className={`h-8 w-8 text-${getPlanColor(currentPlanData.color)}`} />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{currentPlanData.name} Plan</h2>
              <p className="text-gray-400">{currentPlanData.description}</p>
              <p className="text-accent-gold font-medium mt-1">
                ${currentPlanData.price} {currentPlanData.period}
              </p>
            </div>
          </div>

          <div className="text-right">
            {currentPlanData.id !== 'enterprise' && (
              <button
                onClick={() => handleUpgrade('pro')}
                className="bg-gradient-to-r from-accent-blue to-accent-gold hover:from-accent-gold hover:to-accent-blue text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Upgrade Plan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-accent-blue/20 rounded-lg">
              <UsersIcon className="h-6 w-6 text-accent-blue" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Dancers</h3>
              <p className="text-xl font-bold text-white">
                {usage?.dancers || 0} / {currentPlanData.limits.dancers === 'unlimited' ? '∞' : currentPlanData.limits.dancers}
              </p>
              <div className="w-full bg-dark-bg/50 rounded-full h-2 mt-2">
                <div 
                  className="h-full bg-accent-blue rounded-full transition-all duration-500"
                  style={{ 
                    width: currentPlanData.limits.dancers === 'unlimited' 
                      ? '20%' 
                      : `${Math.min(((usage?.dancers || 0) / (typeof currentPlanData.limits.dancers === 'number' ? currentPlanData.limits.dancers : 1)) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-accent-gold/20 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-accent-gold" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">VIP Rooms</h3>
              <p className="text-xl font-bold text-white">
                {usage?.vipRooms || 0} / {currentPlanData.limits.vipRooms === 'unlimited' ? '∞' : currentPlanData.limits.vipRooms}
              </p>
              <div className="w-full bg-dark-bg/50 rounded-full h-2 mt-2">
                <div 
                  className="h-full bg-accent-gold rounded-full transition-all duration-500"
                  style={{ 
                    width: currentPlanData.limits.vipRooms === 'unlimited' 
                      ? '30%' 
                      : `${Math.min(((usage?.vipRooms || 0) / (typeof currentPlanData.limits.vipRooms === 'number' ? currentPlanData.limits.vipRooms : 1)) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-accent-red/20 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-accent-red" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Storage</h3>
              <p className="text-xl font-bold text-white">
                {usage?.storage || '0.5GB'} / {currentPlanData.limits.storage}
              </p>
              <div className="w-full bg-dark-bg/50 rounded-full h-2 mt-2">
                <div 
                  className="h-full bg-accent-red rounded-full transition-all duration-500"
                  style={{ width: '35%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Available Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`bg-dark-card/80 backdrop-blur-xl border rounded-xl p-6 transition-all duration-300 ${
                plan.id === currentPlan?.planId 
                  ? `border-${getPlanColor(plan.color)}/50 ring-2 ring-${getPlanColor(plan.color)}/20` 
                  : 'border-white/10 hover:border-white/30'
              } ${
                plan.popular ? 'relative' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-accent-gold to-accent-red text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-white">${plan.price}</span>
                  <span className="text-gray-400 text-sm ml-1">{plan.period}</span>
                </div>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {feature.included ? (
                      <CheckIcon className="h-4 w-4 text-green-400" />
                    ) : (
                      <XMarkIcon className="h-4 w-4 text-gray-500" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-white' : 'text-gray-500'}`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => plan.id !== currentPlan?.planId && handleUpgrade(plan.id)}
                disabled={plan.id === currentPlan?.planId}
                className={`w-full font-medium py-3 rounded-lg transition-all duration-300 ${
                  plan.id === currentPlan?.planId
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : plan.popular
                      ? 'bg-gradient-to-r from-accent-gold to-accent-red hover:from-accent-red hover:to-accent-gold text-white hover:scale-105'
                      : `bg-${getPlanColor(plan.color)}/20 hover:bg-${getPlanColor(plan.color)}/30 border border-${getPlanColor(plan.color)}/30 text-${getPlanColor(plan.color)} hover:scale-105`
                }`}
              >
                {plan.id === currentPlan?.planId ? 'Current Plan' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Billing Information */}
      <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Billing Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Next Billing Date</h4>
            <p className="text-white font-medium">
              {billing?.nextBillingDate ? new Date(billing.nextBillingDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Payment Method</h4>
            <div className="flex items-center space-x-2">
              <CreditCardIcon className="h-4 w-4 text-gray-400" />
              <span className="text-white">****{billing?.lastFour || '1234'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Confirmation Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-white/20 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Plan Upgrade</h3>
            
            <p className="text-gray-400 mb-6">
              Are you sure you want to upgrade to the {plans.find(p => p.id === selectedPlan)?.name} plan?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpgrade}
                className="flex-1 bg-gradient-to-r from-accent-blue to-accent-gold hover:from-accent-gold hover:to-accent-blue text-white font-medium py-3 rounded-lg transition-all duration-300"
              >
                Confirm Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionDashboard