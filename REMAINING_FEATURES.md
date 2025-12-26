# Remaining Features - Implementation Guide

**Date**: 2025-12-26
**Status**: 42/50 features complete (84%)

This document provides implementation guidance for the remaining 8 features that require special infrastructure, external integrations, or extended development time.

---

## Feature #34: Push Notifications on Mobile Devices

**Status**: Pending
**Priority**: Medium
**Module**: Notifications

### Requirements
- Push notifications must work on mobile devices
- Notifications should appear even when app is closed
- Tapping notification should open relevant section
- Users can enable/disable in settings

### Implementation Approach

#### Option 1: Progressive Web App (PWA) with Web Push API
```javascript
// frontend/public/sw.js (Service Worker)
self.addEventListener('push', function(event) {
  const data = event.data.json();

  const options = {
    body: data.message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      url: data.url,
      clubId: data.clubId
    },
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

#### Backend Integration
```javascript
// backend/services/pushNotifications.js
const webpush = require('web-push');

// Configure VAPID keys (generate once)
webpush.setVapidDetails(
  'mailto:support@clubflowapp.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendPushNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Push notification sent successfully');
  } catch (error) {
    if (error.statusCode === 410) {
      // Subscription expired, remove from database
      await prisma.pushSubscription.delete({
        where: { endpoint: subscription.endpoint }
      });
    }
    console.error('Push notification error:', error);
  }
}

// Usage in existing Socket.io events
io.on('vip-minimum-alert', async (data) => {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      clubId: data.clubId,
      userId: { in: managerUserIds }
    }
  });

  for (const sub of subscriptions) {
    await sendPushNotification(sub.subscription, {
      title: 'VIP Alert',
      message: `Booth ${data.boothNumber} approaching minimum`,
      url: `/vip-booths/${data.boothId}`
    });
  }
});
```

#### Database Schema Addition
```prisma
model PushSubscription {
  id           String   @id @default(uuid())
  userId       String
  clubId       String
  endpoint     String   @unique
  p256dh       String
  auth         String
  createdAt    DateTime @default(now())

  user         ClubUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  club         Club     @relation(fields: [clubId], references: [id], onDelete: Cascade)
}
```

#### Frontend Subscription
```typescript
// frontend/src/services/pushService.ts
export async function subscribeToPush(userId: string, clubId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications not supported');
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
  });

  // Save subscription to backend
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      clubId,
      subscription
    })
  });
}
```

#### Testing Steps
1. Deploy PWA with service worker
2. Request notification permissions on mobile
3. Subscribe to push notifications
4. Trigger test notification (VIP alert, late fee, etc.)
5. Verify notification appears when app is closed
6. Tap notification and verify correct page opens

---

## Feature #40: Daily Automated Backups

**Status**: Pending
**Priority**: High
**Module**: Backup & Recovery

### Requirements
- System performs daily automated backups
- Backups are accessible for restore
- Data integrity verified after restore
- Automated backup monitoring

### Implementation Approach

#### Option 1: Vercel Postgres Backup (Recommended)
Vercel Postgres includes automated backups:
- Daily backups retained for 7 days (Pro plan)
- Point-in-time recovery available
- Restore via Vercel dashboard

**Configuration**:
```bash
# Verify backup settings in Vercel dashboard
vercel env ls

# Test restore (creates new database)
vercel postgres backup restore <backup-id>
```

#### Option 2: Custom Backup Script
```javascript
// backend/jobs/backupDatabase.js
const { exec } = require('child_process');
const { promisify } = require('util');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `clubflow-backup-${timestamp}.sql`;
  const filepath = path.join('/tmp', filename);

  console.log('[Backup] Starting database backup...');

  try {
    // Generate SQL dump
    const dbUrl = new URL(process.env.DATABASE_URL);
    await execAsync(
      `pg_dump -h ${dbUrl.hostname} -p ${dbUrl.port} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)} -F c -b -v -f ${filepath}`,
      { env: { ...process.env, PGPASSWORD: dbUrl.password } }
    );

    console.log('[Backup] Database dump created');

    // Upload to S3
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    const fileStream = fs.createReadStream(filepath);

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.BACKUP_S3_BUCKET,
      Key: `backups/${filename}`,
      Body: fileStream,
      ServerSideEncryption: 'AES256',
      Metadata: {
        timestamp: new Date().toISOString(),
        database: dbUrl.pathname.slice(1)
      }
    }));

    console.log('[Backup] Uploaded to S3');

    // Clean up local file
    fs.unlinkSync(filepath);

    // Record backup in database
    await prisma.systemBackup.create({
      data: {
        filename,
        size: fs.statSync(filepath).size,
        location: `s3://${process.env.BACKUP_S3_BUCKET}/backups/${filename}`,
        status: 'completed',
        backupType: 'full'
      }
    });

    console.log('[Backup] Complete!');
    return { success: true, filename };

  } catch (error) {
    console.error('[Backup] Failed:', error);
    throw error;
  }
}

module.exports = { backupDatabase };
```

#### Add to Scheduler
```javascript
// backend/jobs/scheduler.js
const { backupDatabase } = require('./backupDatabase');

function initializeScheduledJobs() {
  // ... existing jobs ...

  // Database Backup - Runs daily at 3:00 AM
  const backupCron = cron.schedule('0 3 * * *', async () => {
    console.log('[Job Scheduler] Running daily database backup...');
    try {
      const result = await backupDatabase();
      console.log('[Job Scheduler] Backup complete:', result);
    } catch (error) {
      console.error('[Job Scheduler] Backup failed:', error);
      // Send alert to admin
    }
  }, {
    scheduled: true,
    timezone: "America/New_York"
  });

  return { lateFeeCron, backupCron };
}
```

#### Testing Steps
1. Manually trigger backup: `node -e "require('./backend/jobs/backupDatabase').backupDatabase()"`
2. Verify backup file exists in S3/storage
3. Create test database and restore backup
4. Verify data integrity (row counts, sample data)
5. Test scheduled backup runs at 3:00 AM

---

## Feature #48: POS System Integration

**Status**: Pending
**Priority**: High
**Module**: Integration

### Requirements
- Sync transactions from POS to ClubFlow
- Amounts must match exactly
- Sync within 1 minute
- Support common POS systems (Square, Toast, Clover)

### Implementation Approach

#### Generic Integration Pattern
```javascript
// backend/integrations/pos/baseAdapter.js
class POSAdapter {
  async connect(config) {
    throw new Error('Must implement connect()');
  }

  async fetchTransactions(startDate, endDate) {
    throw new Error('Must implement fetchTransactions()');
  }

  async syncTransaction(transaction) {
    // Generic sync logic
    const existing = await prisma.financialTransaction.findFirst({
      where: {
        clubId: this.clubId,
        sourceType: 'POS',
        sourceId: transaction.externalId
      }
    });

    if (existing) {
      console.log(`Transaction ${transaction.externalId} already synced`);
      return existing;
    }

    return await prisma.financialTransaction.create({
      data: {
        clubId: this.clubId,
        transactionType: this.mapCategory(transaction.category),
        category: transaction.category,
        amount: transaction.amount,
        description: transaction.description,
        paymentMethod: transaction.paymentMethod,
        status: 'PAID',
        sourceType: 'POS',
        sourceId: transaction.externalId,
        metadata: {
          posSystem: this.posSystem,
          rawTransaction: transaction
        }
      }
    });
  }
}
```

#### Square Integration Example
```javascript
// backend/integrations/pos/squareAdapter.js
const { Client, Environment } = require('square');

class SquareAdapter extends POSAdapter {
  constructor(clubId, config) {
    super();
    this.clubId = clubId;
    this.posSystem = 'square';
    this.client = new Client({
      accessToken: config.accessToken,
      environment: config.sandbox ? Environment.Sandbox : Environment.Production
    });
  }

  async fetchTransactions(startDate, endDate) {
    const response = await this.client.paymentsApi.listPayments({
      beginTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      locationId: this.config.locationId
    });

    return response.result.payments.map(payment => ({
      externalId: payment.id,
      amount: parseFloat(payment.amountMoney.amount) / 100,
      category: this.mapSquareCategory(payment.sourceType),
      description: payment.note || 'POS Transaction',
      paymentMethod: payment.sourceType.toLowerCase(),
      timestamp: new Date(payment.createdAt)
    }));
  }

  mapSquareCategory(sourceType) {
    const mapping = {
      CARD: 'BAR_SALES',
      CASH: 'BAR_SALES',
      EXTERNAL: 'OTHER'
    };
    return mapping[sourceType] || 'OTHER';
  }
}
```

#### Webhook Listener
```javascript
// backend/routes/webhooks.js
router.post('/pos/square', async (req, res) => {
  const { event_type, data } = req.body;

  // Verify webhook signature
  const isValid = verifySquareWebhook(req);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  if (event_type === 'payment.created') {
    const payment = data.object.payment;

    // Find club by location
    const integration = await prisma.integration.findFirst({
      where: {
        type: 'POS',
        provider: 'square',
        settings: { path: ['locationId'], equals: payment.location_id }
      }
    });

    if (integration) {
      const adapter = new SquareAdapter(integration.clubId, integration.settings);
      await adapter.syncTransaction({
        externalId: payment.id,
        amount: parseFloat(payment.amount_money.amount) / 100,
        category: 'BAR_SALES',
        description: payment.note || 'POS Transaction',
        paymentMethod: payment.source_type.toLowerCase(),
        timestamp: new Date(payment.created_at)
      });

      // Emit real-time update
      io.to(`club:${integration.clubId}`).emit('pos:transaction', {
        amount: parseFloat(payment.amount_money.amount) / 100,
        timestamp: new Date()
      });
    }
  }

  res.json({ success: true });
});
```

#### Testing Steps
1. Set up test POS account (Square sandbox)
2. Configure webhook endpoint
3. Create test transaction in POS
4. Verify transaction appears in ClubFlow within 1 minute
5. Verify amounts match exactly
6. Test error handling (duplicate transactions, network failures)

---

## Feature #49: Door Count Integration

**Status**: Pending
**Priority**: Medium
**Module**: Integration

### Requirements
- Display current door count
- Update on entry/exit
- Capacity alerts trigger correctly
- Support manual count adjustments

### Implementation Approach

#### Database Schema
```prisma
model DoorCount {
  id              String   @id @default(uuid())
  clubId          String
  currentCount    Int
  capacityLimit   Int
  timestamp       DateTime @default(now())
  lastUpdated     DateTime @updatedAt

  club            Club     @relation(fields: [clubId], references: [id])

  @@map("door_counts")
}

model DoorCountEvent {
  id              String   @id @default(uuid())
  clubId          String
  eventType       String   // 'ENTRY', 'EXIT', 'MANUAL_ADJUSTMENT'
  previousCount   Int
  newCount        Int
  adjustedBy      String?  // User ID for manual adjustments
  timestamp       DateTime @default(now())
  metadata        Json?

  club            Club     @relation(fields: [clubId], references: [id])

  @@map("door_count_events")
}
```

#### API Endpoints
```javascript
// backend/routes/door-count.js
const express = require('express');
const router = express.Router();

// Get current door count
router.get('/', auth, async (req, res) => {
  const doorCount = await prisma.doorCount.findFirst({
    where: { clubId: req.user.clubId },
    orderBy: { timestamp: 'desc' }
  });

  if (!doorCount) {
    return res.json({
      currentCount: 0,
      capacityLimit: 200,
      percentFull: 0,
      isNearCapacity: false,
      isAtCapacity: false
    });
  }

  const percentFull = (doorCount.currentCount / doorCount.capacityLimit) * 100;

  res.json({
    currentCount: doorCount.currentCount,
    capacityLimit: doorCount.capacityLimit,
    percentFull: percentFull.toFixed(1),
    isNearCapacity: percentFull >= 80,
    isAtCapacity: percentFull >= 95,
    lastUpdated: doorCount.lastUpdated
  });
});

