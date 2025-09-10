import React, { useState, useRef, useCallback } from 'react'
import { Camera, Upload, Brain, AlertTriangle, FileText, Users } from 'lucide-react'
import Webcam from 'react-webcam'
import Tesseract from 'tesseract.js'
import { toast } from 'react-hot-toast'

interface EnhancedIDData {
  firstName: string
  lastName: string
  dateOfBirth: string
  licenseNumber: string
  address: string
  state: string
  expirationDate: string
  photo?: string
  confidence: number
  idType: 'drivers_license' | 'entertainment_license' | 'state_id' | 'unknown'
}

interface CustomerRecord {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  licenseNumber: string
  lastVisit: string
  status: 'active' | 'banned' | 'flagged' | 'vip'
  photo?: string
  incidents: Incident[]
  totalSpent: number
  visits: number
  notes: string
  entertainmentLicense?: {
    number: string
    expirationDate: string
    isActive: boolean
  }
}

interface Incident {
  id: string
  date: string
  type: 'altercation' | 'violation' | 'complaint' | 'banned' | 'warning'
  description: string
  reportedBy: string
  severity: 'low' | 'medium' | 'high'
  photos?: string[]
  resolved: boolean
}

const EnhancedIDScanner: React.FC = () => {
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<Partial<EnhancedIDData> | null>(null)
  const [customer, setCustomer] = useState<CustomerRecord | null>(null)
  const [showIncidentReport, setShowIncidentReport] = useState(false)
  const [incidentData, setIncidentData] = useState<Partial<Incident>>({
    type: 'violation',
    severity: 'medium'
  })
  
  const webcamRef = useRef<Webcam>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const videoConstraints = {
    width: 1920,
    height: 1080,
    facingMode: "user"
  }

  // Enhanced OCR processing with multiple parsing strategies
  const processImageAdvanced = async (imageSrc: string) => {
    setIsProcessing(true)
    toast.loading('AI Processing ID with enhanced recognition...', { id: 'processing' })
    
    try {
      // Use higher quality OCR settings
      const { data: { text, confidence } } = await Tesseract.recognize(imageSrc, 'eng', {
        logger: (m: any) => console.log(m),
      })
      
      console.log('Enhanced OCR Result:', text, 'Confidence:', confidence)
      
      // Try multiple parsing strategies
      const parsedData = await parseIDTextAdvanced(text, imageSrc)
      parsedData.confidence = confidence
      
      setExtractedData(parsedData)
      
      // Enhanced customer lookup with fuzzy matching
      setTimeout(() => {
        const foundCustomer = lookupCustomerAdvanced(parsedData)
        setCustomer(foundCustomer)
        
        if (foundCustomer?.status === 'banned') {
          toast.error('🚨 BANNED CUSTOMER DETECTED!', { id: 'processing', duration: 5000 })
        } else {
          toast.success(`ID processed! Confidence: ${Math.round(confidence)}%`, { id: 'processing' })
        }
      }, 1000)
      
    } catch (error) {
      console.error('Enhanced OCR Error:', error)
      toast.error('AI processing failed. Please try again with better lighting.', { id: 'processing' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Advanced ID parsing with pattern recognition
  const parseIDTextAdvanced = async (text: string, imageSrc: string): Promise<Partial<EnhancedIDData>> => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line)
    const data: Partial<EnhancedIDData> = { idType: 'unknown' }
    
    // Detect ID type first
    const fullText = text.toUpperCase()
    if (fullText.includes('DRIVER') || fullText.includes('LICENSE')) {
      data.idType = 'drivers_license'
    } else if (fullText.includes('ENTERTAINMENT') || fullText.includes('DANCER')) {
      data.idType = 'entertainment_license'
    } else if (fullText.includes('IDENTIFICATION') || fullText.includes('ID CARD')) {
      data.idType = 'state_id'
    }

    // Enhanced parsing patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toUpperCase()
      const nextLine = lines[i + 1] || ''
      const prevLine = lines[i - 1] || ''
      
      // More robust date patterns
      const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/
      
      // Date of Birth - multiple patterns
      if ((line.includes('DOB') || line.includes('DATE OF BIRTH') || line.includes('BIRTH')) && !data.dateOfBirth) {
        const dateMatch = nextLine.match(datePattern) || line.match(datePattern)
        if (dateMatch) data.dateOfBirth = standardizeDate(dateMatch[1])
      }
      
      // License/ID number - enhanced patterns
      if ((line.includes('LIC') || line.includes('LICENSE') || line.includes('ID') || line.includes('NUMBER')) && !data.licenseNumber) {
        const licPattern = /([A-Z0-9]{4,20})/
        const licMatch = nextLine.match(licPattern) || line.match(licPattern)
        if (licMatch && licMatch[1].length >= 4) {
          data.licenseNumber = licMatch[1]
        }
      }
      
      // Name extraction - look for name patterns
      if ((line.includes('LAST') || line.includes('LN') || line.includes('SURNAME')) && !data.lastName) {
        const nameMatch = nextLine.match(/([A-Z][A-Z\s]{1,20})/)
        if (nameMatch) data.lastName = nameMatch[1].trim()
      }
      
      if ((line.includes('FIRST') || line.includes('FN') || line.includes('GIVEN')) && !data.firstName) {
        const nameMatch = nextLine.match(/([A-Z][A-Z\s]{1,20})/)
        if (nameMatch) data.firstName = nameMatch[1].trim()
      }
      
      // If no explicit name fields, try to extract from common positions
      if (!data.firstName && !data.lastName && i < 3) {
        const nameMatch = line.match(/^([A-Z][A-Z\s]+)$/)
        if (nameMatch && nameMatch[1].length > 3) {
          const nameParts = nameMatch[1].split(/\s+/)
          if (nameParts.length >= 2) {
            data.firstName = nameParts[0]
            data.lastName = nameParts.slice(1).join(' ')
          }
        }
      }
      
      // Expiration date
      if ((line.includes('EXP') || line.includes('EXPIRES')) && !data.expirationDate) {
        const dateMatch = nextLine.match(datePattern) || line.match(datePattern)
        if (dateMatch) data.expirationDate = standardizeDate(dateMatch[1])
      }
      
      // Address
      if (line.includes('ADDRESS') || line.includes('ADDR')) {
        data.address = nextLine.trim()
      }
      
      // State
      if (line.includes('STATE') || line.includes('ST')) {
        const stateMatch = nextLine.match(/([A-Z]{2,20})/)
        if (stateMatch) data.state = stateMatch[1]
      }
    }
    
    return data
  }

  const standardizeDate = (dateStr: string): string => {
    // Convert various date formats to MM/DD/YYYY
    const cleanDate = dateStr.replace(/[^\d\/\-]/g, '')
    if (cleanDate.match(/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/)) {
      // YYYY-MM-DD to MM/DD/YYYY
      const parts = cleanDate.split(/[\/\-]/)
      return `${parts[1].padStart(2, '0')}/${parts[2].padStart(2, '0')}/${parts[0]}`
    }
    return cleanDate.replace(/-/g, '/')
  }

  // Enhanced customer lookup with fuzzy matching and comprehensive records
  const lookupCustomerAdvanced = (idData: Partial<EnhancedIDData>): CustomerRecord | null => {
    if (!idData.licenseNumber && !idData.firstName) return null
    
    // Simulate enhanced database lookup with full customer profile
    return {
      id: 'cust-' + Date.now(),
      firstName: idData.firstName || 'John',
      lastName: idData.lastName || 'Doe',
      dateOfBirth: idData.dateOfBirth || '01/01/1990',
      licenseNumber: idData.licenseNumber || 'UNKNOWN',
      lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: Math.random() > 0.9 ? 'banned' : Math.random() > 0.8 ? 'flagged' : Math.random() > 0.95 ? 'vip' : 'active',
      photo: capturedImage || undefined,
      visits: Math.floor(Math.random() * 50) + 1,
      totalSpent: Math.floor(Math.random() * 10000) + 500,
      notes: 'Regular customer, prefers VIP Room 2',
      incidents: generateMockIncidents(),
      entertainmentLicense: idData.idType === 'entertainment_license' ? {
        number: idData.licenseNumber || 'ENT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        expirationDate: idData.expirationDate || '12/31/2024',
        isActive: Math.random() > 0.1
      } : undefined
    }
  }

  const generateMockIncidents = (): Incident[] => {
    const incidents: Incident[] = []
    const incidentCount = Math.floor(Math.random() * 3)
    
    for (let i = 0; i < incidentCount; i++) {
      incidents.push({
        id: 'inc-' + Date.now() + i,
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        type: ['altercation', 'violation', 'complaint', 'warning'][Math.floor(Math.random() * 4)] as any,
        description: 'Previous incident details...',
        reportedBy: 'Security Team',
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        resolved: Math.random() > 0.3
      })
    }
    
    return incidents
  }

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot({
      width: 1920,
      height: 1080
    })
    if (imageSrc) {
      setCapturedImage(imageSrc)
      setIsWebcamActive(false)
      processImageAdvanced(imageSrc)
    }
  }, [webcamRef])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string
        setCapturedImage(imageSrc)
        processImageAdvanced(imageSrc)
      }
      reader.readAsDataURL(file)
    }
  }

  const submitIncidentReport = async () => {
    if (!customer || !incidentData.type || !incidentData.description) {
      toast.error('Please fill in all required incident details')
      return
    }

    const incident: Incident = {
      id: 'inc-' + Date.now(),
      date: new Date().toLocaleDateString(),
      type: incidentData.type!,
      description: incidentData.description!,
      reportedBy: 'Front Door Security',
      severity: incidentData.severity!,
      photos: capturedImage ? [capturedImage] : [],
      resolved: false
    }

    // Add to customer's incident history
    if (customer) {
      customer.incidents.push(incident)
      
      // Auto-flag customer if multiple incidents
      if (customer.incidents.length >= 2) {
        customer.status = 'flagged'
      }
      
      setCustomer({ ...customer })
    }

    toast.success('Incident report submitted successfully')
    setShowIncidentReport(false)
    setIncidentData({ type: 'violation', severity: 'medium' })
  }

  const resetScan = () => {
    setCapturedImage(null)
    setExtractedData(null)
    setCustomer(null)
    setIsWebcamActive(false)
    setShowIncidentReport(false)
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Scanner Interface */}
      <div className="bg-dark-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="text-gold" size={24} />
            <h2 className="text-2xl font-semibold">AI-Enhanced ID Scanner</h2>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>AI Recognition Active</span>
          </div>
        </div>

        {!capturedImage && (
          <div className="space-y-4">
            {isWebcamActive ? (
              <div className="relative">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full rounded-lg border-2 border-gold/30"
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 space-x-4">
                  <button
                    onClick={capturePhoto}
                    className="bg-gold text-dark-bg px-8 py-3 rounded-lg font-semibold hover:bg-gold/90 transition-colors shadow-lg"
                  >
                    <Camera size={20} className="inline mr-2" />
                    Capture & Analyze
                  </button>
                  <button
                    onClick={() => setIsWebcamActive(false)}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gold/30 rounded-lg p-12 text-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="space-y-6">
                  <div className="text-gold text-6xl">📷</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">AI-Powered ID Recognition</h3>
                    <p className="text-gray-400 mb-6">Advanced OCR with entertainment license support</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => setIsWebcamActive(true)}
                      className="flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                    >
                      <Camera size={24} />
                      <span className="font-semibold">Start Camera Scan</span>
                    </button>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center space-x-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-4 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg"
                    >
                      <Upload size={24} />
                      <span className="font-semibold">Upload Image</span>
                    </button>
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Captured Image with Processing Status */}
        {capturedImage && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured ID"
                className="w-full rounded-lg border-2 border-gold/30 shadow-lg"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gold font-semibold">AI Processing...</p>
                    <p className="text-gray-400 text-sm">Enhanced pattern recognition</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Results Display */}
      {extractedData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Extracted Data */}
          <div className="bg-dark-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gold">AI Extracted Data</h3>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-400">Confidence:</div>
                <div className={`text-sm font-bold ${
                  (extractedData.confidence || 0) > 80 ? 'text-green-400' :
                  (extractedData.confidence || 0) > 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {Math.round(extractedData.confidence || 0)}%
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 w-20">Type:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  extractedData.idType === 'drivers_license' ? 'bg-blue-600 text-white' :
                  extractedData.idType === 'entertainment_license' ? 'bg-purple-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {extractedData.idType?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['First Name', extractedData.firstName],
                  ['Last Name', extractedData.lastName],
                  ['Date of Birth', extractedData.dateOfBirth],
                  ['License #', extractedData.licenseNumber],
                  ['Expiration', extractedData.expirationDate],
                  ['State', extractedData.state]
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-gray-400">{label}</p>
                    <p className={`font-medium ${value ? 'text-white' : 'text-red-400'}`}>
                      {value || 'Not detected'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Profile */}
          {customer && (
            <div className="bg-dark-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gold">Customer Profile</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  customer.status === 'active' ? 'bg-green-600 text-white' :
                  customer.status === 'banned' ? 'bg-red-600 text-white' :
                  customer.status === 'flagged' ? 'bg-yellow-600 text-black' :
                  customer.status === 'vip' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-white'
                }`}>
                  {customer.status.toUpperCase()}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Name</p>
                    <p className="text-white font-medium">{customer.firstName} {customer.lastName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Last Visit</p>
                    <p className="text-white">{customer.lastVisit}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Visits</p>
                    <p className="text-white">{customer.visits}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Spent</p>
                    <p className="text-white">${customer.totalSpent}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Incidents</p>
                    <p className={`font-medium ${
                      customer.incidents.length === 0 ? 'text-green-400' :
                      customer.incidents.length < 2 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {customer.incidents.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">ID Type</p>
                    <p className="text-white">{extractedData?.idType?.replace('_', ' ')}</p>
                  </div>
                </div>

                {/* Entertainment License Info */}
                {customer.entertainmentLicense && (
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-purple-400 mb-2">Entertainment License</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-400">License #</p>
                        <p className="text-white">{customer.entertainmentLicense.number}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Expires</p>
                        <p className={`font-medium ${
                          customer.entertainmentLicense.isActive ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {customer.entertainmentLicense.expirationDate}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Incident History */}
                {customer.incidents.length > 0 && (
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-yellow-400 mb-2">Recent Incidents</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {customer.incidents.slice(0, 3).map((incident) => (
                        <div key={incident.id} className="bg-gray-800 p-2 rounded text-xs">
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              incident.severity === 'high' ? 'bg-red-600' :
                              incident.severity === 'medium' ? 'bg-yellow-600' : 'bg-gray-600'
                            }`}>
                              {incident.type}
                            </span>
                            <span className="text-gray-400">{incident.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowIncidentReport(true)}
                    className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors text-sm"
                  >
                    <FileText size={16} />
                    <span>Report Incident</span>
                  </button>
                  
                  <button
                    onClick={resetScan}
                    className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm"
                  >
                    <span>New Scan</span>
                  </button>
                </div>

                {/* Status Alerts */}
                {customer.status === 'banned' && (
                  <div className="bg-red-900/20 border border-red-600 rounded-lg p-3 mt-4">
                    <div className="flex items-center space-x-2 text-red-400">
                      <AlertTriangle size={16} />
                      <span className="font-semibold text-sm">BANNED CUSTOMER</span>
                    </div>
                    <p className="text-red-300 text-xs mt-1">Entry denied. Contact management immediately.</p>
                  </div>
                )}

                {customer.status === 'flagged' && (
                  <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3 mt-4">
                    <div className="flex items-center space-x-2 text-yellow-400">
                      <AlertTriangle size={16} />
                      <span className="font-semibold text-sm">FLAGGED CUSTOMER</span>
                    </div>
                    <p className="text-yellow-300 text-xs mt-1">Multiple incidents on record. Monitor closely.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Incident Report Modal */}
      {showIncidentReport && customer && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-dark-card rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center space-x-2 mb-6">
              <FileText className="text-orange-400" size={24} />
              <h3 className="text-xl font-semibold">Create Incident Report</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Customer</label>
                <div className="bg-gray-800 p-2 rounded">
                  {customer.firstName} {customer.lastName} ({customer.licenseNumber})
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Incident Type</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2"
                    value={incidentData.type}
                    onChange={(e) => setIncidentData({
                      ...incidentData,
                      type: e.target.value as any
                    })}
                  >
                    <option value="violation">Policy Violation</option>
                    <option value="altercation">Altercation</option>
                    <option value="complaint">Complaint</option>
                    <option value="warning">Warning Issued</option>
                    <option value="banned">Banned from Premises</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Severity</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2"
                    value={incidentData.severity}
                    onChange={(e) => setIncidentData({
                      ...incidentData,
                      severity: e.target.value as any
                    })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 h-24"
                  placeholder="Detailed description of the incident..."
                  value={incidentData.description || ''}
                  onChange={(e) => setIncidentData({
                    ...incidentData,
                    description: e.target.value
                  })}
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={submitIncidentReport}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  Submit Report
                </button>
                <button
                  onClick={() => setShowIncidentReport(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedIDScanner