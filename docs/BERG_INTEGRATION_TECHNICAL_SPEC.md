# Berg Liquor Control Integration - Technical Specification

## Executive Summary

Berg Liquor Control does **NOT use API** - they use a **serial port protocol** (RS-232) with a simple request/response pattern. This is actually **better** for ClubFlow because:
- ✅ No API fees or licensing costs
- ✅ Simple protocol (easier than REST API)
- ✅ Proven compatibility with dozens of POS systems
- ✅ Works via USB or Ethernet adapters
- ✅ Real-time pour authorization (<1 second)

## How Berg Integration Works

### The Pouring Process (4 Steps)

```
1. Bartender attempts to pour a drink
2. Berg dispenser sends PLU packet via serial → ClubFlow
3. ClubFlow responds: ACK (0x06) = allow, NAK (0x15) = deny
4. If ACK received, Berg dispenses the drink
```

**Critical Timing:** ClubFlow must respond quickly (within user-defined timeout, typically <1 second) or Berg treats it as NAK.

## Technical Specifications

### Serial Communication Parameters

```
Baud Rate: 9600 bps
Data Bits: 8
Parity: None
Stop Bits: 1
Handshaking: None
```

### Serial Pins Used
- **TxD (Pin 3)**: Berg transmits data to ClubFlow
- **RxD (Pin 2)**: ClubFlow sends ACK/NAK to Berg
- **GND (Pin 5)**: Ground
- **DTR (Pin 4)**: Optional - signals Berg interface is active

### PLU Packet Structure

**Packet Format:**
```
STX (Modifiers) PLU (Trailers) ETX LRC
```

**Example - PLU 587:**
```
Bytes: 0x02 0x35 0x38 0x37 0x03 0x3B
       STX   5    8    7   ETX  LRC
```

**Field Definitions:**
- **STX**: `0x02` - Start of transmission
- **PLU**: ASCII digits (0x30-0x39), no zero padding, 1-7 digits
- **Modifiers**: Optional bytes (e.g., portion size, price level)
- **Trailers**: Optional bytes (e.g., action indicators)
- **ETX**: `0x03` - End of transmission
- **LRC**: XOR checksum of all bytes (STX through ETX)

### LRC Calculation (Checksum)

```javascript
// Example: PLU = 587
// Packet: STX=0x02, '5'=0x35, '8'=0x38, '7'=0x37, ETX=0x03

let lrc = 0x00;
lrc ^= 0x02; // STX
lrc ^= 0x35; // '5'
lrc ^= 0x38; // '8'
lrc ^= 0x37; // '7'
lrc ^= 0x03; // ETX
// Result: lrc = 0x3B
```

### ClubFlow Response Protocol

ClubFlow must respond with **1 byte**:
- **ACK (0x06)**: Pour approved - Berg will dispense
- **NAK (0x15)**: Pour denied - Berg will NOT dispense

**When to send ACK:**
- ✅ LRC checksum is valid
- ✅ PLU exists in ClubFlow product database
- ✅ POS terminal is ready to ring the sale
- ✅ Optional: Bartender has sufficient permissions

**When to send NAK:**
- ❌ LRC checksum failed (corrupted data)
- ❌ Invalid PLU (not in database)
- ❌ POS not ready
- ❌ Optional: Insufficient permissions

## Berg Configuration Modes

### 1. Pour Without Release (Fire-and-Forget)
- Berg sends PLU packet and immediately dispenses
- ClubFlow receives packet for tracking/reporting only
- No authorization control
- **Use case**: High-volume bars where speed > control

### 2. Pour With Release (Authorization Mode) ⭐ RECOMMENDED
- Berg sends PLU packet and **waits** for ACK
- Only dispenses if ACK received within timeout
- Full authorization control
- **Use case**: Clubs wanting tight inventory control

## PLU Numbering System

### PLU Structure
- Each liquor brand has **4 portion sizes** (e.g., shot, rocks, tall, bottle)
- Each portion gets a unique PLU number
- Example: 20 brands × 4 portions = **80 PLUs**

### PLU Assignment Methods

**Method 1: Berg Infinity Software Generates PLUs**
- Berg software auto-generates PLU numbers
- Export brand CSV with PLUs, brand names, portions
- Import into ClubFlow product database

**Method 2: ClubFlow Generates PLUs**
- ClubFlow assigns PLU numbers (1-7 digits)
- Manually enter PLUs into Berg Infinity software
- Ensures ClubFlow is source of truth

**Recommended Approach:** Method 1 (Berg generates) for simplicity

## Connection Methods

### Option A: USB Connection (Recommended for Single Terminal)

**Hardware Required:**
1. Berg dispenser
2. Berg Universal Cable Kit (Part 8009092)
3. USB-to-Serial adapter (Berg sells recommended model for Windows)

**Software Requirements:**
- ClubFlow backend accesses virtual COM port
- Node.js `serialport` library listens on COM port
- Parse incoming packets, send ACK/NAK responses

**Advantages:**
- ✅ Simple setup
- ✅ Low cost (~$50 for USB adapter)
- ✅ No network configuration

**Disadvantages:**
- ⚠️ Requires physical proximity to terminal
- ⚠️ One dispenser per USB port

### Option B: Ethernet Connection (Recommended for Multiple Dispensers)

**Hardware Required:**
1. Berg dispenser(s)
2. Berg Universal Cable Kit
3. Serial-to-Ethernet adapter (Berg sells this)

**Software Requirements:**
- Configure adapter as TCP Server
- ClubFlow backend creates TCP Client connection
- Same packet parsing after TCP connection established

**Advantages:**
- ✅ Multiple dispensers can connect over network
- ✅ No physical proximity requirement
- ✅ Cleaner cabling

**Disadvantages:**
- ⚠️ Higher cost (~$150-300 for Ethernet adapter)
- ⚠️ Network configuration required

### Recommendation for ClubFlow
**Start with USB** for MVP (simplest), add **Ethernet support** for multi-dispenser venues.

## Compatible POS Systems (from Berg's List)

Berg interfaces with **dozens of POS systems**, including:
- Aloha
- Micros 3700/8700/9700/Simphony
- Square
- Toast
- Digital Dining
- Pixel Point
- Future POS
- Aldelo
- Many others (see full list in POS-Interface-6.7.2018.pdf)

**Key Insight:** All these systems use the **same Berg Basic protocol** we're implementing. If they can do it, ClubFlow can too!

## Integration Methods Used by POS Systems

### 1. Direct Ring-Up ⭐ RECOMMENDED FOR CLUBFLOW
- Pour request automatically rings up sale on POS
- Pour only happens after POS rings sale and sends ACK
- **Best for:** Full automation, tight control

### 2. Pre-Checking
- Server pre-rings items on POS
- Berg checks PLU against pre-checked list
- Pour only if item was pre-checked
- **Best for:** Table service restaurants

