import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User, FileText, Shield, CheckCircle, AlertCircle,
  ChevronRight, ChevronLeft, Loader2
} from 'lucide-react';
import { FileUpload } from '../ui/FileUpload';
import { SignatureCanvas } from '../ui/SignatureCanvas';

interface OnboardingStep {
  id: number;
  title: string;
  icon: React.ReactNode;
  description: string;
}

interface StateRequirements {
  name: string;
  requiresEntertainerLicense: boolean;
  licensingAuthority?: string;
  minimumAge: number;
  requiredDocuments: string[];
  notes?: string;
}

interface DocumentProgress {
  documentType: string;
  status: string;
  isComplete: boolean;
}

interface OnboardingProgress {
  onboardingStatus: string;
  documents: {
    total: number;
    approved: number;
    progress: DocumentProgress[];
  };
  contract: {
    hasSigned: boolean;
  };
  ageVerification: {
    isVerified: boolean;
    minimumAge: number;
  };
  isComplete: boolean;
}

export function EntertainerOnboarding(): JSX.Element {
  const navigate = useNavigate();
  const { entertainerId } = useParams<{ entertainerId: string }>();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // State requirements
  const [requirements, setRequirements] = useState<StateRequirements | null>(null);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);

  // Form data
  const [basicInfo, setBasicInfo] = useState({
    legalName: '',
    stageName: '',
    dateOfBirth: '',
    phone: '',
    email: ''
  });

  const [uploadedDocs, setUploadedDocs] = useState<{[key: string]: File}>({});
  const [contractType, setContractType] = useState<'INDEPENDENT_CONTRACTOR_1099' | 'EMPLOYEE_W2'>('INDEPENDENT_CONTRACTOR_1099');
  const [signature, setSignature] = useState<string | null>(null);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Basic Information',
      icon: <User className="w-6 h-6" />,
      description: 'Personal details and contact information'
    },
    {
      id: 2,
      title: 'ID Verification',
      icon: <Shield className="w-6 h-6" />,
      description: 'Government ID and photo verification'
    },
    {
      id: 3,
      title: 'License Upload',
      icon: <FileText className="w-6 h-6" />,
      description: 'Entertainer license (if required)'
    },
    {
      id: 4,
      title: 'Contract Signing',
      icon: <FileText className="w-6 h-6" />,
      description: 'Review and sign employment agreement'
    },
    {
      id: 5,
      title: 'Completion',
      icon: <CheckCircle className="w-6 h-6" />,
      description: 'Finalize onboarding'
    }
  ];

  useEffect(() => {
    loadOnboardingData();
  }, [entertainerId]);

  const loadOnboardingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Get state requirements
      const reqResponse = await fetch('/api/onboarding/requirements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!reqResponse.ok) {
        throw new Error('Failed to load requirements');
      }

      const reqData = await reqResponse.json();
      setRequirements(reqData.requirements);

      // Get progress if entertainer ID exists
      if (entertainerId) {
        const progressResponse = await fetch(`/api/onboarding/${entertainerId}/progress`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setProgress(progressData.progress);

          // If already completed, show completion screen
          if (progressData.progress.isComplete) {
            setCurrentStep(5);
            setSuccess(true);
          }
        }
      }

    } catch (err) {
      console.error('Failed to load onboarding data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load onboarding data');
    } finally {
      setLoading(false);
    }
  };

  const handleBasicInfoChange = (field: string, value: string) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateBasicInfo = (): boolean => {
    if (!basicInfo.legalName || !basicInfo.stageName || !basicInfo.dateOfBirth) {
      setError('Please fill in all required fields');
      return false;
    }

    // Validate age
    const birthDate = new Date(basicInfo.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (requirements && age < requirements.minimumAge) {
      setError(`Must be at least ${requirements.minimumAge} years old`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (documentType: string, file: File) => {
    setUploadedDocs(prev => ({ ...prev, [documentType]: file }));
  };

  const uploadDocument = async (documentType: string, file: File) => {
    const token = localStorage.getItem('token');
    if (!token || !entertainerId) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('entertainerId', entertainerId);
    formData.append('documentType', documentType);

    const response = await fetch('/api/compliance/documents/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${documentType}`);
    }

    return response.json();
  };

  const createContract = async () => {
    const token = localStorage.getItem('token');
    if (!token || !entertainerId) return null;

    const response = await fetch('/api/contracts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entertainerId,
        contractType,
        effectiveDate: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create contract');
    }

    return response.json();
  };

  const signContract = async (contractId: string, signatureData: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch(`/api/contracts/${contractId}/sign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ signatureData })
    });

    if (!response.ok) {
      throw new Error('Failed to sign contract');
    }

    return response.json();
  };

  const completeOnboarding = async () => {
    const token = localStorage.getItem('token');
    if (!token || !entertainerId) return;

    const response = await fetch(`/api/onboarding/${entertainerId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to complete onboarding');
    }

    return response.json();
  };

  const handleNext = async () => {
    try {
      setError(null);
      setLoading(true);

      if (currentStep === 1) {
        // Validate basic info
        if (!validateBasicInfo()) {
          setLoading(false);
          return;
        }
      }

      if (currentStep === 2) {
        // Upload ID documents
        const govIdFile = uploadedDocs['GOVERNMENT_ID'];
        const selfieFile = uploadedDocs['PHOTO_ID_SELFIE'];

        if (!govIdFile || !selfieFile) {
          setError('Please upload both government ID and selfie');
          setLoading(false);
          return;
        }

        await Promise.all([
          uploadDocument('GOVERNMENT_ID', govIdFile),
          uploadDocument('PHOTO_ID_SELFIE', selfieFile)
        ]);
      }

      if (currentStep === 3 && requirements?.requiresEntertainerLicense) {
        // Upload entertainer license
        const licenseFile = uploadedDocs['ENTERTAINER_LICENSE'];

        if (!licenseFile) {
          setError('Please upload your entertainer license');
          setLoading(false);
          return;
        }

        await uploadDocument('ENTERTAINER_LICENSE', licenseFile);
      }

      if (currentStep === 4) {
        // Create and sign contract
        if (!signature) {
          setError('Please sign the contract');
          setLoading(false);
          return;
        }

        const contractResult = await createContract();
        if (contractResult?.contract?.id) {
          await signContract(contractResult.contract.id, signature);
        }

        // Complete onboarding
        await completeOnboarding();
        setSuccess(true);
      }

      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    } catch (err) {
      console.error('Error in onboarding step:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal Name *
              </label>
              <input
                type="text"
                value={basicInfo.legalName}
                onChange={(e) => handleBasicInfoChange('legalName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full legal name as it appears on ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stage Name *
              </label>
              <input
                type="text"
                value={basicInfo.stageName}
                onChange={(e) => handleBasicInfoChange('stageName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Performer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                value={basicInfo.dateOfBirth}
                onChange={(e) => handleBasicInfoChange('dateOfBirth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {requirements && (
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least {requirements.minimumAge} years old in {requirements.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={basicInfo.phone}
                onChange={(e) => handleBasicInfoChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 555-5555"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={basicInfo.email}
                onChange={(e) => handleBasicInfoChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>2257 Compliance:</strong> Federal law requires verification of age for all adult entertainers.
                Please upload a clear photo of your government-issued ID and a selfie holding your ID.
              </p>
            </div>

            <FileUpload
              label="Government ID *"
              description="Upload a clear photo of your driver's license or state ID"
              onFileSelect={(file) => handleFileSelect('GOVERNMENT_ID', file)}
              acceptedTypes={['image/jpeg', 'image/jpg', 'image/png']}
            />

            <FileUpload
              label="ID Selfie *"
              description="Take a selfie holding your ID next to your face"
              onFileSelect={(file) => handleFileSelect('PHOTO_ID_SELFIE', file)}
              acceptedTypes={['image/jpeg', 'image/jpg', 'image/png']}
            />
          </div>
        );

      case 3:
        if (!requirements?.requiresEntertainerLicense) {
          // Skip this step
          setCurrentStep(4);
          return null;
        }

        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                <strong>{requirements.name}</strong> requires an entertainer license.
                {requirements.licensingAuthority && (
                  <> Issued by: {requirements.licensingAuthority}</>
                )}
              </p>
            </div>

            <FileUpload
              label="Entertainer License *"
              description="Upload a clear photo or scan of your current entertainer license"
              onFileSelect={(file) => handleFileSelect('ENTERTAINER_LICENSE', file)}
              acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Type
              </label>
              <div className="space-y-2">
                <label className="flex items-start p-4 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="contractType"
                    value="INDEPENDENT_CONTRACTOR_1099"
                    checked={contractType === 'INDEPENDENT_CONTRACTOR_1099'}
                    onChange={(e) => setContractType(e.target.value as typeof contractType)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium">Independent Contractor (1099)</div>
                    <div className="text-sm text-gray-500">
                      You control your schedule and pay your own taxes. You will receive a 1099 form.
                    </div>
                  </div>
                </label>

                <label className="flex items-start p-4 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="contractType"
                    value="EMPLOYEE_W2"
                    checked={contractType === 'EMPLOYEE_W2'}
                    onChange={(e) => setContractType(e.target.value as typeof contractType)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium">Employee (W-2)</div>
                    <div className="text-sm text-gray-500">
                      Scheduled shifts with tax withholding. You will receive a W-2 form.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="border border-gray-300 rounded-md p-6 bg-gray-50 max-h-96 overflow-y-auto">
              <h3 className="font-medium mb-4">
                {contractType === 'INDEPENDENT_CONTRACTOR_1099'
                  ? 'Independent Contractor Agreement'
                  : 'Employment Agreement'}
              </h3>
              <div className="text-sm text-gray-700 space-y-4 whitespace-pre-wrap">
                {contractType === 'INDEPENDENT_CONTRACTOR_1099' ? (
                  <div>
                    <p><strong>1. INDEPENDENT CONTRACTOR STATUS</strong></p>
                    <p>Entertainer is an independent contractor and not an employee of the Club.</p>

                    <p className="mt-4"><strong>2. SERVICES</strong></p>
                    <p>Entertainer will provide adult entertainment services at the Club's establishment.</p>

                    <p className="mt-4"><strong>3. COMPENSATION</strong></p>
                    <p>- House Fee: As per Club policy<br/>
                    - Stage Performance: Entertainer retains 100% of stage tips<br/>
                    - Payment Schedule: As agreed</p>

                    <p className="mt-4"><strong>4. INDEPENDENT CONTROL</strong></p>
                    <p>Entertainer has complete control over when and how often to work.</p>
                  </div>
                ) : (
                  <div>
                    <p><strong>1. EMPLOYMENT STATUS</strong></p>
                    <p>Employee is hired as a W-2 employee of the Employer.</p>

                    <p className="mt-4"><strong>2. COMPENSATION</strong></p>
                    <p>Hourly rate plus performance bonuses as per Club policy.</p>

                    <p className="mt-4"><strong>3. WORK SCHEDULE</strong></p>
                    <p>Scheduled shifts with overtime pay as applicable by law.</p>

                    <p className="mt-4"><strong>4. EMPLOYEE BENEFITS</strong></p>
                    <p>Workers' compensation and unemployment insurance provided.</p>
                  </div>
                )}
              </div>
            </div>

            <SignatureCanvas
              onSignatureComplete={(dataUrl) => setSignature(dataUrl)}
              width={600}
              height={200}
            />
          </div>
        );

      case 5:
        return (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Onboarding Complete!
            </h3>
            <p className="text-gray-600 mb-6">
              Your account is now active and ready to use.
            </p>
            <button
              onClick={() => navigate('/dancers')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && currentStep === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${currentStep > step.id ? 'bg-green-600 text-white' : ''}
                      ${currentStep === step.id ? 'bg-blue-600 text-white' : ''}
                      ${currentStep < step.id ? 'bg-gray-200 text-gray-500' : ''}
                    `}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium text-gray-900">
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`
                      flex-1 h-1 mx-4
                      ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'}
                    `}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {steps[currentStep - 1].title}
          </h2>
          <p className="text-gray-600 mb-6">
            {steps[currentStep - 1].description}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {renderStepContent()}

          {/* Navigation Buttons */}
          {currentStep < 5 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
                className="
                  inline-flex items-center px-4 py-2 text-sm font-medium
                  text-gray-700 bg-white border border-gray-300 rounded-md
                  hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={loading}
                className="
                  inline-flex items-center px-6 py-2 text-sm font-medium
                  text-white bg-blue-600 border border-transparent rounded-md
                  hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    Complete Onboarding
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
