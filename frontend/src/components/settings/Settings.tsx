import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store/store'
import { updateUser } from '../../store/slices/authSlice'
import {
  UserCircleIcon,
  BellIcon,
  CogIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  LanguageIcon,
  DevicePhoneMobileIcon,
  KeyIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

const Settings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState({
    ownerName: user?.ownerName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    clubName: user?.clubName || '',
    address: '',
    timezone: 'America/New_York'
  })
  
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    systemUpdates: true,
    marketingEmails: false,
    complianceAlerts: true,
    revenueReports: true
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
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'preferences', name: 'Preferences', icon: CogIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon }
  ]

  const handleProfileSave = () => {
    dispatch(updateUser(profileData))
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">
            Manage your account preferences and club settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
                  <p className="text-gray-400 text-sm">Update your account details and club information.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.ownerName}
                      onChange={(e) => setProfileData({...profileData, ownerName: e.target.value})}
                      className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phoneNumber}
                      onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                      className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Club Name
                    </label>
                    <input
                      type="text"
                      value={profileData.clubName}
                      onChange={(e) => setProfileData({...profileData, clubName: e.target.value})}
                      className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Club Address
                    </label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                      placeholder="123 Main St, City, State 12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Timezone
                    </label>
                    <select
                      value={profileData.timezone}
                      onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
                      className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileSave}
                    className="bg-gradient-to-r from-accent-blue to-accent-gold hover:from-accent-gold hover:to-accent-blue text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Notification Preferences</h2>
                  <p className="text-gray-400 text-sm">Choose how you want to receive notifications from ClubOps.</p>
                </div>

                <div className="space-y-6">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-dark-bg/30 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {key === 'emailAlerts' && 'Get email notifications for important events'}
                          {key === 'smsAlerts' && 'Receive SMS alerts for critical issues'}
                          {key === 'systemUpdates' && 'Stay informed about system updates and maintenance'}
                          {key === 'marketingEmails' && 'Receive promotional content and product updates'}
                          {key === 'complianceAlerts' && 'Get notified about compliance and license issues'}
                          {key === 'revenueReports' && 'Receive daily and weekly revenue reports'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle(key)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 ${
                          value ? 'bg-accent-blue' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            value ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">System Preferences</h2>
                  <p className="text-gray-400 text-sm">Customize your ClubOps experience.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <LanguageIcon className="h-4 w-4 inline mr-2" />
                      Language
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Currency
                    </label>
                    <select
                      value={preferences.currency}
                      onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                      className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date Format
                    </label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                      className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    >
                      <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                      <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                      <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Time Format
                    </label>
                    <select
                      value={preferences.timeFormat}
                      onChange={(e) => handlePreferenceChange('timeFormat', e.target.value)}
                      className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    >
                      <option value="12h">12 Hour</option>
                      <option value="24h">24 Hour</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Auto Logout (minutes)
                    </label>
                    <select
                      value={preferences.autoLogout}
                      onChange={(e) => handlePreferenceChange('autoLogout', e.target.value)}
                      className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-blue"
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
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Security Settings</h2>
                  <p className="text-gray-400 text-sm">Manage your account security and authentication.</p>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-dark-bg/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium flex items-center">
                          <KeyIcon className="h-4 w-4 mr-2" />
                          Change Password
                        </h4>
                        <p className="text-gray-400 text-sm">Update your account password</p>
                      </div>
                      <button className="bg-accent-blue hover:bg-accent-gold text-white font-medium px-4 py-2 rounded-lg transition-colors">
                        Update
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-dark-bg/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium flex items-center">
                          <DevicePhoneMobileIcon className="h-4 w-4 mr-2" />
                          Two-Factor Authentication
                        </h4>
                        <p className="text-gray-400 text-sm">Add an extra layer of security</p>
                      </div>
                      <button className="bg-green-600 hover:bg-green-500 text-white font-medium px-4 py-2 rounded-lg transition-colors">
                        Enable
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-dark-bg/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">Active Sessions</h4>
                        <p className="text-gray-400 text-sm">Manage your logged-in devices</p>
                      </div>
                      <button className="bg-gray-600 hover:bg-gray-500 text-white font-medium px-4 py-2 rounded-lg transition-colors">
                        View All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Appearance Settings</h2>
                  <p className="text-gray-400 text-sm">Customize the look and feel of ClubOps.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-medium mb-4">Theme</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        preferences.theme === 'dark' ? 'border-accent-blue bg-accent-blue/10' : 'border-white/20'
                      }`}>
                        <div className="w-full h-20 bg-gradient-to-br from-gray-900 to-black rounded mb-3"></div>
                        <h5 className="text-white font-medium">Dark Theme</h5>
                        <p className="text-gray-400 text-sm">Current premium theme</p>
                      </div>

                      <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors opacity-50 ${
                        preferences.theme === 'light' ? 'border-accent-blue bg-accent-blue/10' : 'border-white/20'
                      }`}>
                        <div className="w-full h-20 bg-gradient-to-br from-white to-gray-100 rounded mb-3"></div>
                        <h5 className="text-white font-medium">Light Theme</h5>
                        <p className="text-gray-400 text-sm">Coming soon</p>
                      </div>

                      <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors opacity-50 ${
                        preferences.theme === 'auto' ? 'border-accent-blue bg-accent-blue/10' : 'border-white/20'
                      }`}>
                        <div className="w-full h-20 bg-gradient-to-r from-gray-900 via-gray-600 to-white rounded mb-3"></div>
                        <h5 className="text-white font-medium">Auto Theme</h5>
                        <p className="text-gray-400 text-sm">System preference</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-4">Accent Colors</h4>
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 rounded-full bg-accent-blue border-2 border-white cursor-pointer"></div>
                      <div className="w-8 h-8 rounded-full bg-accent-gold border border-white/20 cursor-pointer"></div>
                      <div className="w-8 h-8 rounded-full bg-accent-red border border-white/20 cursor-pointer"></div>
                      <div className="w-8 h-8 rounded-full bg-green-500 border border-white/20 cursor-pointer"></div>
                      <div className="w-8 h-8 rounded-full bg-purple-500 border border-white/20 cursor-pointer"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-300 font-semibold flex items-center">
              <TrashIcon className="h-5 w-5 mr-2" />
              Danger Zone
            </h3>
            <p className="text-red-400/70 text-sm mt-1">
              Permanently delete your account and all associated data
            </p>
          </div>
          <button className="bg-red-600 hover:bg-red-500 text-white font-medium px-6 py-2 rounded-lg transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings