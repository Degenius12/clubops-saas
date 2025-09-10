import React, { useState, useRef, useCallback } from 'react'
import { Camera, CameraOff, Upload, UserCheck, UserX, AlertTriangle, CreditCard } from 'lucide-react'
import Webcam from 'react-webcam'
import Tesseract from 'tesseract.js'
import { toast } from 'react-hot-toast'

interface IDData {
  firstName: string
  lastName: string
  dateOfBirth: string
  licenseNumber: string
  address: string
  state: string
  expirationDate: string
  photo?: string
}

interface Customer {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  licenseNumber: string
  lastVisit: string
  status: 'active' | 'banned' | 'flagged'
  photo?: string
  incidents: number
  totalSpent: number
}

const FrontDoor: React.FC = () => {
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<Partial<IDData> | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [entranceFee, setEntranceFee] = useState(25.00)
  const [showPOS, setShowPOS] = useState(false)
  const [scanMode, setScanMode] = useState<'id' | 'license'>('id')
  
  const webcamRef = useRef<Webcam>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
  }

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setCapturedImage(imageSrc)
      setIsWebcamActive(false)
      processImage(imageSrc)
    }
  }, [webcamRef])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string
        setCapturedImage(imageSrc)
        processImage(imageSrc)
      }
      reader.readAsDataURL(file)
    }
  }

  const processImage = async (imageSrc: string) => {
    setIsProcessing(true)
    toast.loading('Processing ID/License...', { id: 'processing' })
    
    try {
      const { data: { text } } = await Tesseract.recognize(imageSrc, 'eng', {
        logger: m => console.log(m)
      })
      
      console.log('OCR Result:', text)
      const parsedData = parseIDText(text)
      setExtractedData(parsedData)
      
      // Simulate customer lookup
      setTimeout(() => {
        const foundCustomer = lookupCustomer(parsedData.licenseNumber || '')
        setCustomer(foundCustomer)
        toast.success('ID processed successfully!', { id: 'processing' })
      }, 1000)
      
    } catch (error) {
      console.error('OCR Error:', error)
      toast.error('Failed to process ID. Please try again.', { id: 'processing' })
    } finally {
      setIsProcessing(false)
    }
  }

  const parseIDText = (text: string): Partial<IDData> => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line)
    const data: Partial<IDData> = {}
    
    // Enhanced parsing logic for common ID formats
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toUpperCase()
      
      // Date of Birth patterns
      if (line.includes('DOB') || line.includes('DATE OF BIRTH')) {
        const dateMatch = lines[i + 1]?.match(/(\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})/)
        if (dateMatch) data.dateOfBirth = dateMatch[1]
      }
      
      // License number patterns
      if (line.includes('LIC') || line.includes('LICENSE') || line.includes('ID')) {
        const licMatch = lines[i + 1]?.match(/([A-Z0-9]{6,15})/)
        if (licMatch) data.licenseNumber = licMatch[1]
      }
      
      // Name patterns - typically the largest text or after specific keywords
      if (line.includes('LAST NAME') || line.includes('LN')) {
        data.lastName = lines[i + 1]?.replace(/[^A-Z\s]/g, '').trim()
      }
      if (line.includes('FIRST NAME') || line.includes('FN')) {
        data.firstName = lines[i + 1]?.replace(/[^A-Z\s]/g, '').trim()
      }
      
      // Expiration date
      if (line.includes('EXP') || line.includes('EXPIRES')) {
        const expMatch = lines[i + 1]?.match(/(\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})/)
        if (expMatch) data.expirationDate = expMatch[1]
      }
      
      // Address
      if (line.includes('ADDRESS') || line.includes('ADDR')) {
        data.address = lines[i + 1]?.trim()
      }
    }
    
    return data
  }

  const lookupCustomer = (licenseNumber: string): Customer | null => {
    // Simulate database lookup
    if (!licenseNumber) return null
    
    // Mock customer data
    return {
      id: 'cust-' + Date.now(),
      firstName: extractedData?.firstName || 'John',
      lastName: extractedData?.lastName || 'Doe',
      dateOfBirth: extractedData?.dateOfBirth || '01/01/1990',
      licenseNumber: licenseNumber,
      lastVisit: '2024-01-15',
      status: Math.random() > 0.8 ? 'banned' : 'active',
      photo: capturedImage || undefined,
      incidents: Math.floor(Math.random() * 3),
      totalSpent: Math.floor(Math.random() * 5000) + 500
    }
  }

  const handleEntry = (approved: boolean) => {
    if (approved && customer?.status === 'active') {
      setShowPOS(true)
      toast.success('Entry approved - Processing payment...')
    } else {
      toast.error('Entry denied - Customer not approved')
    }
  }

  const processPayment = async (amount: number) => {
    toast.loading('Processing payment...', { id: 'payment' })
    
    // Simulate payment processing
    setTimeout(() => {
      toast.success(`Payment of $${amount} processed successfully!`, { id: 'payment' })
      setShowPOS(false)
      resetScan()
    }, 2000)
  }

  const resetScan = () => {
    setCapturedImage(null)
    setExtractedData(null)
    setCustomer(null)
    setShowPOS(false)
    setIsWebcamActive(false)
  }

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gradient-premium">Front Door Security</h1>
            <p className="text-gray-400 mt-2">ID Scanning & Customer Management</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-dark-card p-3 rounded-lg">
              <p className="text-sm text-gray-400">Entrance Fee</p>
              <p className="text-2xl font-bold text-gold">${entranceFee}</p>
            </div>
            <button
              onClick={resetScan}
              className="btn-secondary"
            >
              New Scan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <div className="bg-dark-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">ID Scanner</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setScanMode('id')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    scanMode === 'id' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  Driver's License
                </button>
                <button
                  onClick={() => setScanMode('license')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    scanMode === 'license' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  Entertainment License
                </button>
              </div>
            </div>

            {!capturedImage && (
              <div className="space-y-4">
                {/* Webcam Interface */}
                {isWebcamActive ? (
                  <div className="relative">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      className="w-full rounded-lg"
                    />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 space-x-4">
                      <button
                        onClick={capturePhoto}
                        className="bg-gold text-dark-bg px-6 py-2 rounded-lg font-semibold hover:bg-gold/90 transition-colors"
                      >
                        Capture
                      </button>
                      <button
                        onClick={() => setIsWebcamActive(false)}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                    <div className="space-y-4">
                      <button
                        onClick={() => setIsWebcamActive(true)}
                        className="flex items-center justify-center space-x-2 mx-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Camera size={20} />
                        <span>Start Camera</span>
                      </button>
                      
                      <div className="text-gray-400">or</div>
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center space-x-2 mx-auto bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Upload size={20} />
                        <span>Upload Image</span>
                      </button>
                      
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

            {/* Captured Image */}
            {capturedImage && (
              <div className="space-y-4">
                <img
                  src={capturedImage}
                  alt="Captured ID"
                  className="w-full rounded-lg border border-gray-600"
                />
                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto"></div>
                    <p className="text-gray-400 mt-2">Processing ID...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Customer Information Section */}
          <div className="bg-dark-card rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-6">Customer Information</h2>
            
            {extractedData && (
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-medium text-gold">Extracted Data</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">First Name</p>
                    <p className="text-white">{extractedData.firstName || 'Not found'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Last Name</p>
                    <p className="text-white">{extractedData.lastName || 'Not found'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Date of Birth</p>
                    <p className="text-white">{extractedData.dateOfBirth || 'Not found'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">License #</p>
                    <p className="text-white">{extractedData.licenseNumber || 'Not found'}</p>
                  </div>
                </div>
              </div>
            )}

            {customer && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gold">Customer Status</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    customer.status === 'active' ? 'bg-green-600 text-white' :
                    customer.status === 'banned' ? 'bg-red-600 text-white' :
                    'bg-yellow-600 text-black'
                  }`}>
                    {customer.status.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Name</p>
                    <p className="text-white">{customer.firstName} {customer.lastName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Last Visit</p>
                    <p className="text-white">{customer.lastVisit}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Incidents</p>
                    <p className="text-white">{customer.incidents}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Spent</p>
                    <p className="text-white">${customer.totalSpent}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => handleEntry(true)}
                    disabled={customer.status !== 'active'}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                      customer.status === 'active'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <UserCheck size={20} />
                    <span>Approve Entry</span>
                  </button>
                  
                  <button
                    onClick={() => handleEntry(false)}
                    className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    <UserX size={20} />
                    <span>Deny Entry</span>
                  </button>
                </div>

                {customer.status === 'banned' && (
                  <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mt-4">
                    <div className="flex items-center space-x-2 text-red-400">
                      <AlertTriangle size={20} />
                      <span className="font-semibold">BANNED CUSTOMER</span>
                    </div>
                    <p className="text-red-300 mt-2">This customer is not permitted entry. Contact management.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* POS System Modal */}
        {showPOS && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
            <div className="bg-dark-card rounded-xl p-8 max-w-md w-full mx-4">
              <div className="flex items-center space-x-2 mb-6">
                <CreditCard className="text-gold" size={24} />
                <h3 className="text-2xl font-semibold">Process Payment</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Entrance Fee</span>
                  <span className="text-2xl font-bold text-gold">${entranceFee}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => processPayment(entranceFee)}
                    className="bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Cash Payment
                  </button>
                  <button
                    onClick={() => processPayment(entranceFee)}
                    className="bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Card Payment
                  </button>
                </div>
                
                <button
                  onClick={() => setShowPOS(false)}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FrontDoor