// ClubOnboarding.tsx
// Multi-step wizard for initial club setup (Feature #50)

import React, { useState, useEffect } from 'react'
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  MusicalNoteIcon,
  UserGroupIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface ClubOnboardingProps {
  onComplete?: () => void
}

interface StageConfig {
  count: number
  rotationSequence: string[]
  rotationEnabled: boolean
}

interface VipBillingConfig {
  billingType: 'SONG' | 'TIME'
  timeIncrement?: number
  timeRate?: number
  songRate?: number
  avgSongDuration?: number
}

interface PatronCountConfig {
  enabled: boolean
  capacityLimit?: number
  reEntryFeeEnabled: boolean
  reEntryFeeAmount?: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const ClubOnboarding: React.FC<ClubOnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stage Configuration (Step 1)
  const [stageConfig, setStageConfig] = useState<StageConfig>({
    count: 1,
    rotationSequence: ['Main Stage'],
    rotationEnabled: false
  })

  // VIP Billing Configuration (Step 2)
  const [vipConfig, setVipConfig] = useState<VipBillingConfig>({
    billingType: 'SONG',
    songRate: 30.00,
    avgSongDuration: 210 // 3.5 minutes
  })

  // Patron Count Configuration (Step 3 - Optional)
  const [patronConfig, setPatronCountConfig] = useState<PatronCountConfig>({
    enabled: false,
    reEntryFeeEnabled: false
  })

  // Load existing configuration if any
  useEffect(() => {
    loadExistingConfig()
  }, [])

