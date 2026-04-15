# Club Onboarding System (Feature #50)

## Overview

The Club Onboarding System is a multi-step wizard that guides new club owners through the initial setup of their ClubFlow account. It collects essential configuration data including stage setup, VIP billing preferences, and patron count system settings.

## Features

### 1. Stage Configuration
- **Stage Count**: Set the number of stages in your club (1-10)
- **Stage Names**: Name each stage in rotation order
- **Automatic Rotation**: Enable/disable automatic entertainer rotation between stages

### 2. VIP Billing Configuration
Two billing models are supported:

#### Song-Based Billing
- Charge a fixed rate per song performed
- Configure average song duration for time estimates
- Default: $30/song, 210 seconds (3.5 minutes) per song

#### Time-Based Billing
- Charge based on time increments (15, 30, 45, or 60 minutes)
- Set rate per time increment
- System automatically calculates charges based on session duration

### 3. Patron Count System (Optional)
- Enable door count integration
- Set maximum capacity limit
- Configure re-entry fees
- Automatic capacity alerts when approaching limits

## Database Schema

### New Fields Added to Club Model

```prisma
// Stage Configuration
stageCount                 Int       @default(1)
stageRotationSequence      Json?     // Array of stage names
stageRotationEnabled       Boolean   @default(false)

// VIP Billing Configuration
vipBillingType             String    @default("SONG") // "SONG" or "TIME"
vipTimeIncrement           Int?      // Minutes (15, 30, 45, 60)
vipTimeRate                Decimal?  // Rate per time increment

// Onboarding Status
onboardingCompleted        Boolean   @default(false)
onboardingCompletedAt      DateTime?
onboardingStep             Int       @default(0)
```

## API Endpoints

### GET /api/club-onboarding/status
Retrieve current onboarding status and configuration.

**Authorization**: OWNER, SUPER_MANAGER

**Response**:
```json
{
  "success": true,
  "onboarding": {
    "completed": false,
    "completedAt": null,
    "currentStep": 2
  },
  "configuration": {
    "stages": {
      "count": 3,
      "rotationSequence": ["Main Stage", "VIP Stage", "Bar Stage"],
      "rotationEnabled": true
    },
    "vipBilling": {
      "type": "TIME",
      "timeIncrement": 30,
      "timeRate": "150.00"
    },
    "patronCount": {
      "enabled": true,
      "capacityLimit": 250
    }
  }
}
```

### POST /api/club-onboarding/stage-config
Configure stage settings (Step 1).

**Authorization**: OWNER, SUPER_MANAGER

**Request Body**:
```json
{
  "stageCount": 3,
  "stageRotationSequence": ["Main Stage", "VIP Stage", "Bar Stage"],
  "stageRotationEnabled": true
}
```

**Validation**:
- `stageCount`: 1-10 (required)
- `stageRotationSequence`: Array of strings, length must match stageCount
- Each stage name: 1-50 characters

**Response**:
```json
{
  "success": true,
  "message": "Stage configuration saved",
  "stageConfig": {
    "count": 3,
    "rotationSequence": ["Main Stage", "VIP Stage", "Bar Stage"],
    "rotationEnabled": true
  },
  "nextStep": 2
}
```

### POST /api/club-onboarding/vip-billing-config
Configure VIP billing settings (Step 2).

**Authorization**: OWNER, SUPER_MANAGER

**Request Body (Song-based)**:
```json
{
  "vipBillingType": "SONG",
  "vipSongRate": 35.00,
  "avgSongDuration": 210
}
```

**Request Body (Time-based)**:
```json
{
  "vipBillingType": "TIME",
  "vipTimeIncrement": 30,
  "vipTimeRate": 150.00
}
```

**Validation**:
- `vipBillingType`: "SONG" or "TIME" (required)
- For SONG type:
  - `vipSongRate`: Non-negative number (required)
  - `avgSongDuration`: Positive integer in seconds (optional)
