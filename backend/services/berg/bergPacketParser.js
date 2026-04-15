/**
 * Berg PLU Packet Parser
 * Parses Berg Basic serial protocol packets (RS-232, 9600 baud, 8N1)
 *
 * Protocol Specification:
 * - Packet format: STX (Modifiers) PLU (Trailers) ETX LRC
 * - STX = 0x02 (Start of Transmission)
 * - ETX = 0x03 (End of Transmission)
 * - PLU = ASCII digits (0x30-0x39), 1-7 digits, no zero padding
 * - LRC = XOR checksum of all bytes (STX through ETX)
 *
 * Response:
 * - ACK = 0x06 (pour approved)
 * - NAK = 0x15 (pour denied)
 *
 * @see docs/BERG_INTEGRATION_TECHNICAL_SPEC.md
 */

// Protocol constants
const STX = 0x02;  // Start of Transmission
const ETX = 0x03;  // End of Transmission
const ACK = 0x06;  // Acknowledge (approve pour)
const NAK = 0x15;  // Negative Acknowledge (deny pour)

/**
 * Calculate LRC checksum (XOR of all bytes)
 *
 * @param {Buffer} buffer - Packet bytes (STX through ETX inclusive)
 * @returns {number} - LRC checksum byte (0x00-0xFF)
 *
 * @example
 * // From Berg spec: PLU=135 should give LRC=0x03
 * const packet = Buffer.from([0x02, 0x31, 0x33, 0x35, 0x03]);
 * const lrc = calculateLRC(packet); // Returns 0x03
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
 *
 * @param {Buffer} packet - Complete packet including STX, PLU, ETX, LRC
 * @returns {Object} Parse result
 * @returns {string|null} returns.plu - PLU number (e.g., "587")
 * @returns {boolean} returns.valid - Whether packet is valid
 * @returns {string|null} returns.error - Error message if invalid
 * @returns {Array<number>} returns.modifiers - Optional modifier bytes
 * @returns {Array<number>} returns.trailers - Optional trailer bytes
 *
 * @example
 * // Valid packet for PLU 587
 * const packet = Buffer.from([0x02, 0x35, 0x38, 0x37, 0x03, 0x3B]);
 * const result = parsePLUPacket(packet);
 * // Returns: { plu: "587", valid: true, error: null, modifiers: [], trailers: [] }
 *
 * @example
 * // Invalid packet (bad LRC)
 * const badPacket = Buffer.from([0x02, 0x35, 0x38, 0x37, 0x03, 0xFF]);
 * const result = parsePLUPacket(badPacket);
 * // Returns: { plu: null, valid: false, error: "LRC mismatch...", modifiers: [], trailers: [] }
 */
function parsePLUPacket(packet) {
  // Initialize result object
  const result = {
    plu: null,
    valid: false,
    error: null,
    modifiers: [],
    trailers: []
  };

  // Minimum packet: STX + 1 PLU digit + ETX + LRC = 4 bytes
  if (packet.length < 4) {
    result.error = `Packet too short: ${packet.length} bytes (minimum 4)`;
    return result;
  }

  // Validate STX (Start of Transmission)
  if (packet[0] !== STX) {
    result.error = `Missing STX: expected 0x02, got 0x${packet[0].toString(16).padStart(2, '0')}`;
    return result;
  }

  // Find ETX (End of Transmission)
  const etxIndex = packet.indexOf(ETX);
  if (etxIndex === -1) {
    result.error = 'Missing ETX (0x03)';
    return result;
  }

  // Validate packet length (must have LRC after ETX)
  if (etxIndex === packet.length - 1) {
    result.error = 'Missing LRC byte after ETX';
    return result;
  }

  // Extract LRC (byte immediately after ETX)
  const receivedLRC = packet[etxIndex + 1];

  // Calculate expected LRC (XOR of STX through ETX)
  const dataForLRC = packet.slice(0, etxIndex + 1);
  const expectedLRC = calculateLRC(dataForLRC);

  // Validate LRC checksum
  if (receivedLRC !== expectedLRC) {
    result.error = `LRC mismatch: expected 0x${expectedLRC.toString(16).padStart(2, '0')}, got 0x${receivedLRC.toString(16).padStart(2, '0')}`;
    return result;
  }

  // Extract data between STX and ETX
  const dataBytes = packet.slice(1, etxIndex);

  // Parse PLU and optional modifiers/trailers
  let plu = '';
  let inPLU = false;
  let beforePLU = true;

  for (let i = 0; i < dataBytes.length; i++) {
    const byte = dataBytes[i];

    // Check if byte is an ASCII digit (0x30-0x39 = '0'-'9')
    if (byte >= 0x30 && byte <= 0x39) {
      plu += String.fromCharCode(byte);
      inPLU = true;
      beforePLU = false;
    } else {
      // Non-digit byte (modifier or trailer)
      if (beforePLU) {
        // Bytes before PLU are modifiers
        result.modifiers.push(byte);
      } else if (inPLU) {
        // Bytes after PLU are trailers
        result.trailers.push(byte);
      }
    }
  }

  // Validate PLU was found
  if (plu.length === 0) {
    result.error = 'No PLU digits found in packet';
    return result;
  }

  // Success!
  result.plu = plu;
  result.valid = true;
  result.error = null;

  return result;
}

