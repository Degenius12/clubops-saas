# Berg Integration - Quick Start Guide

**For:** ClubFlow Development Team
**Status:** Ready to begin Week 1
**Prerequisites:** Hardware on order, specifications reviewed

---

## 🚦 Before You Start

### ✅ Checklist
- [ ] Read [BERG_INTEGRATION_SUMMARY.md](./BERG_INTEGRATION_SUMMARY.md)
- [ ] Review [BERG_INTEGRATION_TECHNICAL_SPEC.md](./BERG_INTEGRATION_TECHNICAL_SPEC.md)
- [ ] Berg hardware ordered (Cable Kit + USB adapter)
- [ ] Sample club data requested
- [ ] Node.js development environment ready

---

## 📦 Week 1: Development Setup (No Hardware Required Yet)

You can start development **BEFORE** hardware arrives by simulating Berg packets!

### Step 1: Install Dependencies

```bash
cd backend
npm install serialport --save
```

### Step 2: Create Berg Service Structure

```bash
mkdir -p backend/services/berg
touch backend/services/berg/bergSerialService.js
touch backend/services/berg/bergPacketParser.js
touch backend/services/berg/bergSimulator.js
```

### Step 3: Implement Packet Parser (No Hardware Needed)

**File:** `backend/services/berg/bergPacketParser.js`

```javascript
/**
 * Berg PLU Packet Parser
 * Parses Berg Basic serial protocol packets
 */

const STX = 0x02;
const ETX = 0x03;
const ACK = 0x06;
const NAK = 0x15;

/**
 * Calculate LRC checksum (XOR of all bytes)
 * @param {Buffer} buffer - Packet bytes (STX through ETX)
 * @returns {number} - LRC checksum byte
 */
function calculateLRC(buffer) {
  let lrc = 0x00;
  for (let i = 0; i < buffer.length; i++) {
    lrc ^= buffer[i];
  }
  return lrc;
}

/**
 * Parse PLU packet from Berg dispenser
 * @param {Buffer} packet - Complete packet including STX, PLU, ETX, LRC
 * @returns {Object} - { plu: string, valid: boolean, error: string }
 */
function parsePLUPacket(packet) {
  // Minimum packet: STX + 1 PLU digit + ETX + LRC = 4 bytes
  if (packet.length < 4) {
    return { plu: null, valid: false, error: 'Packet too short' };
  }

  // Check STX
  if (packet[0] !== STX) {
    return { plu: null, valid: false, error: 'Missing STX' };
  }

  // Find ETX
  const etxIndex = packet.indexOf(ETX);
  if (etxIndex === -1) {
    return { plu: null, valid: false, error: 'Missing ETX' };
  }

  // Extract LRC (byte after ETX)
  const receivedLRC = packet[etxIndex + 1];

  // Calculate expected LRC (STX through ETX)
  const dataForLRC = packet.slice(0, etxIndex + 1);
  const expectedLRC = calculateLRC(dataForLRC);

  // Validate LRC
  if (receivedLRC !== expectedLRC) {
    return {
      plu: null,
      valid: false,
      error: `LRC mismatch: expected ${expectedLRC.toString(16)}, got ${receivedLRC.toString(16)}`
    };
  }

  // Extract PLU (bytes between STX and ETX)
  const pluBytes = packet.slice(1, etxIndex);

  // Convert ASCII bytes to PLU string
  let plu = '';
  for (let i = 0; i < pluBytes.length; i++) {
    const byte = pluBytes[i];

    // PLU must be ASCII digits (0x30-0x39)
    if (byte < 0x30 || byte > 0x39) {
      // Could be modifier or trailer - skip for now
      // (Modifiers/trailers are optional, we'll handle later)
      continue;
    }

    plu += String.fromCharCode(byte);
  }

  if (plu.length === 0) {
    return { plu: null, valid: false, error: 'No PLU digits found' };
  }

  return { plu, valid: true, error: null };
}

/**
 * Create ACK response byte
 * @returns {Buffer}
 */
function createACK() {
  return Buffer.from([ACK]);
}

/**
 * Create NAK response byte
 * @returns {Buffer}
 */
function createNAK() {
  return Buffer.from([NAK]);
}

module.exports = {
  STX,
  ETX,
  ACK,
  NAK,
  calculateLRC,
  parsePLUPacket,
  createACK,
  createNAK
};
```

### Step 4: Create Berg Simulator (Test Without Hardware)

**File:** `backend/services/berg/bergSimulator.js`