  const loadExistingConfig = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/club-onboarding/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.configuration) {
          const { stages, vipBilling, patronCount } = data.configuration

          // Load stage config
          if (stages) {
            setStageConfig({
              count: stages.count || 1,
              rotationSequence: stages.rotationSequence || ['Main Stage'],
              rotationEnabled: stages.rotationEnabled || false
            })
          }

          // Load VIP billing config
          if (vipBilling) {
            setVipConfig({
              billingType: vipBilling.type || 'SONG',
              timeIncrement: vipBilling.timeIncrement,
              timeRate: vipBilling.timeRate ? parseFloat(vipBilling.timeRate) : undefined,
              songRate: vipBilling.songRate ? parseFloat(vipBilling.songRate) : 30.00,
              avgSongDuration: vipBilling.avgSongDuration || 210
            })
          }

          // Load patron count config
          if (patronCount) {
            setPatronCountConfig({
              enabled: patronCount.enabled || false,
              capacityLimit: patronCount.capacityLimit,
              reEntryFeeEnabled: patronCount.reEntryFeeEnabled || false,
              reEntryFeeAmount: patronCount.reEntryFeeAmount ? parseFloat(patronCount.reEntryFeeAmount) : undefined
            })
          }

          // Set current step
          if (data.onboarding && !data.onboarding.completed) {
            setCurrentStep(data.onboarding.currentStep + 1 || 1)
          }
        }
      }
    } catch (err) {
      console.error('[ClubOnboarding] Failed to load config:', err)
    }
  }

  const handleStageCountChange = (count: number) => {
    const newSequence = Array(count).fill(null).map((_, i) => {
      if (stageConfig.rotationSequence[i]) {
        return stageConfig.rotationSequence[i]
      }
      return i === 0 ? 'Main Stage' : `Stage ${i + 1}`
    })

    setStageConfig({
      ...stageConfig,
      count,
      rotationSequence: newSequence
    })
  }

  const handleStageNameChange = (index: number, name: string) => {
    const newSequence = [...stageConfig.rotationSequence]
    newSequence[index] = name
    setStageConfig({
      ...stageConfig,
      rotationSequence: newSequence
    })
  }

  const saveStageConfig = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/club-onboarding/stage-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stageCount: stageConfig.count,
          stageRotationSequence: stageConfig.rotationSequence,
          stageRotationEnabled: stageConfig.rotationEnabled
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCurrentStep(2)
      } else {
        setError(data.error || 'Failed to save stage configuration')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('[ClubOnboarding] Error saving stage config:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const saveVipConfig = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const payload: any = {
        vipBillingType: vipConfig.billingType
      }

      if (vipConfig.billingType === 'TIME') {
        payload.vipTimeIncrement = vipConfig.timeIncrement
        payload.vipTimeRate = vipConfig.timeRate
      } else {
        payload.vipSongRate = vipConfig.songRate
        payload.avgSongDuration = vipConfig.avgSongDuration
      }

      const response = await fetch(`${API_BASE_URL}/api/club-onboarding/vip-billing-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCurrentStep(3)
      } else {
        setError(data.error || 'Failed to save VIP billing configuration')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('[ClubOnboarding] Error saving VIP config:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const savePatronCountConfig = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/club-onboarding/patron-count-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doorCountEnabled: patronConfig.enabled,
          capacityLimit: patronConfig.capacityLimit,
          reEntryFeeEnabled: patronConfig.reEntryFeeEnabled,
          reEntryFeeAmount: patronConfig.reEntryFeeAmount
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCurrentStep(4)
      } else {
        setError(data.error || 'Failed to save patron count configuration')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('[ClubOnboarding] Error saving patron count config:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const completeOnboarding = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/club-onboarding/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        if (onComplete) {
          onComplete()
        }
      } else {
        setError(data.error || 'Failed to complete onboarding')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('[ClubOnboarding] Error completing onboarding:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const renderProgressBar = () => {
    const steps = [
      { number: 1, name: 'Stages', icon: MusicalNoteIcon },
      { number: 2, name: 'VIP Billing', icon: BuildingStorefrontIcon },
      { number: 3, name: 'Patron Count', icon: UserGroupIcon },
      { number: 4, name: 'Complete', icon: CheckCircleIcon }
    ]

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep > step.number
                      ? 'bg-electric-500 border-electric-500 text-white'
                      : currentStep === step.number
                      ? 'bg-electric-500 border-electric-500 text-white'
                      : 'bg-midnight-800 border-white/20 text-text-tertiary'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckIcon className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  currentStep >= step.number ? 'text-text-primary' : 'text-text-tertiary'
                }`}>
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-electric-500' : 'bg-white/10'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }

  const renderStageConfig = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Stage Configuration</h2>
        <p className="text-text-secondary">Configure how many stages your club has and their rotation sequence.</p>
      </div>

      {/* Stage Count */}
      <div className="card-premium p-6">
        <label className="block text-sm font-medium text-text-secondary mb-3">
          How many stages does your club have?
        </label>
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => handleStageCountChange(count)}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                stageConfig.count === count
                  ? 'border-electric-500 bg-electric-500/10 text-electric-400'
                  : 'border-white/10 bg-midnight-800 text-text-secondary hover:border-white/20'
              }`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs mt-1">{count === 1 ? 'Stage' : 'Stages'}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Stage Names */}
      <div className="card-premium p-6">
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Name your stages (rotation order)
        </label>
        <div className="space-y-3">
          {stageConfig.rotationSequence.map((name, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-electric-500/10 border border-electric-500/30 text-electric-400 text-sm font-medium">
                {index + 1}
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => handleStageNameChange(index, e.target.value)}
                placeholder={`Stage ${index + 1}`}
                maxLength={50}
                className="flex-1 input-dark"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Rotation Enabled */}
      <div className="card-premium p-6">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={stageConfig.rotationEnabled}
            onChange={(e) => setStageConfig({ ...stageConfig, rotationEnabled: e.target.checked })}
            className="mt-1 checkbox-dark"
          />
          <div>
            <div className="text-sm font-medium text-text-primary">Enable automatic rotation</div>
            <div className="text-xs text-text-tertiary mt-1">
              Entertainers will automatically rotate through stages in the order specified above
            </div>
          </div>
        </label>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={saveStageConfig}
          disabled={isLoading}
          className="btn-primary flex items-center gap-2"
        >
          {isLoading ? 'Saving...' : 'Continue'}
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  const renderVipConfig = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">VIP Billing Configuration</h2>
        <p className="text-text-secondary">Choose how you bill for VIP booth sessions.</p>
      </div>

      {/* Billing Type Selection */}
      <div className="card-premium p-6">
        <label className="block text-sm font-medium text-text-secondary mb-4">
          How do you charge for VIP booth time?
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setVipConfig({ ...vipConfig, billingType: 'SONG' })}
            className={`p-6 rounded-lg border-2 transition-all ${
              vipConfig.billingType === 'SONG'
                ? 'border-electric-500 bg-electric-500/10'
                : 'border-white/10 bg-midnight-800 hover:border-white/20'
            }`}
          >
            <MusicalNoteIcon className={`h-8 w-8 mb-3 ${
              vipConfig.billingType === 'SONG' ? 'text-electric-400' : 'text-text-tertiary'
            }`} />
            <div className={`font-semibold mb-1 ${
              vipConfig.billingType === 'SONG' ? 'text-electric-400' : 'text-text-primary'
            }`}>
              Per Song
            </div>
            <div className="text-xs text-text-tertiary">
              Charge a fixed rate for each song performed
            </div>
          </button>

          <button
            type="button"
            onClick={() => setVipConfig({ ...vipConfig, billingType: 'TIME' })}
            className={`p-6 rounded-lg border-2 transition-all ${
              vipConfig.billingType === 'TIME'
                ? 'border-electric-500 bg-electric-500/10'
                : 'border-white/10 bg-midnight-800 hover:border-white/20'
            }`}
          >
            <UserGroupIcon className={`h-8 w-8 mb-3 ${
              vipConfig.billingType === 'TIME' ? 'text-electric-400' : 'text-text-tertiary'
            }`} />
            <div className={`font-semibold mb-1 ${
              vipConfig.billingType === 'TIME' ? 'text-electric-400' : 'text-text-primary'
            }`}>
              Per Time
            </div>
            <div className="text-xs text-text-tertiary">
              Charge based on time increments (e.g., 15 min, 30 min)
            </div>
          </button>
        </div>
      </div>

      {/* Song-Based Configuration */}
      {vipConfig.billingType === 'SONG' && (
        <div className="card-premium p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Rate per song ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={vipConfig.songRate || ''}
              onChange={(e) => setVipConfig({ ...vipConfig, songRate: parseFloat(e.target.value) })}
              className="input-dark"
              placeholder="30.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Average song duration (seconds)
            </label>
            <input
              type="number"
              min="1"
              value={vipConfig.avgSongDuration || ''}
              onChange={(e) => setVipConfig({ ...vipConfig, avgSongDuration: parseInt(e.target.value) })}
              className="input-dark"
              placeholder="210"
            />
            <p className="text-xs text-text-tertiary mt-1">
              This helps calculate session durations. Typical songs are 3-4 minutes (180-240 seconds).
            </p>
          </div>
        </div>
      )}

      {/* Time-Based Configuration */}
      {vipConfig.billingType === 'TIME' && (
        <div className="card-premium p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Time increment (minutes)
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[15, 30, 45, 60].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setVipConfig({ ...vipConfig, timeIncrement: minutes })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    vipConfig.timeIncrement === minutes
                      ? 'border-electric-500 bg-electric-500/10 text-electric-400'
                      : 'border-white/10 bg-midnight-800 text-text-secondary hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold">{minutes}</div>
                  <div className="text-xs">min</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Rate per time increment ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={vipConfig.timeRate || ''}
              onChange={(e) => setVipConfig({ ...vipConfig, timeRate: parseFloat(e.target.value) })}
              className="input-dark"
              placeholder="100.00"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between gap-3">
        <button
          onClick={() => setCurrentStep(1)}
          disabled={isLoading}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={saveVipConfig}
          disabled={isLoading}
          className="btn-primary flex items-center gap-2"
        >
          {isLoading ? 'Saving...' : 'Continue'}
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  const renderPatronCountConfig = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Patron Count System (Optional)</h2>
        <p className="text-text-secondary">Configure door count integration if you have electronic counters.</p>
      </div>

      {/* Enable Patron Count */}
      <div className="card-premium p-6">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={patronConfig.enabled}
            onChange={(e) => setPatronCountConfig({ ...patronConfig, enabled: e.target.checked })}
            className="mt-1 checkbox-dark"
          />
          <div>
            <div className="text-sm font-medium text-text-primary">Enable patron count tracking</div>
            <div className="text-xs text-text-tertiary mt-1">
              Track real-time occupancy with electronic door counters
            </div>
          </div>
        </label>
      </div>

      {patronConfig.enabled && (
        <>
          {/* Capacity Limit */}
          <div className="card-premium p-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Maximum capacity
            </label>
            <input
              type="number"
              min="1"
              value={patronConfig.capacityLimit || ''}
              onChange={(e) => setPatronCountConfig({ ...patronConfig, capacityLimit: parseInt(e.target.value) })}
              className="input-dark"
              placeholder="200"
            />
            <p className="text-xs text-text-tertiary mt-1">
              System will alert you when approaching or exceeding capacity
            </p>
          </div>

          {/* Re-Entry Fee */}
          <div className="card-premium p-6 space-y-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={patronConfig.reEntryFeeEnabled}
                onChange={(e) => setPatronCountConfig({ ...patronConfig, reEntryFeeEnabled: e.target.checked })}
                className="mt-1 checkbox-dark"
              />
              <div>
                <div className="text-sm font-medium text-text-primary">Charge re-entry fee</div>
                <div className="text-xs text-text-tertiary mt-1">
                  Charge patrons who leave and come back
                </div>
              </div>
            </label>

            {patronConfig.reEntryFeeEnabled && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Re-entry fee amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={patronConfig.reEntryFeeAmount || ''}
                  onChange={(e) => setPatronCountConfig({ ...patronConfig, reEntryFeeAmount: parseFloat(e.target.value) })}
                  className="input-dark"
                  placeholder="10.00"
                />
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between gap-3">
        <button
          onClick={() => setCurrentStep(2)}
          disabled={isLoading}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={savePatronCountConfig}
          disabled={isLoading}
          className="btn-primary flex items-center gap-2"
        >
          {isLoading ? 'Saving...' : 'Continue'}
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  const renderComplete = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-20 h-20 rounded-full bg-electric-500/10 border-2 border-electric-500 flex items-center justify-center">
        <CheckCircleIcon className="h-12 w-12 text-electric-400" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Setup Complete!</h2>
        <p className="text-text-secondary">Your club is configured and ready to use.</p>
      </div>

      {/* Summary */}
      <div className="card-premium p-6 text-left space-y-4">
        <h3 className="font-semibold text-text-primary border-b border-white/10 pb-2">Configuration Summary</h3>

        <div>
          <div className="text-sm font-medium text-text-secondary mb-1">Stages</div>
          <div className="text-text-primary">
            {stageConfig.count} {stageConfig.count === 1 ? 'stage' : 'stages'}
            {stageConfig.rotationEnabled && ' (automatic rotation enabled)'}
          </div>
          <div className="text-xs text-text-tertiary mt-1">
            {stageConfig.rotationSequence.join(' → ')}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-text-secondary mb-1">VIP Billing</div>
          <div className="text-text-primary">
            {vipConfig.billingType === 'SONG' ? (
              <>Per song billing at ${vipConfig.songRate}/song</>
            ) : (
              <>Per time billing at ${vipConfig.timeRate} per {vipConfig.timeIncrement} minutes</>
            )}
          </div>
        </div>

        {patronConfig.enabled && (
          <div>
            <div className="text-sm font-medium text-text-secondary mb-1">Patron Count</div>
            <div className="text-text-primary">
              Enabled with {patronConfig.capacityLimit} person capacity
              {patronConfig.reEntryFeeEnabled && (
                <> • ${patronConfig.reEntryFeeAmount} re-entry fee</>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between gap-3">
        <button
          onClick={() => setCurrentStep(3)}
          disabled={isLoading}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={completeOnboarding}
          disabled={isLoading}
          className="btn-primary flex items-center gap-2"
        >
          {isLoading ? 'Completing...' : 'Finish Setup'}
          <CheckIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-midnight-950 p-8">
      <div className="max-w-3xl mx-auto">
        {renderProgressBar()}

        <div className="bg-midnight-900 rounded-2xl border border-white/10 p-8">
          {currentStep === 1 && renderStageConfig()}
          {currentStep === 2 && renderVipConfig()}
          {currentStep === 3 && renderPatronCountConfig()}
          {currentStep === 4 && renderComplete()}
        </div>
      </div>
    </div>
  )
}
