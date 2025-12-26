// State-Specific Compliance Requirements for Entertainer Onboarding
// Not stored in database for easier updates as regulations change

const stateCompliance = {
  // California
  CA: {
    name: "California",
    requiresEntertainerLicense: true,
    licensingAuthority: "California Department of Consumer Affairs",
    minimumAge: 18,
    requiredDocuments: ['ENTERTAINER_LICENSE', 'GOVERNMENT_ID', 'PHOTO_ID_SELFIE'],
    licenseExpiryWarningDays: 30,
    contractTypePreference: 'INDEPENDENT_CONTRACTOR_1099',
    notes: "California AB 5 creates strict IC classification rules. Most adult entertainers qualify as ICs under services exception.",
    regulatoryReferences: [
      "California Labor Code Section 2778 (AB 5)",
      "Business and Professions Code Section 19600-19616"
    ]
  },

  // Washington
  WA: {
    name: "Washington",
    requiresEntertainerLicense: true,
    licensingAuthority: "Washington State Gambling Commission",
    minimumAge: 18,
    requiredDocuments: ['ENTERTAINER_LICENSE', 'GOVERNMENT_ID', 'PHOTO_ID_SELFIE'],
    licenseExpiryWarningDays: 30,
    contractTypePreference: 'INDEPENDENT_CONTRACTOR_1099',
    notes: "Washington requires adult entertainer licenses through the Gambling Commission. Quarterly renewals.",
    regulatoryReferences: [
      "RCW 9.68A.010 - Adult Entertainment",
      "WAC 230-05-142 - License Requirements"
    ]
  },

  // Nevada
  NV: {
    name: "Nevada",
    requiresEntertainerLicense: true,
    licensingAuthority: "Local County or City (varies)",
    minimumAge: 21, // HIGHER AGE REQUIREMENT
    requiredDocuments: ['ENTERTAINER_LICENSE', 'GOVERNMENT_ID', 'PHOTO_ID_SELFIE', 'PROOF_OF_AGE'],
    licenseExpiryWarningDays: 30,
    contractTypePreference: 'INDEPENDENT_CONTRACTOR_1099',
    notes: "Nevada has stricter age requirements (21+). Licensing varies by county (Clark County vs. Washoe County). Proof of age is mandatory.",
    regulatoryReferences: [
      "Nevada Revised Statutes (NRS) 201.354",
      "Clark County Code 6.08.180"
    ]
  },

  // Florida
  FL: {
    name: "Florida",
    requiresEntertainerLicense: true,
    licensingAuthority: "Local County or City (varies)",
    minimumAge: 18,
    requiredDocuments: ['ENTERTAINER_LICENSE', 'GOVERNMENT_ID', 'PHOTO_ID_SELFIE'],
    licenseExpiryWarningDays: 30,
    contractTypePreference: 'INDEPENDENT_CONTRACTOR_1099',
    notes: "Florida licensing requirements vary by county and municipality. Miami-Dade and Broward have specific ordinances.",
    regulatoryReferences: [
      "Florida Statutes 796.07 - Prohibiting Certain Acts",
      "Local ordinances (county-specific)"
    ]
  },

  // Texas
  TX: {
    name: "Texas",
    requiresEntertainerLicense: true,
    licensingAuthority: "Texas Department of Licensing and Regulation",
    minimumAge: 18,
    requiredDocuments: ['ENTERTAINER_LICENSE', 'GOVERNMENT_ID', 'PHOTO_ID_SELFIE'],
    licenseExpiryWarningDays: 30,
    contractTypePreference: 'INDEPENDENT_CONTRACTOR_1099',
    notes: "Texas requires Sexually Oriented Business (SOB) licenses. Annual renewals.",
    regulatoryReferences: [
      "Texas Occupations Code Chapter 102",
      "Texas Administrative Code Title 16 Part 4"
    ]
  },

  // New York
  NY: {
    name: "New York",
    requiresEntertainerLicense: true,
    licensingAuthority: "New York City Department of Consumer Affairs (NYC only)",
    minimumAge: 18,
    requiredDocuments: ['ENTERTAINER_LICENSE', 'GOVERNMENT_ID', 'PHOTO_ID_SELFIE'],
    licenseExpiryWarningDays: 30,
    contractTypePreference: 'INDEPENDENT_CONTRACTOR_1099',
    notes: "NYC requires Cabaret License. Outside NYC, requirements vary by municipality.",
    regulatoryReferences: [
      "NYC Administrative Code Title 20 Chapter 2 Subchapter 9",
      "New York State Labor Law Article 1"
    ]
  },

  // Illinois
  IL: {
    name: "Illinois",
    requiresEntertainerLicense: true,
    licensingAuthority: "Local Municipality",
    minimumAge: 18,
    requiredDocuments: ['ENTERTAINER_LICENSE', 'GOVERNMENT_ID', 'PHOTO_ID_SELFIE'],
    licenseExpiryWarningDays: 30,
    contractTypePreference: 'INDEPENDENT_CONTRACTOR_1099',
    notes: "Illinois licensing varies by city. Chicago has specific Adult Entertainment Venue ordinances.",
    regulatoryReferences: [
      "Chicago Municipal Code 4-156-010",
      "Illinois Compiled Statutes 225 ILCS 454"
    ]
  },

  // Oregon
  OR: {
    name: "Oregon",
    requiresEntertainerLicense: true,
    licensingAuthority: "Oregon Liquor Control Commission (OLCC)",
    minimumAge: 18,
    requiredDocuments: ['ENTERTAINER_LICENSE', 'GOVERNMENT_ID', 'PHOTO_ID_SELFIE'],
    licenseExpiryWarningDays: 30,
    contractTypePreference: 'INDEPENDENT_CONTRACTOR_1099',
    notes: "Oregon has strong First Amendment protections. Entertainers working in liquor-licensed venues need OLCC permits.",
    regulatoryReferences: [
      "ORS 475B.010 - OLCC Regulations",
      "Oregon Administrative Rules (OAR) 845-005"
    ]
  },

  // DEFAULT - For states without specific requirements
  DEFAULT: {
    name: "General (US)",
    requiresEntertainerLicense: false, // Not state-mandated
    licensingAuthority: "Local Municipality or Venue",
    minimumAge: 18,
    requiredDocuments: ['GOVERNMENT_ID', 'PHOTO_ID_SELFIE'],
    licenseExpiryWarningDays: 30,
    contractTypePreference: 'INDEPENDENT_CONTRACTOR_1099',
    notes: "Default compliance for states without specific entertainer licensing laws. Always check local ordinances.",
    regulatoryReferences: [
      "Local city/county ordinances",
      "Federal 2257 compliance (18 U.S.C. § 2257)"
    ]
  }
};