### 3. File Posting
- Berg sends PLU, POS saves to file (doesn't ring up)
- Later, generate variance report (pours vs rings)
- **Best for:** Audit/reporting only

### 4. Zero Price Pre-Checking
- Server rings items at $0.00
- Bartender accesses ticket, prices added as poured
- **Best for:** Complex pricing schemes

### 5. Ring and Sling
- Items poured and logged
- Bartender manually assigns to guest check later
- **Best for:** High-volume bars with post-shift reconciliation

**ClubFlow Strategy:** Implement **Direct Ring-Up** (Method 1) as primary method, potentially add **File Posting** (Method 3) for variance reporting.

## ClubFlow Implementation Architecture

### Backend Components to Create

#### 1. Serial Communication Service
**File:** `backend/services/bergSerialService.js`

**Responsibilities:**
- Open serial port (USB) or TCP connection (Ethernet)
- Listen for incoming PLU packets
- Parse packet structure (STX, PLU, ETX, LRC)
- Validate LRC checksum
- Send ACK/NAK responses

**Technology:**
- Node.js `serialport` library for USB
- Node.js `net` module for TCP (Ethernet)

#### 2. Berg Integration Service
**File:** `backend/services/bergIntegrationService.js`

**Responsibilities:**
- Validate PLU exists in product database
- Check if POS terminal is ready
- Determine ACK vs NAK
- Create FinancialTransaction record
- Emit Socket.io event for real-time UI update
- Log pour requests for reconciliation

#### 3. Berg Configuration API
**File:** `backend/routes/berg-integration.js`

**Endpoints:**
- `GET /api/berg-integration/config` - Get current config
- `PUT /api/berg-integration/config` - Update config
- `POST /api/berg-integration/connect` - Connect to Berg dispenser
- `POST /api/berg-integration/disconnect` - Disconnect
- `GET /api/berg-integration/status` - Connection status
- `POST /api/berg-integration/products/import` - Import Berg PLU CSV
- `GET /api/berg-integration/reconciliation` - Variance report

#### 4. Database Models
**File:** `backend/prisma/schema.prisma`

**New Models:**
```prisma
model BergConfiguration {
  id              String   @id @default(cuid())
  clubId          String   @unique
  club            Club     @relation(fields: [clubId], references: [id])

  // Connection settings
  connectionType  String   // "USB" | "ETHERNET"
  comPort         String?  // For USB: "COM3", "/dev/ttyUSB0"
  ipAddress       String?  // For Ethernet
  port            Int?     // For Ethernet

  // Berg settings
  pourWithRelease Boolean  @default(true) // true = wait for ACK
  timeout         Int      @default(5000) // ms

  // Status
  isConnected     Boolean  @default(false)
  lastConnected   DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model BergProduct {
  id              String   @id @default(cuid())
  clubId          String
  club            Club     @relation(fields: [clubId], references: [id])

  plu             String   // Berg PLU number (1-7 digits)
  brandName       String
  portionSize     String   // "SHOT", "ROCKS", "TALL", "BOTTLE"
  portionOz       Float    // Ounces

  // Link to ClubFlow product
  productId       String?
  product         Product? @relation(fields: [productId], references: [id])

  price           Float
  category        String   // "LIQUOR", "BEER", "WINE"

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([clubId, plu])
  @@index([clubId])
}

model BergPourLog {
  id              String   @id @default(cuid())
  clubId          String
  club            Club     @relation(fields: [clubId], references: [id])

  plu             String
  bergProduct     BergProduct? @relation(fields: [bergProductId], references: [id])
  bergProductId   String?

  // Transaction
  transactionId   String?
  transaction     FinancialTransaction? @relation(fields: [transactionId], references: [id])

  // Pour details
  authorized      Boolean  // ACK sent?
  pourTime        DateTime @default(now())
  bartenderId     String?

  // Reconciliation
  wasRungUp       Boolean  @default(false)
  varianceNotes   String?

  createdAt       DateTime @default(now())

  @@index([clubId, pourTime])
  @@index([clubId, wasRungUp]) // For variance reports
}
```

### Frontend Components to Create

#### 1. Berg Configuration Page
**File:** `frontend/src/components/settings/BergIntegration.tsx`

**Features:**
- Connection type selector (USB vs Ethernet)
- COM port / IP address configuration
- Test connection button
- Connection status indicator (green/red)
- Pour with/without release toggle
- Timeout configuration

#### 2. PLU Product Mapping
**File:** `frontend/src/components/settings/BergProductMapping.tsx`

**Features:**
- Import Berg brand CSV
- Display PLU → Product mapping table
- Map PLUs to ClubFlow products
- Edit prices, portions, categories
- Sync status (last sync, # products)

#### 3. Variance Report Dashboard
**File:** `frontend/src/components/reports/BergVarianceReport.tsx`

**Features:**
- Date range selector
- Table: PLU, Brand, Pours, Ring-Ups, Variance
- Charts: Over-pouring vs Under-ringing
- Export to CSV
- Flag suspicious patterns

#### 4. Real-time Pour Monitor (Optional)
**File:** `frontend/src/components/pos/BergPourMonitor.tsx`

**Features:**
- Live feed of pour requests
- Show: Time, Bartender, Brand, Portion, Status (ACK/NAK)
- Color coding: Green (ACK), Red (NAK), Yellow (Pending)

## Implementation Plan (6-Week Timeline)

### Week 1: Setup & Serial Communication
**Goal:** Establish serial communication with Berg dispenser

**Tasks:**
1. Install Node.js `serialport` library
2. Create `bergSerialService.js`
3. Implement packet parser (STX/ETX detection)
4. Implement LRC validation
5. Test with sample PLU packets (manual simulation)
6. Get Berg Universal Cable Kit + USB adapter

**Deliverables:**
- Serial port listener working
- Can parse PLU packets
- Can send ACK/NAK responses
- Unit tests for packet parsing

### Week 2: Database & Product Management
**Goal:** Store Berg products and configuration

**Tasks:**
1. Add Prisma models (BergConfiguration, BergProduct, BergPourLog)
2. Run migration: `npx prisma migrate dev`
3. Create Berg configuration API endpoints
4. Create PLU product import endpoint
5. Build CSV parser for Berg brand exports
6. Seed database with sample Berg products

**Deliverables:**
- Database schema updated
- API endpoints functional
- Can import Berg CSV files
- Sample data loaded

### Week 3: Integration Service & Authorization Logic
**Goal:** Implement pour authorization

**Tasks:**
1. Create `bergIntegrationService.js`
2. Implement PLU lookup in database
3. Implement authorization logic (ACK/NAK decision)
4. Create FinancialTransaction on ACK
5. Emit Socket.io events for real-time updates
6. Error handling and logging
7. Connection recovery logic

**Deliverables:**
- Full pour authorization flow working
- Transactions created automatically
- Real-time updates via Socket.io

### Week 4: Configuration UI
**Goal:** Build settings interface for Berg integration

**Tasks:**
1. Create `BergIntegration.tsx` settings page
2. Connection configuration form
3. Test connection functionality
4. Connection status indicator
5. Add to Settings navigation
6. Pour mode toggle (with/without release)

**Deliverables:**
- Settings UI complete
- Can configure connection from UI
- Visual connection status

### Week 5: Product Mapping & Reconciliation
**Goal:** Build product management and variance reporting

**Tasks:**
1. Create `BergProductMapping.tsx`
2. CSV import UI
3. PLU → Product mapping table
4. Create `BergVarianceReport.tsx`
5. Implement variance calculation logic
6. Export variance report to CSV
7. Charts for over/under patterns

**Deliverables:**
- Product mapping UI complete
- Variance reports functional
- Can export reconciliation data

### Week 6: Testing & Ethernet Support
**Goal:** Test with real Berg hardware, add Ethernet option

**Tasks:**
1. Connect to actual Berg dispenser (via Berg contacts)
2. Test with real pour requests
3. Add Ethernet/TCP support to `bergSerialService.js`
4. Ethernet configuration in UI
5. Performance testing (response time <500ms)
6. Documentation and training materials
7. Mark Feature #48 as complete

**Deliverables:**
- Tested with real Berg hardware
- Ethernet support added
- Documentation complete
- Feature #48 passes all tests

## Technical Challenges & Solutions

### Challenge 1: Serial Port Access on Cloud Server
**Problem:** ClubFlow backend runs on Vercel (cloud), Berg requires local serial port

**Solution:**
- Deploy lightweight "Berg Bridge" Node.js app on **local club hardware** (Raspberry Pi, NUC, old PC)
- Berg Bridge listens to serial port locally
- Berg Bridge forwards PLU packets to ClubFlow backend via HTTPS webhook
- ClubFlow backend sends ACK/NAK back to Berg Bridge
- Berg Bridge sends response to Berg dispenser

**Architecture:**
```
Berg Dispenser (Serial)
    ↓ USB/Ethernet
Berg Bridge (Local)
    ↓ HTTPS Webhook
ClubFlow Backend (Vercel)
    ↓ HTTPS Response
Berg Bridge (Local)
    ↓ Serial
Berg Dispenser (Dispenses)
```

**Berg Bridge Implementation:**
```javascript
// backend/berg-bridge/index.js (runs locally at club)
const SerialPort = require('serialport');
const axios = require('axios');

const port = new SerialPort('/dev/ttyUSB0', { baudRate: 9600 });

port.on('data', async (data) => {
  // Parse PLU packet
  const plu = parsePLUPacket(data);

  // Forward to ClubFlow backend
  const response = await axios.post('https://clubflow.vercel.app/api/berg-webhook', {
    clubId: 'abc123',
    plu: plu,
    timestamp: new Date()
  });

  // Send ACK/NAK back to Berg
  if (response.data.authorized) {
    port.write(Buffer.from([0x06])); // ACK
  } else {
    port.write(Buffer.from([0x15])); // NAK
  }
});
```

### Challenge 2: Response Time (<1 second)
**Problem:** Berg timeout is user-configurable but typically <1 second

**Solution:**
- Optimize database queries (indexed PLU lookup)
- Cache product mappings in memory
- Use Redis for fast PLU → Product lookup
- Webhook from Berg Bridge must be <500ms round-trip

### Challenge 3: PLU Synchronization
**Problem:** Keeping ClubFlow PLUs in sync with Berg Infinity software

**Solution:**
- **Primary method:** Import Berg brand CSV export
- **Backup method:** Manual PLU entry in ClubFlow
- **Reconciliation:** Weekly sync check (flag unmapped PLUs)

### Challenge 4: Network Reliability
**Problem:** Lost network connection = failed pours

**Solution:**
- Berg Bridge caches last 100 PLUs locally
- Falls back to local approval if ClubFlow unreachable
- Queue failed syncs for retry when connection restored
- Alert manager if offline >5 minutes

## Security Considerations

### 1. Prevent Unauthorized Pours
- Berg Bridge validates club API key before forwarding
- Rate limiting on webhook endpoint (max 100 pours/minute)
- Log all pour attempts (ACK and NAK)
- Alert on suspicious patterns (same PLU >20x in 1 hour)

### 2. Audit Trail
- `BergPourLog` records every pour request
- Timestamp, bartender ID, PLU, authorization decision
- Immutable log (append-only)
- Daily backup to S3

### 3. Data Integrity
- LRC checksum validation prevents corrupted data
- Transaction deduplication (prevent double-charging)
- Reconciliation reports catch discrepancies

## Testing Strategy

### Unit Tests
- PLU packet parsing
- LRC calculation
- ACK/NAK decision logic
- CSV import parsing

### Integration Tests
- Serial port mock (simulate Berg packets)
- Database transactions
- Webhook flow
- Error handling

### End-to-End Tests
1. Connect to test Berg dispenser
2. Attempt pour with valid PLU → expect ACK + transaction created
3. Attempt pour with invalid PLU → expect NAK + no transaction
4. Disconnect Berg → expect graceful error handling
5. Reconnect → expect auto-recovery

### Performance Tests
- Measure response time (target: <500ms)
- Stress test: 100 concurrent pour requests
- Network failure simulation
- Recovery time measurement

## Budget Estimate

### Hardware Costs
- Berg Universal Cable Kit: ~$100 (one-time, per club)
- USB-to-Serial adapter: ~$50 (one-time, per club)
- OR Serial-to-Ethernet adapter: ~$200-300 (for multi-dispenser)
- Optional: Raspberry Pi for Berg Bridge: ~$75 (one-time, per club)

**Total per club:** $150-$300 (USB) or $300-$500 (Ethernet)

### Development Costs
- 6 weeks development time
- No ongoing licensing fees (Berg uses serial, not API!)
- No per-transaction costs

### Ongoing Costs
- Minimal server costs (Berg Bridge can run on existing hardware)
- ClubFlow backend already deployed (no additional hosting)

## Success Metrics

### Technical KPIs
- ✅ Response time <500ms (95th percentile)
- ✅ 99.9% uptime for Berg Bridge
- ✅ <0.1% failed pour rate (excluding intentional NAKs)
- ✅ Zero transaction loss

### Business KPIs
- ✅ 100% of pours logged and reconciled
- ✅ Variance <2% (pours vs rings)
- ✅ Over-pour detection (immediate alerts)
- ✅ Inventory accuracy improvement >90%

## Next Steps (Immediate Actions)

### Action 1: Contact Berg for Hardware
- Reach out to Berg owner/chief technician
- Request:
  - Sample Berg dispenser for testing (loaner or purchase)
  - Berg Universal Cable Kit (Part 8009092)
  - USB-to-Serial adapter (Berg recommended model)
  - Sample brand CSV export
  - Access to Berg Infinity software (demo version)

### Action 2: Get Sample Data from Clubs
- Request from 2-3 clubs using Berg:
  - Export brand CSV with PLUs
  - Sample pour logs (if available)
  - Current pain points with existing POS integration
  - Wish list for ideal integration

### Action 3: Prototype Berg Bridge
- Set up local development environment
- Install `serialport` library
- Build basic packet parser
- Test with simulated packets
- Estimate response time

### Action 4: Update Plan File
- Mark "POS Research" as complete
- Add "Berg Integration Implementation" as new phase
- Update timeline based on hardware availability

## Documentation References

### Internal Docs
- [POS Research Plan](C:\Users\tonyt\.claude\plans\elegant-roaming-frog.md)
- Feature #48 in [feature_list.json](../feature_list.json)

### External Docs (from Berg)
- [Berg Basic Cash Register Interface Spec](C:\Users\tonyt\Downloads\basic.pdf) - Complete technical specification
- [POS Interface Compatibility List](C:\Users\tonyt\Downloads\POS-Interface-6.7.2018.pdf) - Dozens of compatible POS systems

### Technologies
- Node.js `serialport`: https://serialport.io/
- RS-232 Serial Protocol: Standard serial communication
- Berg Liquor Controls: https://bergliquorcontrols.com/

---

**Document Version:** 1.0
**Last Updated:** January 10, 2026
**Author:** ClubFlow Development Team
**Status:** Ready for Implementation