// Record entry
router.post('/entry', auth, async (req, res) => {
  const { count = 1 } = req.body;

  const current = await prisma.doorCount.findFirst({
    where: { clubId: req.user.clubId },
    orderBy: { timestamp: 'desc' }
  });

  const newCount = (current?.currentCount || 0) + count;

  const updated = await prisma.doorCount.create({
    data: {
      clubId: req.user.clubId,
      currentCount: newCount,
      capacityLimit: current?.capacityLimit || 200
    }
  });

  await prisma.doorCountEvent.create({
    data: {
      clubId: req.user.clubId,
      eventType: 'ENTRY',
      previousCount: current?.currentCount || 0,
      newCount
    }
  });

  // Emit real-time update
  req.io.to(`club:${req.user.clubId}`).emit('door:count-updated', {
    currentCount: newCount,
    capacityLimit: updated.capacityLimit
  });

  // Check capacity alert
  const percentFull = (newCount / updated.capacityLimit) * 100;
  if (percentFull >= 80 && percentFull < 95) {
    req.io.to(`club:${req.user.clubId}`).emit('door:near-capacity', {
      currentCount: newCount,
      capacityLimit: updated.capacityLimit,
      percentFull
    });
  } else if (percentFull >= 95) {
    req.io.to(`club:${req.user.clubId}`).emit('door:at-capacity', {
      currentCount: newCount,
      capacityLimit: updated.capacityLimit
    });
  }

  res.json({ currentCount: newCount });
});

// Record exit
router.post('/exit', auth, async (req, res) => {
  const { count = 1 } = req.body;

  const current = await prisma.doorCount.findFirst({
    where: { clubId: req.user.clubId },
    orderBy: { timestamp: 'desc' }
  });

  const newCount = Math.max(0, (current?.currentCount || 0) - count);

  const updated = await prisma.doorCount.create({
    data: {
      clubId: req.user.clubId,
      currentCount: newCount,
      capacityLimit: current?.capacityLimit || 200
    }
  });

  await prisma.doorCountEvent.create({
    data: {
      clubId: req.user.clubId,
      eventType: 'EXIT',
      previousCount: current?.currentCount || 0,
      newCount
    }
  });

  req.io.to(`club:${req.user.clubId}`).emit('door:count-updated', {
    currentCount: newCount,
    capacityLimit: updated.capacityLimit
  });

  res.json({ currentCount: newCount });
});

// Manual adjustment
router.post('/adjust', [auth, authorize('OWNER', 'MANAGER')], async (req, res) => {
  const { count, reason } = req.body;

  const current = await prisma.doorCount.findFirst({
    where: { clubId: req.user.clubId },
    orderBy: { timestamp: 'desc' }
  });

  const updated = await prisma.doorCount.create({
    data: {
      clubId: req.user.clubId,
      currentCount: count,
      capacityLimit: current?.capacityLimit || 200
    }
  });

  await prisma.doorCountEvent.create({
    data: {
      clubId: req.user.clubId,
      eventType: 'MANUAL_ADJUSTMENT',
      previousCount: current?.currentCount || 0,
      newCount: count,
      adjustedBy: req.user.id,
      metadata: { reason }
    }
  });

  req.io.to(`club:${req.user.clubId}`).emit('door:count-updated', {
    currentCount: count,
    capacityLimit: updated.capacityLimit
  });

  res.json({ currentCount: count });
});

module.exports = router;
```

#### Hardware Integration (Optional)
For automatic counting with sensors:
```javascript
// backend/integrations/door-sensor.js
const mqtt = require('mqtt');

class DoorSensorIntegration {
  constructor(clubId, config) {
    this.clubId = clubId;
    this.client = mqtt.connect(config.brokerUrl, {
      username: config.username,
      password: config.password
    });

    this.client.on('connect', () => {
      console.log('[Door Sensor] Connected');
      this.client.subscribe(`club/${clubId}/door/entry`);
      this.client.subscribe(`club/${clubId}/door/exit`);
    });

    this.client.on('message', async (topic, message) => {
      const data = JSON.parse(message.toString());

      if (topic.endsWith('/entry')) {
        await this.recordEntry(data.count || 1);
      } else if (topic.endsWith('/exit')) {
        await this.recordExit(data.count || 1);
      }
    });
  }