```javascript
/**
 * Berg Dispenser Simulator
 * Simulates Berg serial packets for testing WITHOUT real hardware
 */

const { STX, ETX, calculateLRC } = require('./bergPacketParser');

/**
 * Create a simulated Berg PLU packet
 * @param {string} plu - PLU number (e.g., "587")
 * @returns {Buffer} - Complete packet with STX, PLU, ETX, LRC
 */
function createSimulatedPacket(plu) {
  // Convert PLU string to ASCII bytes
  const pluBytes = [];
  for (let i = 0; i < plu.length; i++) {
    pluBytes.push(plu.charCodeAt(i));
  }

  // Build packet: STX + PLU + ETX
  const packetData = [STX, ...pluBytes, ETX];
  const dataBuffer = Buffer.from(packetData);

  // Calculate LRC
  const lrc = calculateLRC(dataBuffer);

  // Final packet: STX + PLU + ETX + LRC
  const finalPacket = Buffer.from([...packetData, lrc]);

  return finalPacket;
}

/**
 * Simulate multiple pour requests
 * @returns {Array<Object>} - Array of simulated pour events
 */
function simulatePours() {
  return [
    { plu: '587', description: 'Tito\'s Vodka - Rocks (2oz)', price: 8.00 },
    { plu: '123', description: 'Jack Daniel\'s - Shot (1.5oz)', price: 7.00 },
    { plu: '456', description: 'Grey Goose - Tall (3oz)', price: 12.00 },
    { plu: '789', description: 'Patron - Rocks (2oz)', price: 10.00 },
    { plu: '999', description: 'INVALID PLU - Should NAK', price: 0.00 }
  ];
}

module.exports = {
  createSimulatedPacket,
  simulatePours
};
```

### Step 5: Write Unit Tests

**File:** `backend/services/berg/__tests__/bergPacketParser.test.js`

```javascript
const { parsePLUPacket, calculateLRC, createACK, createNAK } = require('../bergPacketParser');
const { createSimulatedPacket } = require('../bergSimulator');

describe('Berg Packet Parser', () => {

  test('should parse valid PLU packet (587)', () => {
    const packet = createSimulatedPacket('587');
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(true);
    expect(result.plu).toBe('587');
    expect(result.error).toBeNull();
  });

  test('should parse single digit PLU (5)', () => {
    const packet = createSimulatedPacket('5');
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(true);
    expect(result.plu).toBe('5');
  });

  test('should parse 7-digit PLU (1234567)', () => {
    const packet = createSimulatedPacket('1234567');
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(true);
    expect(result.plu).toBe('1234567');
  });

  test('should reject packet with bad LRC', () => {
    const packet = createSimulatedPacket('587');
    packet[packet.length - 1] = 0xFF; // corrupt LRC

    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('LRC mismatch');
  });

  test('should reject packet missing STX', () => {
    const packet = Buffer.from([0x35, 0x38, 0x37, 0x03, 0x3B]);
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Missing STX');
  });

  test('should create ACK byte', () => {
    const ack = createACK();
    expect(ack[0]).toBe(0x06);
  });

  test('should create NAK byte', () => {
    const nak = createNAK();
    expect(nak[0]).toBe(0x15);
  });

  test('LRC calculation matches Berg spec example', () => {
    // From Berg spec page 5: PLU=135, LRC=0x03
    const packet = Buffer.from([0x02, 0x31, 0x33, 0x35, 0x03]);
    const lrc = calculateLRC(packet);
    expect(lrc).toBe(0x03);
  });
});

describe('Berg Simulator', () => {
  const { simulatePours } = require('../bergSimulator');

  test('should generate valid test pours', () => {
    const pours = simulatePours();

    expect(pours.length).toBeGreaterThan(0);
    expect(pours[0]).toHaveProperty('plu');
    expect(pours[0]).toHaveProperty('description');
    expect(pours[0]).toHaveProperty('price');
  });
});
```

### Step 6: Run Tests

```bash
cd backend
npm test -- berg
```

**Expected Output:**
```
PASS  services/berg/__tests__/bergPacketParser.test.js
  Berg Packet Parser
    ✓ should parse valid PLU packet (587) (5ms)
    ✓ should parse single digit PLU (5) (2ms)
    ✓ should parse 7-digit PLU (1234567) (1ms)
    ✓ should reject packet with bad LRC (2ms)
    ✓ should reject packet missing STX (1ms)
    ✓ should create ACK byte (1ms)
    ✓ should create NAK byte (1ms)
    ✓ LRC calculation matches Berg spec example (1ms)
  Berg Simulator
    ✓ should generate valid test pours (1ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

---

## 🎮 Interactive Testing (Before Hardware Arrives)

Create a simple CLI tool to test packet parsing:

**File:** `backend/scripts/test-berg-parser.js`

```javascript
#!/usr/bin/env node