- For TIME type:
  - `vipTimeIncrement`: Positive integer in minutes (required)
  - `vipTimeRate`: Non-negative number (required)

**Response**:
```json
{
  "success": true,
  "message": "VIP billing configuration saved",
  "vipBillingConfig": {
    "type": "TIME",
    "timeIncrement": 30,
    "timeRate": "150.00"
  },
  "nextStep": 3
}
```

### POST /api/club-onboarding/patron-count-config
Configure patron count system (Step 3 - Optional).

**Authorization**: OWNER, SUPER_MANAGER

**Request Body**:
```json
{
  "doorCountEnabled": true,
  "capacityLimit": 250,
  "reEntryFeeEnabled": true,
  "reEntryFeeAmount": 15.00
}
```

**Validation**:
- All fields optional (can skip this step)
- `capacityLimit`: Positive integer if provided
- `reEntryFeeAmount`: Non-negative number if provided

**Response**:
```json
{
  "success": true,
  "message": "Patron count configuration saved",
  "patronCountConfig": {
    "enabled": true,
    "capacityLimit": 250,
    "reEntryFeeEnabled": true,
    "reEntryFeeAmount": "15.00"
  },
  "nextStep": 4
}
```

### POST /api/club-onboarding/complete
Mark onboarding as complete (Final step).

**Authorization**: OWNER, SUPER_MANAGER

**Requirements**:
- Must have completed at least steps 1 and 2 (stage config and VIP billing)
- `onboardingStep` must be >= 2

**Response**:
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "club": {
    "id": "uuid",
    "name": "Club Name",
    "onboardingCompletedAt": "2025-01-01T12:00:00Z"
  }
}
```

### POST /api/club-onboarding/restart
Reset onboarding to allow re-running the wizard.

**Authorization**: OWNER only

**Response**:
```json
{
  "success": true,
  "message": "Onboarding has been reset. You can now go through the setup wizard again."
}
```

## Frontend Component

### ClubOnboarding Component

Located at: `frontend/src/components/onboarding/ClubOnboarding.tsx`

**Props**:
```typescript
interface ClubOnboardingProps {
  onComplete?: () => void  // Callback when onboarding finishes
}
```

**Usage**:
```tsx
import { ClubOnboarding } from '@/components/onboarding';

