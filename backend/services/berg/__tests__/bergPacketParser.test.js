/**
 * Berg Packet Parser Unit Tests
 * Tests packet parsing, LRC validation, and protocol compliance
 */

const {
  STX,
  ETX,
  ACK,
  NAK,
  calculateLRC,
  parsePLUPacket,
  createACK,
  createNAK,
  isValidPLU,
  formatPacket
} = require('../bergPacketParser');

const {
  createSimulatedPacket,
  createCorruptedPacket,
  getSampleProducts
} = require('../bergSimulator');

describe('Berg Protocol Constants', () => {
  test('STX should be 0x02', () => {
    expect(STX).toBe(0x02);
  });

  test('ETX should be 0x03', () => {
    expect(ETX).toBe(0x03);
  });

  test('ACK should be 0x06', () => {
    expect(ACK).toBe(0x06);
  });

  test('NAK should be 0x15', () => {
    expect(NAK).toBe(0x15);
  });
});

describe('LRC Checksum Calculation', () => {
  test('should calculate LRC for Berg spec example (PLU=135)', () => {
    // From Berg Basic spec page 5: PLU=135
    // XOR: 0x02 ^ 0x31 ^ 0x33 ^ 0x35 ^ 0x03 = 0x36
    const packet = Buffer.from([0x02, 0x31, 0x33, 0x35, 0x03]);
    const lrc = calculateLRC(packet);
    expect(lrc).toBe(0x36);
  });

  test('should calculate LRC for PLU=587', () => {
    // Example from email spec
    const packet = Buffer.from([0x02, 0x35, 0x38, 0x37, 0x03]);
    const lrc = calculateLRC(packet);
    expect(lrc).toBe(0x3B);
  });

  test('should return 0x00 for empty buffer', () => {
    const lrc = calculateLRC(Buffer.from([]));
    expect(lrc).toBe(0x00);
  });

  test('should be commutative (XOR property)', () => {
    const packet1 = Buffer.from([0x02, 0x35, 0x38]);
    const packet2 = Buffer.from([0x38, 0x35, 0x02]);
    expect(calculateLRC(packet1)).toBe(calculateLRC(packet2));
  });
});

describe('PLU Packet Parsing - Valid Packets', () => {
  test('should parse valid 3-digit PLU (587)', () => {
    const packet = createSimulatedPacket('587');
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(true);
    expect(result.plu).toBe('587');
    expect(result.error).toBeNull();
    expect(result.modifiers).toEqual([]);
    expect(result.trailers).toEqual([]);
  });

  test('should parse single digit PLU (5)', () => {
    const packet = createSimulatedPacket('5');
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(true);
    expect(result.plu).toBe('5');
    expect(result.error).toBeNull();
  });

  test('should parse maximum 7-digit PLU (1234567)', () => {
    const packet = createSimulatedPacket('1234567');
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(true);
    expect(result.plu).toBe('1234567');
    expect(result.error).toBeNull();
  });

  test('should parse PLU with leading zeros (00123)', () => {
    const packet = createSimulatedPacket('00123');
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(true);
    expect(result.plu).toBe('00123');
  });

  test('should parse all sample product PLUs', () => {
    const products = getSampleProducts();

    products.forEach(product => {
      const packet = createSimulatedPacket(product.plu);
      const result = parsePLUPacket(packet);

      expect(result.valid).toBe(true);
      expect(result.plu).toBe(product.plu);
      expect(result.error).toBeNull();
    });
  });
});

describe('PLU Packet Parsing - With Modifiers/Trailers', () => {
  test('should parse packet with modifier byte', () => {
    const packet = createSimulatedPacket('587', { modifiers: [0x05] });
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(true);
    expect(result.plu).toBe('587');
    expect(result.modifiers).toEqual([0x05]);
    expect(result.trailers).toEqual([]);
  });

  test('should parse packet with trailer byte', () => {
    const packet = createSimulatedPacket('587', { trailers: [0x0D] });
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(true);
    expect(result.plu).toBe('587');
    expect(result.modifiers).toEqual([]);
    expect(result.trailers).toEqual([0x0D]);
  });

  test('should parse packet with both modifiers and trailers', () => {
    const packet = createSimulatedPacket('587', {
      modifiers: [0x05, 0x14],
      trailers: [0x0D, 0x21]
    });
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(true);
    expect(result.plu).toBe('587');
    expect(result.modifiers).toEqual([0x05, 0x14]);
    expect(result.trailers).toEqual([0x0D, 0x21]);
  });
});