/**
 * Create ACK response byte (approve pour)
 *
 * @returns {Buffer} Single byte buffer containing ACK (0x06)
 *
 * @example
 * const ack = createACK();
 * serialPort.write(ack); // Send ACK to Berg dispenser
 */
function createACK() {
  return Buffer.from([ACK]);
}

/**
 * Create NAK response byte (deny pour)
 *
 * @returns {Buffer} Single byte buffer containing NAK (0x15)
 *
 * @example
 * const nak = createNAK();
 * serialPort.write(nak); // Send NAK to Berg dispenser
 */
function createNAK() {
  return Buffer.from([NAK]);
}

/**
 * Validate PLU format
 *
 * @param {string} plu - PLU number to validate
 * @returns {boolean} True if valid PLU format
 *
 * @example
 * isValidPLU("587")     // true
 * isValidPLU("1234567") // true (max 7 digits)
 * isValidPLU("12345678") // false (too long)
 * isValidPLU("ABC")     // false (not digits)
 */
function isValidPLU(plu) {
  // PLU must be:
  // - String of digits only
  // - 1-7 characters long
  // - Not zero
  if (typeof plu !== 'string') return false;
  if (plu.length < 1 || plu.length > 7) return false;
  if (!/^\d+$/.test(plu)) return false;
  if (plu === '0') return false;
  return true;
}

/**
 * Format packet for debugging/logging
 *
 * @param {Buffer} packet - Packet to format
 * @returns {string} Hex representation with labels
 *
 * @example
 * const packet = Buffer.from([0x02, 0x35, 0x38, 0x37, 0x03, 0x3B]);
 * console.log(formatPacket(packet));
 * // Output: "STX(02) 5(35) 8(38) 7(37) ETX(03) LRC(3B)"
 */
function formatPacket(packet) {
  const parts = [];

  for (let i = 0; i < packet.length; i++) {
    const byte = packet[i];
    const hex = byte.toString(16).padStart(2, '0').toUpperCase();

    if (i === 0 && byte === STX) {
      parts.push(`STX(${hex})`);
    } else if (byte === ETX) {
      parts.push(`ETX(${hex})`);
    } else if (byte >= 0x30 && byte <= 0x39) {
      // ASCII digit
      parts.push(`${String.fromCharCode(byte)}(${hex})`);
    } else if (i === packet.length - 1) {
      // Assume last byte is LRC
      parts.push(`LRC(${hex})`);
    } else {
      parts.push(`?(${hex})`);
    }
  }

  return parts.join(' ');
}

// Export functions and constants
module.exports = {
  // Constants
  STX,
  ETX,
  ACK,
  NAK,

  // Functions
  calculateLRC,
  parsePLUPacket,
  createACK,
  createNAK,
  isValidPLU,
  formatPacket
};