function OnboardingPage() {
  const handleComplete = () => {
    // Redirect to dashboard or show success message
    router.push('/dashboard');
  };

  return <ClubOnboarding onComplete={handleComplete} />;
}
```

**Features**:
- **Multi-step wizard** with progress indicator
- **Auto-save** of configuration at each step
- **Validation** with user-friendly error messages
- **Responsive design** for all screen sizes
- **Loading states** during API calls
- **Back navigation** to edit previous steps
- **Configuration summary** before completion

## User Experience Flow

### Step 1: Stage Configuration
1. Select number of stages (1-5+ buttons)
2. Name each stage in rotation order
3. Enable/disable automatic rotation
4. Click "Continue" to save and advance

### Step 2: VIP Billing Configuration
1. Choose billing type (Song or Time cards)
2. **If Song-based**:
   - Enter rate per song
   - Enter average song duration
3. **If Time-based**:
   - Select time increment (15/30/45/60 min buttons)
   - Enter rate per increment
4. Click "Continue" to save and advance

### Step 3: Patron Count Configuration (Optional)
1. Enable/disable patron count tracking
2. **If enabled**:
   - Enter maximum capacity
   - Enable/disable re-entry fees
   - Enter re-entry fee amount (if enabled)
3. Click "Continue" to save and advance

### Step 4: Complete Setup
1. Review configuration summary
2. Click "Finish Setup" to complete onboarding
3. Redirected to dashboard

## Testing

### API Testing

Run the API test suite:
```bash
node test-club-onboarding-api.js
```

**Test Coverage**:
- ✅ Stage configuration with 3 stages
- ✅ VIP billing (both SONG and TIME modes)
- ✅ Patron count configuration
- ✅ Onboarding completion
- ✅ Status retrieval
- ✅ Database persistence verification

### UI Testing

Run the Puppeteer test:
```bash
node test-club-onboarding.js
```

**Test Coverage**:
- ✅ Login as club owner
- ✅ Wizard activation
- ✅ Multi-step navigation
- ✅ Form validation
- ✅ Configuration save

## Integration Points

### With Existing Systems

1. **DJ Queue System**
   - Uses `stageRotationSequence` for stage rotation
   - Respects `stageRotationEnabled` setting
   - Stage names appear in DJ queue interface

2. **VIP Booth Management**
   - Uses `vipBillingType` to determine charge calculation
   - For TIME billing: uses `vipTimeIncrement` and `vipTimeRate`
   - For SONG billing: uses `vipSongRate` and `avgSongDuration`

3. **Patron Count System (Feature #49)**
   - Uses `doorCountEnabled`, `capacityLimit`, and re-entry fee settings
   - Triggers alerts based on configured capacity
   - Onboarding provides easy setup for new clubs

## Configuration Examples

### Small Club (1 Stage, Song-based VIP)
```json
{
  "stageCount": 1,
  "stageRotationSequence": ["Main Stage"],
  "stageRotationEnabled": false,
  "vipBillingType": "SONG",
  "vipSongRate": 30.00,
  "avgSongDuration": 210
}
```

### Medium Club (3 Stages, Time-based VIP)
```json
{
  "stageCount": 3,
  "stageRotationSequence": ["Main Stage", "VIP Stage", "Bar Stage"],
  "stageRotationEnabled": true,
  "vipBillingType": "TIME",
  "vipTimeIncrement": 30,
  "vipTimeRate": 150.00,
  "doorCountEnabled": true,
  "capacityLimit": 250
}
```

### Large Club (5 Stages, Song-based VIP, Full Integration)
```json
{
  "stageCount": 5,
  "stageRotationSequence": [
    "Main Stage",
    "VIP Upper",
    "VIP Lower",
    "Bar Stage",
    "Outdoor Stage"
  ],
  "stageRotationEnabled": true,
  "vipBillingType": "SONG",
  "vipSongRate": 35.00,
  "avgSongDuration": 210,
  "doorCountEnabled": true,
  "capacityLimit": 500,
  "reEntryFeeEnabled": true,
  "reEntryFeeAmount": 20.00
}
```

## Future Enhancements

Potential additions for future versions:

1. **Additional Configuration Steps**
   - Staff role setup
   - Operating hours configuration
   - Fee structure customization
   - Initial entertainer import

2. **Onboarding Templates**
   - Pre-configured setups for common club types
   - Industry best practices templates
   - State/region-specific compliance templates

3. **Progress Tracking**
   - Save incomplete onboarding
   - Email reminders to complete setup
   - Analytics on onboarding completion rates

4. **Guided Tours**
   - Interactive product tour after onboarding
   - Feature highlights and best practices
   - Video tutorials for each section

## Troubleshooting

### Onboarding Won't Start
- Ensure user has OWNER or SUPER_MANAGER role
- Check `onboardingCompleted` flag in database
- Use `/restart` endpoint to reset if needed

### Configuration Not Saving
- Check browser console for API errors
- Verify authentication token is valid
- Ensure all required fields pass validation

### Can't Complete Onboarding
- Must complete at least steps 1 and 2
- Verify `onboardingStep` is >= 2
- Check for validation errors in previous steps

## Support

For questions or issues with the club onboarding system:
1. Check the API response error messages
2. Review browser console for frontend errors
3. Verify database state with status endpoint
4. Test with the provided test scripts
5. Check [claude-progress.txt](../claude-progress.txt) for recent changes

---

**Created**: 2025-12-29
**Feature ID**: #50
**Version**: 1.0.0
**Status**: ✅ Complete