describe('PLU Packet Parsing - Invalid Packets', () => {
  test('should reject packet with bad LRC', () => {
    const packet = createCorruptedPacket('587', 'bad_lrc');
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(false);
    expect(result.plu).toBeNull();
    expect(result.error).toContain('LRC mismatch');
  });

  test('should reject packet missing STX', () => {
    const packet = createCorruptedPacket('587', 'no_stx');
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing STX');
  });

  test('should reject packet missing ETX', () => {
    const packet = createCorruptedPacket('587', 'no_etx');
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing ETX');
  });

  test('should reject packet missing LRC', () => {
    const packet = createCorruptedPacket('587', 'no_lrc');
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing LRC');
  });

  test('should reject packet that is too short', () => {
    const packet = createCorruptedPacket('587', 'too_short');
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('too short');
  });

  test('should reject random garbage data', () => {
    const packet = createCorruptedPacket('587', 'random_data');
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(false);
  });

  test('should reject packet with no PLU digits', () => {
    // Packet with only modifiers/trailers, no actual PLU
    const packet = Buffer.from([STX, 0x05, 0x14, ETX]);
    const lrc = calculateLRC(packet);
    const fullPacket = Buffer.from([...packet, lrc]);

    const result = parsePLUPacket(fullPacket);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('No PLU digits');
  });
});

describe('ACK/NAK Response Creation', () => {
  test('should create ACK byte (0x06)', () => {
    const ack = createACK();

    expect(Buffer.isBuffer(ack)).toBe(true);
    expect(ack.length).toBe(1);
    expect(ack[0]).toBe(0x06);
  });

  test('should create NAK byte (0x15)', () => {
    const nak = createNAK();

    expect(Buffer.isBuffer(nak)).toBe(true);
    expect(nak.length).toBe(1);
    expect(nak[0]).toBe(0x15);
  });

  test('ACK and NAK should be different', () => {
    const ack = createACK();
    const nak = createNAK();

    expect(ack[0]).not.toBe(nak[0]);
  });
});

describe('PLU Validation', () => {
  test('should validate correct PLUs', () => {
    expect(isValidPLU('1')).toBe(true);
    expect(isValidPLU('123')).toBe(true);
    expect(isValidPLU('587')).toBe(true);
    expect(isValidPLU('1234567')).toBe(true);
  });

  test('should reject invalid PLUs', () => {
    expect(isValidPLU('0')).toBe(false); // Zero not allowed
    expect(isValidPLU('')).toBe(false); // Empty
    expect(isValidPLU('12345678')).toBe(false); // Too long (>7)
    expect(isValidPLU('ABC')).toBe(false); // Not digits
    expect(isValidPLU('12A34')).toBe(false); // Mixed
    expect(isValidPLU(123)).toBe(false); // Not string
    expect(isValidPLU(null)).toBe(false);
    expect(isValidPLU(undefined)).toBe(false);
  });
});

describe('Packet Formatting (Debugging)', () => {
  test('should format packet for logging', () => {
    const packet = createSimulatedPacket('587');
    const formatted = formatPacket(packet);

    expect(formatted).toContain('STX');
    expect(formatted).toContain('ETX');
    expect(formatted).toContain('LRC');
    expect(formatted).toContain('5');
    expect(formatted).toContain('8');
    expect(formatted).toContain('7');
  });

  test('should handle empty packet', () => {
    const formatted = formatPacket(Buffer.from([]));
    expect(typeof formatted).toBe('string');
  });
});

describe('Real-World Scenarios', () => {
  test('should handle rapid sequential pours', () => {
    const pours = [
      createSimulatedPacket('101'), // Tito's Rocks
      createSimulatedPacket('300'), // Jack Shot
      createSimulatedPacket('201'), // Grey Goose Rocks
      createSimulatedPacket('500')  // Patron Shot
    ];

    pours.forEach(packet => {
      const result = parsePLUPacket(packet);
      expect(result.valid).toBe(true);
      expect(result.plu).toBeTruthy();
    });
  });

  test('should handle corrupted packet followed by valid packet', () => {
    const corruptedPacket = createCorruptedPacket('101', 'bad_lrc');
    const validPacket = createSimulatedPacket('101');

    const result1 = parsePLUPacket(corruptedPacket);
    expect(result1.valid).toBe(false);

    const result2 = parsePLUPacket(validPacket);
    expect(result2.valid).toBe(true);
    expect(result2.plu).toBe('101');
  });

  test('should parse packet matching Berg spec example exactly', () => {
    // From email spec: PLU = 587
    // Data Sent by Berg: 0x02 0x35 0x38 0x37 0x03 0x3B
    const packet = Buffer.from([0x02, 0x35, 0x38, 0x37, 0x03, 0x3B]);
    const result = parsePLUPacket(packet);

    expect(result.valid).toBe(true);
    expect(result.plu).toBe('587');
    expect(result.error).toBeNull();
  });
});

describe('Performance Tests', () => {
  test('should parse 1000 packets quickly', () => {
    const startTime = Date.now();
    const products = getSampleProducts();

    for (let i = 0; i < 1000; i++) {
      const product = products[i % products.length];
      const packet = createSimulatedPacket(product.plu);
      const result = parsePLUPacket(packet);
      expect(result.valid).toBe(true);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should parse 1000 packets in under 500ms (fast enough for real-world use)
    expect(duration).toBeLessThan(500);
  });
});