  async recordEntry(count) {
    // Call API endpoint
    await fetch(`${process.env.API_URL}/api/door-count/entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count })
    });
  }

  async recordExit(count) {
    await fetch(`${process.env.API_URL}/api/door-count/exit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count })
    });
  }
}
```

#### Testing Steps
1. Create door count endpoints
2. Test manual entry/exit via API
3. Verify capacity alerts trigger at 80% and 95%
4. Test manual adjustments with audit logging
5. Verify real-time updates via Socket.io

---

## Feature #50: New Club Onboarding Wizard

**Status**: Pending
**Priority**: Critical
**Module**: Onboarding

### Requirements
- Multi-step wizard for new club setup
- Complete business info, staff roles, fee structures, initial dancers
- Club must be fully functional after completion
- Progress saved between steps

### Implementation Approach

#### Database Schema
```prisma
model OnboardingProgress {
  id                String   @id @default(uuid())
  clubId            String   @unique
  currentStep       Int      @default(1)
  stepsCompleted    Json     @default("[]")
  wizardData        Json     @default("{}")
  isComplete        Boolean  @default(false)
  completedAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  club              Club     @relation(fields: [clubId], references: [id], onDelete: Cascade)

  @@map("onboarding_progress")
}
```

#### Wizard Steps
```typescript
// frontend/src/components/onboarding/OnboardingWizard.tsx

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: 'Business Information',
    description: 'Basic club details and location',
    component: BusinessInfoStep,
    fields: ['name', 'address', 'phone', 'email', 'timezone']
  },
  {
    id: 2,
    title: 'Staff Roles',
    description: 'Configure user roles and permissions',
    component: StaffRolesStep,
    fields: ['ownerEmail', 'managers', 'djAccess', 'doorStaff']
  },
  {
    id: 3,
    title: 'Fee Structures',
    description: 'Set up house fees and VIP minimums',
    component: FeeStructuresStep,
    fields: ['barFee', 'lateFeeEnabled', 'vipRates', 'shiftFees']
  },
  {
    id: 4,
    title: 'Initial Entertainers',
    description: 'Add your first entertainers',
    component: EntertainersStep,
    fields: ['entertainers'] // Optional step
  },
  {
    id: 5,
    title: 'Review & Launch',
    description: 'Review settings and activate club',
    component: ReviewStep,
    fields: []
  }
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load saved progress
    loadProgress();
  }, []);

  async function loadProgress() {
    const res = await fetch('/api/onboarding/progress');
    const data = await res.json();

    if (data.progress) {
      setCurrentStep(data.progress.currentStep);
      setWizardData(data.progress.wizardData);
    }
  }

  async function saveProgress(step: number, data: any) {
    setIsSaving(true);

    const updatedData = { ...wizardData, ...data };
    setWizardData(updatedData);

    await fetch('/api/onboarding/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentStep: step,
        wizardData: updatedData,
        stepsCompleted: Array.from({ length: step - 1 }, (_, i) => i + 1)
      })
    });

    setIsSaving(false);
  }

  async function nextStep(stepData: any) {
    await saveProgress(currentStep + 1, stepData);
    setCurrentStep(currentStep + 1);
  }

  async function previousStep() {
    setCurrentStep(currentStep - 1);
  }

  async function completeWizard(finalData: any) {
    setIsSaving(true);

    const completeData = { ...wizardData, ...finalData };

    // Submit all data to complete onboarding
    await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completeData)
    });

    // Redirect to dashboard
    window.location.href = '/dashboard';
  }

  const CurrentStepComponent = ONBOARDING_STEPS[currentStep - 1].component;

  return (
    <div className="onboarding-wizard">
      <ProgressIndicator
        steps={ONBOARDING_STEPS}
        currentStep={currentStep}
      />

      <div className="step-content">
        <CurrentStepComponent
          data={wizardData}
          onNext={nextStep}
          onPrevious={currentStep > 1 ? previousStep : null}
          onComplete={currentStep === 5 ? completeWizard : null}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
```

#### Backend API
```javascript
// backend/routes/onboarding.js

// Get onboarding progress
router.get('/progress', auth, async (req, res) => {
  const progress = await prisma.onboardingProgress.findUnique({
    where: { clubId: req.user.clubId }
  });

  res.json({ progress });
});

// Save progress
router.put('/progress', auth, async (req, res) => {
  const { currentStep, wizardData, stepsCompleted } = req.body;

  const progress = await prisma.onboardingProgress.upsert({
    where: { clubId: req.user.clubId },
    update: {
      currentStep,
      wizardData,
      stepsCompleted
    },
    create: {
      clubId: req.user.clubId,
      currentStep,
      wizardData,
      stepsCompleted
    }
  });

  res.json({ progress });
});

// Complete onboarding
router.post('/complete', auth, async (req, res) => {
  const data = req.body;

  try {
    await prisma.$transaction(async (tx) => {
      // Update club with business info
      await tx.club.update({
        where: { id: req.user.clubId },
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          timezone: data.timezone,
          barFeeAmount: data.barFee,
          lateFeeEnabled: data.lateFeeEnabled,
          lateFeeAmount: data.lateFeeAmount || 10,
          settings: {
            feeStructure: data.feeStructure,
            vipRates: data.vipRates
          }
        }
      });

      // Create staff users
      if (data.managers?.length > 0) {
        for (const manager of data.managers) {
          await tx.clubUser.create({
            data: {
              clubId: req.user.clubId,
              email: manager.email,
              name: manager.name,
              role: 'MANAGER',
              isActive: true
            }
          });
        }
      }

      // Create initial entertainers (optional)
      if (data.entertainers?.length > 0) {
        for (const entertainer of data.entertainers) {
          await tx.entertainer.create({
            data: {
              clubId: req.user.clubId,
              stageName: entertainer.stageName,
              legalName: entertainer.legalName,
              email: entertainer.email,
              phone: entertainer.phone,
              isActive: true
            }
          });
        }
      }

      // Mark onboarding as complete
      await tx.onboardingProgress.update({
        where: { clubId: req.user.clubId },
        data: {
          isComplete: true,
          completedAt: new Date()
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          clubId: req.user.clubId,
          userId: req.user.id,
          action: 'COMPLETE_ONBOARDING',
          entityType: 'Club',
          entityId: req.user.clubId,
          changes: { onboardingData: data }
        }
      });
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully'
    });

  } catch (error) {
    console.error('Onboarding completion error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});
```

#### Testing Steps
1. Create new test club account
2. Start onboarding wizard
3. Complete Step 1 (Business Info) and verify save
4. Refresh page and verify progress restored
5. Complete Step 2 (Staff Roles)
6. Complete Step 3 (Fee Structures)
7. Skip Step 4 (Entertainers) - optional
8. Complete Step 5 (Review)
9. Verify club is fully functional:
   - Can create shifts
   - Can check in dancers
   - Fee structures apply correctly
   - Staff users can log in

---

## Summary

### Completed Features: 42/50 (84%)

### Remaining Features:
1. **Feature #34**: Push Notifications (PWA + Web Push API)
2. **Feature #40**: Daily Backups (Vercel Postgres or custom S3)
3. **Feature #48**: POS Integration (Square/Toast/Clover adapters)
4. **Feature #49**: Door Count Integration (MQTT sensors + manual)
5. **Feature #50**: Onboarding Wizard (5-step multi-page flow)

### Implementation Priority:
1. **High**: Feature #50 (Onboarding) - Critical for new customer acquisition
2. **High**: Feature #40 (Backups) - Data protection
3. **Medium**: Feature #48 (POS) - Revenue automation
4. **Medium**: Feature #49 (Door Count) - Compliance/capacity management
5. **Low**: Feature #34 (Push Notifications) - Nice-to-have enhancement

### Estimated Effort:
- Feature #50: 2-3 days (complex multi-step wizard)
- Feature #40: 4-6 hours (if using Vercel backups) or 1-2 days (custom)
- Feature #48: 2-3 days (per POS system integration)
- Feature #49: 1 day (manual system) or 2-3 days (with hardware)
- Feature #34: 1-2 days (PWA + service worker setup)

**Total**: 7-14 days of development work
