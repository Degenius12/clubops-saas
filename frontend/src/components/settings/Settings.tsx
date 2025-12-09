import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store/store'
import { updateUser } from '../../store/slices/authSlice'
import {
  UserCircleIcon,
  BellIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  KeyIcon,
  TrashIcon,
  CheckIcon,
  ChevronRightIcon,
  CreditCardIcon,
  BuildingStorefrontIcon,
  CloudIcon,
  LinkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const Settings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  
  const [activeTab, setActiveTab] = useState('profile')
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  const [profileData, setProfileData] = useState({
    ownerName: user?.ownerName || 'Club Manager',
    email: user?.email || 'admin@clubops.com',
    phoneNumber: user?.phoneNumber || '(555) 123-4567',
    clubName: user?.clubName || 'Your Club',
    address: '123 Entertainment Blvd, Las Vegas, NV 89101',
    timezone: 'America/Los_Angeles'
  })
  
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    systemUpdates: true,
    marketingEmails: false,
    complianceAlerts: true,
    revenueReports: true,
    dancerCheckIns: true,
    vipAlerts: true
  })

  const [preferences, setPreferences] = useState({
    theme: 'dark',
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    autoLogout: '30'
  })

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon, description: 'Personal & club info' },
    { id: 'notifications', name: 'Notifications', icon: BellIcon, description: 'Alert preferences' },
    { id: 'preferences', name: 'Preferences', icon: Cog6ToothIcon, description: 'System settings' },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon, description: 'Account protection' },
    { id: 'integrations', name: 'Integrations', icon: LinkIcon, description: 'Connected services' },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon, description: 'Look & feel' }
  ]

  const handleProfileSave = () => {
    dispatch(updateUser(profileData))
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleNotificationToggle = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }))
  }

  const handlePreferenceChange = (key: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Toggle Switch Component
  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:ring-offset-2 focus:ring-offset-midnight-950 ${
        enabled ? 'bg-gold-500' : 'bg-midnight-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-1">
            Manage your account preferences and club settings
          </p>
        </div>
        
        {/* Save Success Toast */}
        {saveSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-success-500/10 border border-success-500/20 rounded-xl animate-fade-in">
            <CheckIcon className="w-5 h-5 text-success-400" />
            <span className="text-success-400 text-sm font-medium">Changes saved successfully</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="card-premium p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group ${
                      isActive
                        ? 'bg-gold-500/10 border border-gold-500/20'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${
                      isActive ? 'bg-gold-500/20' : 'bg-midnight-800 group-hover:bg-midnight-700'
                    }`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-gold-400' : 'text-text-tertiary group-hover:text-text-secondary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-gold-400' : 'text-text-primary'}`}>
                        {tab.name}
                      </p>
                      <p className="text-xs text-text-muted truncate">{tab.description}</p>
                    </div>
                    <ChevronRightIcon className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-gold-400' : 'text-text-muted'
                    }`} />
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card-premium p-6 space-y-6">
              <div className="flex items-start gap-4 pb-6 border-b border-white/5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-2xl font-bold text-white">
                  {profileData.ownerName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-text-primary">{profileData.ownerName}</h2>
                  <p className="text-text-secondary">{profileData.clubName}</p>
                  <p className="text-text-muted text-sm mt-1">{profileData.email}</p>
                </div>
                <button className="btn-secondary text-sm">
                  Change Photo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileData.ownerName}
                    onChange={(e) => setProfileData({...profileData, ownerName: e.target.value})}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phoneNumber}
                    onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Club Name</label>
                  <input
                    type="text"
                    value={profileData.clubName}
                    onChange={(e) => setProfileData({...profileData, clubName: e.target.value})}
                    className="input-premium w-full"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-2">Club Address</label>
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    className="input-premium w-full"
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Timezone</label>
                  <select
                    value={profileData.timezone}
                    onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
                    className="input-premium w-full"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button onClick={handleProfileSave} className="btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card-premium p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Notification Preferences</h2>
                <p className="text-text-secondary text-sm mt-1">Choose how you want to receive alerts</p>
              </div>

              <div className="space-y-1">
                {[
                  { key: 'complianceAlerts', title: 'Compliance Alerts', desc: 'License expirations and compliance issues', icon: ShieldCheckIcon, critical: true },
                  { key: 'vipAlerts', title: 'VIP Booth Alerts', desc: 'Session timers and booth status changes', icon: BuildingStorefrontIcon },
                  { key: 'dancerCheckIns', title: 'Dancer Check-ins', desc: 'Notifications when dancers check in/out', icon: UserCircleIcon },
                  { key: 'revenueReports', title: 'Revenue Reports', desc: 'Daily and weekly revenue summaries', icon: CreditCardIcon },
                  { key: 'emailAlerts', title: 'Email Notifications', desc: 'Receive notifications via email', icon: BellIcon },
                  { key: 'smsAlerts', title: 'SMS Alerts', desc: 'Text messages for critical alerts', icon: DevicePhoneMobileIcon },
                  { key: 'systemUpdates', title: 'System Updates', desc: 'Platform updates and maintenance notices', icon: CloudIcon },
                  { key: 'marketingEmails', title: 'Marketing Emails', desc: 'Product news and promotional content', icon: GlobeAltIcon }
                ].map(({ key, title, desc, icon: Icon, critical }) => (
                  <div 
                    key={key} 
                    className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                      critical ? 'bg-gold-500/5 border border-gold-500/10' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${critical ? 'bg-gold-500/10' : 'bg-midnight-800'}`}>
                        <Icon className={`w-5 h-5 ${critical ? 'text-gold-400' : 'text-text-tertiary'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-text-primary font-medium">{title}</h4>
                          {critical && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-gold-500/20 text-gold-400 rounded-full uppercase">
                              Important
                            </span>
                          )}
                        </div>
                        <p className="text-text-muted text-sm">{desc}</p>
                      </div>
                    </div>
                    <Toggle 
                      enabled={notifications[key as keyof typeof notifications]} 
                      onChange={() => handleNotificationToggle(key)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="card-premium p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">System Preferences</h2>
                <p className="text-text-secondary text-sm mt-1">Customize your ClubOps experience</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Language</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    className="input-premium w-full"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Currency</label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                    className="input-premium w-full"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Date Format</label>
                  <select
                    value={preferences.dateFormat}
                    onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                    className="input-premium w-full"
                  >
                    <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                    <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                    <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Time Format</label>
                  <select
                    value={preferences.timeFormat}
                    onChange={(e) => handlePreferenceChange('timeFormat', e.target.value)}
                    className="input-premium w-full"
                  >
                    <option value="12h">12 Hour (AM/PM)</option>
                    <option value="24h">24 Hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Auto Logout</label>
                  <select
                    value={preferences.autoLogout}
                    onChange={(e) => handlePreferenceChange('autoLogout', e.target.value)}
                    className="input-premium w-full"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="0">Never</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card-premium p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Security Settings</h2>
                  <p className="text-text-secondary text-sm mt-1">Manage your account security</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-midnight-900/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-electric-500/10">
                        <KeyIcon className="w-5 h-5 text-electric-400" />
                      </div>
                      <div>
                        <h4 className="text-text-primary font-medium">Change Password</h4>
                        <p className="text-text-muted text-sm">Last changed 30 days ago</p>
                      </div>
                    </div>
                    <button className="btn-secondary text-sm">Update</button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-midnight-900/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-success-500/10">
                        <DevicePhoneMobileIcon className="w-5 h-5 text-success-400" />
                      </div>
                      <div>
                        <h4 className="text-text-primary font-medium">Two-Factor Authentication</h4>
                        <p className="text-text-muted text-sm">Add an extra layer of security</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-success-500 hover:bg-success-400 text-white text-sm font-medium rounded-xl transition-colors">
                      Enable
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-midnight-900/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-royal-500/10">
                        <ShieldCheckIcon className="w-5 h-5 text-royal-400" />
                      </div>
                      <div>
                        <h4 className="text-text-primary font-medium">Active Sessions</h4>
                        <p className="text-text-muted text-sm">2 devices currently logged in</p>
                      </div>
                    </div>
                    <button className="btn-secondary text-sm">Manage</button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-6 bg-danger-500/5 border border-danger-500/20 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-danger-500/10">
                    <ExclamationTriangleIcon className="w-5 h-5 text-danger-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-danger-400 font-semibold">Danger Zone</h3>
                    <p className="text-danger-400/70 text-sm mt-1">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-danger-500 hover:bg-danger-400 text-white text-sm font-medium rounded-xl transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="card-premium p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Integrations</h2>
                <p className="text-text-secondary text-sm mt-1">Connect external services and tools</p>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Stripe', desc: 'Payment processing', status: 'connected', icon: '💳' },
                  { name: 'QuickBooks', desc: 'Accounting software', status: 'available', icon: '📊' },
                  { name: 'Google Calendar', desc: 'Schedule sync', status: 'available', icon: '📅' },
                  { name: 'Slack', desc: 'Team notifications', status: 'available', icon: '💬' }
                ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-4 bg-midnight-900/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-midnight-800 flex items-center justify-center text-2xl">
                        {integration.icon}
                      </div>
                      <div>
                        <h4 className="text-text-primary font-medium">{integration.name}</h4>
                        <p className="text-text-muted text-sm">{integration.desc}</p>
                      </div>
                    </div>
                    {integration.status === 'connected' ? (
                      <div className="flex items-center gap-2">
                        <span className="badge-success">Connected</span>
                        <button className="btn-ghost text-sm">Configure</button>
                      </div>
                    ) : (
                      <button className="btn-secondary text-sm">Connect</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="card-premium p-6 space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Appearance</h2>
                <p className="text-text-secondary text-sm mt-1">Customize the look and feel</p>
              </div>

              <div>
                <h3 className="text-text-primary font-medium mb-4">Theme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 border-2 border-gold-500/50 bg-gold-500/5 rounded-xl text-left transition-all hover:border-gold-500">
                    <div className="w-full h-16 bg-gradient-to-br from-midnight-950 to-midnight-900 rounded-lg mb-3 ring-2 ring-gold-500/30" />
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-text-primary font-medium">Midnight Luxe</h4>
                        <p className="text-text-muted text-xs">Current theme</p>
                      </div>
                      <CheckIcon className="w-5 h-5 text-gold-400" />
                    </div>
                  </button>

                  <button className="p-4 border border-white/10 rounded-xl text-left opacity-60 cursor-not-allowed">
                    <div className="w-full h-16 bg-gradient-to-br from-zinc-100 to-zinc-200 rounded-lg mb-3" />
                    <h4 className="text-text-primary font-medium">Light Mode</h4>
                    <p className="text-text-muted text-xs">Coming soon</p>
                  </button>

                  <button className="p-4 border border-white/10 rounded-xl text-left opacity-60 cursor-not-allowed">
                    <div className="w-full h-16 bg-gradient-to-r from-midnight-950 via-zinc-600 to-zinc-100 rounded-lg mb-3" />
                    <h4 className="text-text-primary font-medium">Auto</h4>
                    <p className="text-text-muted text-xs">System preference</p>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-text-primary font-medium mb-4">Accent Color</h3>
                <div className="flex gap-3">
                  {[
                    { color: 'bg-gold-500', name: 'Gold', active: true },
                    { color: 'bg-electric-500', name: 'Cyan' },
                    { color: 'bg-royal-500', name: 'Purple' },
                    { color: 'bg-danger-500', name: 'Red' },
                    { color: 'bg-success-500', name: 'Green' }
                  ].map((accent) => (
                    <button
                      key={accent.name}
                      className={`w-10 h-10 rounded-xl ${accent.color} transition-transform hover:scale-110 ${
                        accent.active ? 'ring-2 ring-white ring-offset-2 ring-offset-midnight-950' : ''
                      }`}
                      title={accent.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-text-primary font-medium mb-4">Display Density</h3>
                <div className="flex gap-3">
                  <button className="flex-1 p-4 border border-white/10 rounded-xl text-center hover:bg-white/5 transition-colors">
                    <span className="text-text-primary font-medium">Comfortable</span>
                  </button>
                  <button className="flex-1 p-4 border-2 border-gold-500/50 bg-gold-500/5 rounded-xl text-center">
                    <span className="text-gold-400 font-medium">Default</span>
                  </button>
                  <button className="flex-1 p-4 border border-white/10 rounded-xl text-center hover:bg-white/5 transition-colors">
                    <span className="text-text-primary font-medium">Compact</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