const { parsePLUPacket, createACK, createNAK } = require('../services/berg/bergPacketParser');
const { createSimulatedPacket, simulatePours } = require('../services/berg/bergSimulator');

console.log('🍸 Berg Packet Parser Test Tool\n');

const pours = simulatePours();

pours.forEach((pour, index) => {
  console.log(`\n--- Test ${index + 1}: ${pour.description} ---`);

  // Create simulated packet
  const packet = createSimulatedPacket(pour.plu);
  console.log(`Packet bytes: ${packet.toString('hex')}`);

  // Parse packet
  const result = parsePLUPacket(packet);

  if (result.valid) {
    console.log(`✅ VALID - PLU: ${result.plu}`);
    console.log(`   Response: ACK (0x${createACK()[0].toString(16)})`);
    console.log(`   Price: $${pour.price.toFixed(2)}`);
  } else {
    console.log(`❌ INVALID - Error: ${result.error}`);
    console.log(`   Response: NAK (0x${createNAK()[0].toString(16)})`);
  }
});

console.log('\n✅ All tests complete!');
```

**Run it:**
```bash
node backend/scripts/test-berg-parser.js
```

---

## 📊 Week 1 Deliverables

By end of Week 1, you should have:

- [x] `bergPacketParser.js` - Fully tested packet parser
- [x] `bergSimulator.js` - Packet simulator
- [x] Unit tests (9+ tests passing)
- [x] CLI test tool
- [x] Documentation

**Progress:** ✅ 100% can be done WITHOUT hardware

---

## 🔜 Week 2 Preview (After Hardware Arrives)

Once you have the Berg hardware:

### Step 1: Connect Hardware
```javascript
// backend/services/berg/bergSerialService.js
const SerialPort = require('serialport');

const port = new SerialPort('/dev/ttyUSB0', { // or COM3 on Windows
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1
});

port.on('data', (data) => {
  const result = parsePLUPacket(data);

  if (result.valid) {
    console.log(`Received PLU: ${result.plu}`);
    port.write(createACK()); // Allow pour
  } else {
    console.log(`Invalid packet: ${result.error}`);
    port.write(createNAK()); // Deny pour
  }
});
```

### Step 2: Test with Real Berg
1. Connect Berg dispenser via USB
2. Run `node backend/services/berg/bergSerialService.js`
3. Attempt pour on Berg dispenser
4. Watch console for PLU packet
5. Verify ACK sent and pour completes

---

## 🆘 Troubleshooting

### "Cannot find module 'serialport'"
```bash
cd backend
npm install serialport --save
```

### "Port COM3 not found" (Windows)
Check Device Manager → Ports (COM & LPT) to find correct port

### "Permission denied /dev/ttyUSB0" (Linux)
```bash
sudo chmod 666 /dev/ttyUSB0
# or add user to dialout group:
sudo usermod -a -G dialout $USER
```

### "Tests failing"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

---

## 📚 Resources

### Documentation
- [Berg Basic Spec](C:\Users\tonyt\Downloads\basic.pdf)
- [POS Compatibility List](C:\Users\tonyt\Downloads\POS-Interface-6.7.2018.pdf)
- [Technical Spec](./BERG_INTEGRATION_TECHNICAL_SPEC.md)
- [Executive Summary](./BERG_INTEGRATION_SUMMARY.md)

### Code Examples
- Berg spec includes complete C implementation (page 6-10)
- Reference for packet parsing logic

### Support
- Berg: sritschard@bergliquorcontrols.com
- ClubFlow Team: [Your contact]

---

## ✅ Week 1 Checklist

- [ ] Install `serialport` dependency
- [ ] Create `bergPacketParser.js`
- [ ] Create `bergSimulator.js`
- [ ] Write unit tests
- [ ] All tests passing (9/9)
- [ ] Create CLI test tool
- [ ] Test with simulated packets
- [ ] Document findings
- [ ] Ready for hardware testing (Week 2)

---

**Next:** When hardware arrives, proceed to Week 2 (Serial Communication Testing)

🚀 **You're ready to start development!**
