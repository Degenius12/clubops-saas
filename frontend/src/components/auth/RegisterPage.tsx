import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { AppDispatch, RootState } from '../../store/store'
import { registerUser } from '../../store/slices/authSlice'
import { EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline'

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    clubName: '',
    ownerName: '',
    phoneNumber: '',
    agreeToTerms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state: RootState) => state.auth)

  const passwordStrengthCheck = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  }

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwordsMatch) {
      return
    }

    try {
      const result = await dispatch(registerUser({
        email: formData.email,
        password: formData.password,
        clubName: formData.clubName,
        ownerName: formData.ownerName,
        phoneNumber: formData.phoneNumber
      }))
      
      if (registerUser.fulfilled.match(result)) {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Registration failed:', error)
    }
  }

  const isFormValid = formData.email && 
                     formData.password && 
                     formData.confirmPassword && 
                     formData.clubName && 
                     formData.ownerName && 
                     formData.agreeToTerms && 
                     passwordsMatch &&
                     Object.values(passwordStrengthCheck).every(Boolean)

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Create Your Account</h2>
        <p className="text-gray-400">Start your premium club management journey</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Owner Name */}
        <div>
          <label htmlFor="ownerName" className="block text-sm font-medium text-gray-300 mb-2">
            Your Full Name
          </label>
          <input
            id="ownerName"
            name="ownerName"
            type="text"
            required
            value={formData.ownerName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-200"
            placeholder="John Smith"
          />
        </div>

        {/* Club Name */}
        <div>
          <label htmlFor="clubName" className="block text-sm font-medium text-gray-300 mb-2">
            Club Name
          </label>
          <input
            id="clubName"
            name="clubName"
            type="text"
            required
            value={formData.clubName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-200"
            placeholder="Platinum Lounge"
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-200"
              placeholder="john@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-200"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-200 pr-12"
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {/* Password Strength Indicators */}
          {formData.password && (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(passwordStrengthCheck).map(([key, isValid]) => (
                  <div key={key} className={`flex items-center space-x-1 ${isValid ? 'text-green-400' : 'text-gray-400'}`}>
                    <CheckIcon className={`h-3 w-3 ${isValid ? 'opacity-100' : 'opacity-30'}`} />
                    <span>
                      {key === 'length' && '8+ characters'}
                      {key === 'uppercase' && 'Uppercase'}
                      {key === 'lowercase' && 'Lowercase'}
                      {key === 'number' && 'Number'}
                      {key === 'special' && 'Special char'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-dark-bg/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 pr-12 ${
                formData.confirmPassword && !passwordsMatch 
                  ? 'border-red-500 focus:ring-red-500' 
                  : passwordsMatch 
                    ? 'border-green-500 focus:ring-green-500' 
                    : 'border-white/20 focus:ring-accent-blue'
              }`}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {formData.confirmPassword && !passwordsMatch && (
            <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
          )}
          {passwordsMatch && (
            <p className="mt-1 text-xs text-green-400">Passwords match!</p>
          )}
        </div>

        {/* Terms Agreement */}
        <div className="flex items-start space-x-3 py-2">
          <input
            id="agreeToTerms"
            name="agreeToTerms"
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={handleInputChange}
            className="mt-1 w-4 h-4 bg-dark-bg/50 border border-white/20 rounded focus:ring-accent-blue focus:ring-2 text-accent-blue"
          />
          <label htmlFor="agreeToTerms" className="text-sm text-gray-300 leading-5">
            I agree to the{' '}
            <Link to="/terms" className="text-accent-blue hover:text-accent-gold transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-accent-blue hover:text-accent-gold transition-colors">
              Privacy Policy
            </Link>
          </label>
        </div>

        {/* Create Account Button */}
        <button
          type="submit"
          disabled={loading || !isFormValid}
          className={`w-full font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
            isFormValid
              ? 'bg-gradient-to-r from-accent-blue to-accent-gold hover:from-accent-gold hover:to-accent-blue hover:scale-105'
              : 'bg-gray-600'
          } text-white`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Creating account...</span>
            </div>
          ) : (
            'Create Account'
          )}
        </button>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-accent-gold hover:text-accent-blue transition-colors font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}

export default RegisterPage