/**
 * Get compliance requirements for a specific state
 * @param {string} stateCode - Two-letter state code (e.g., "CA", "NV")
 * @returns {object} State compliance requirements
 */
function getStateRequirements(stateCode) {
  if (!stateCode) {
    return stateCompliance.DEFAULT;
  }

  const upperCode = stateCode.toUpperCase();
  return stateCompliance[upperCode] || stateCompliance.DEFAULT;
}

/**
 * Check if state requires entertainer license
 * @param {string} stateCode - Two-letter state code
 * @returns {boolean}
 */
function requiresLicense(stateCode) {
  const requirements = getStateRequirements(stateCode);
  return requirements.requiresEntertainerLicense;
}

/**
 * Get minimum age for state
 * @param {string} stateCode - Two-letter state code
 * @returns {number} Minimum age
 */
function getMinimumAge(stateCode) {
  const requirements = getStateRequirements(stateCode);
  return requirements.minimumAge;
}

/**
 * Get required documents for state
 * @param {string} stateCode - Two-letter state code
 * @returns {string[]} Array of required document types
 */
function getRequiredDocuments(stateCode) {
  const requirements = getStateRequirements(stateCode);
  return requirements.requiredDocuments;
}

/**
 * Get license expiry warning days for state
 * @param {string} stateCode - Two-letter state code
 * @returns {number} Days before expiry to warn
 */
function getWarningDays(stateCode) {
  const requirements = getStateRequirements(stateCode);
  return requirements.licenseExpiryWarningDays;
}

/**
 * Validate entertainer age for state
 * @param {Date} dateOfBirth - Entertainer's date of birth
 * @param {string} stateCode - Two-letter state code
 * @returns {object} { isValid: boolean, minimumAge: number, actualAge: number }
 */
function validateAge(dateOfBirth, stateCode) {
  const minimumAge = getMinimumAge(stateCode);
  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let actualAge = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    actualAge--;
  }

  return {
    isValid: actualAge >= minimumAge,
    minimumAge,
    actualAge
  };
}

/**
 * Get all available states with compliance data
 * @returns {string[]} Array of state codes
 */
function getAvailableStates() {
  return Object.keys(stateCompliance).filter(code => code !== 'DEFAULT');
}

module.exports = {
  stateCompliance,
  getStateRequirements,
  requiresLicense,
  getMinimumAge,
  getRequiredDocuments,
  getWarningDays,
  validateAge,
  getAvailableStates
};
