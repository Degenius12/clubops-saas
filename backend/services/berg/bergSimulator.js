/**
 * Berg Dispenser Simulator
 * Simulates Berg serial packets for testing WITHOUT real hardware
 *
 * This allows development and testing before Berg hardware arrives.
 * Creates valid PLU packets matching the Berg Basic protocol specification.
 *
 * @see docs/BERG_INTEGRATION_TECHNICAL_SPEC.md
 */

const { STX, ETX, calculateLRC } = require('./bergPacketParser');

/**
 * Create a simulated Berg PLU packet
 *
 * @param {string} plu - PLU number (e.g., "587")
 * @param {Object} options - Optional packet customization
 * @param {Array<number>} options.modifiers - Modifier bytes (optional)
 * @param {Array<number>} options.trailers - Trailer bytes (optional)
 * @returns {Buffer} Complete packet with STX, PLU, ETX, LRC
 *
 * @example
 * // Simple PLU packet
 * const packet = createSimulatedPacket('587');
 * // Returns: Buffer [0x02, 0x35, 0x38, 0x37, 0x03, 0x3B]
 *
 * @example
 * // Packet with modifier (portion size indicator)
 * const packet = createSimulatedPacket('587', { modifiers: [0x05] });
 * // STX, modifier(0x05), PLU(587), ETX, LRC
 */
function createSimulatedPacket(plu, options = {}) {
  const { modifiers = [], trailers = [] } = options;

  // Convert PLU string to ASCII bytes
  const pluBytes = [];
  for (let i = 0; i < plu.length; i++) {
    pluBytes.push(plu.charCodeAt(i));
  }

  // Build packet: STX + (modifiers) + PLU + (trailers) + ETX
  const packetData = [
    STX,
    ...modifiers,
    ...pluBytes,
    ...trailers,
    ETX
  ];

  const dataBuffer = Buffer.from(packetData);

  // Calculate LRC checksum
  const lrc = calculateLRC(dataBuffer);

  // Final packet: STX + (modifiers) + PLU + (trailers) + ETX + LRC
  const finalPacket = Buffer.from([...packetData, lrc]);

  return finalPacket;
}

/**
 * Create a corrupted packet (for testing error handling)
 *
 * @param {string} plu - PLU number
 * @param {string} corruptionType - Type of corruption
 * @returns {Buffer} Corrupted packet
 *
 * @example
 * // Packet with bad LRC
 * const badPacket = createCorruptedPacket('587', 'bad_lrc');
 *
 * @example
 * // Packet missing STX
 * const noStx = createCorruptedPacket('587', 'no_stx');
 */
function createCorruptedPacket(plu, corruptionType = 'bad_lrc') {
  const validPacket = createSimulatedPacket(plu);

  switch (corruptionType) {
    case 'bad_lrc':
      // Corrupt the LRC byte
      validPacket[validPacket.length - 1] = 0xFF;
      return validPacket;

    case 'no_stx':
      // Remove STX byte
      return validPacket.slice(1);

    case 'no_etx':
      // Remove ETX and LRC
      return validPacket.slice(0, validPacket.length - 2);

    case 'no_lrc':
      // Remove LRC byte
      return validPacket.slice(0, validPacket.length - 1);

    case 'too_short':
      // Packet with only 2 bytes
      return Buffer.from([STX, ETX]);

    case 'random_data':
      // Random garbage
      return Buffer.from([0xFF, 0xAA, 0x55, 0x00]);

    default:
      return validPacket;
  }
}

/**
 * Sample liquor products with PLUs
 * Simulates a typical club's Berg configuration
 *
 * @returns {Array<Object>} Array of product configurations
 *
 * @example
 * const products = getSampleProducts();
 * // Returns array of: { plu, brand, portionSize, portionOz, price, category }
 */
function getSampleProducts() {
  return [
    // Vodka
    { plu: '100', brand: 'Tito\'s Vodka', portionSize: 'SHOT', portionOz: 1.5, price: 7.00, category: 'VODKA' },
    { plu: '101', brand: 'Tito\'s Vodka', portionSize: 'ROCKS', portionOz: 2.0, price: 8.00, category: 'VODKA' },
    { plu: '102', brand: 'Tito\'s Vodka', portionSize: 'TALL', portionOz: 3.0, price: 10.00, category: 'VODKA' },
    { plu: '103', brand: 'Tito\'s Vodka', portionSize: 'BOTTLE', portionOz: 25.4, price: 200.00, category: 'VODKA' },

    { plu: '200', brand: 'Grey Goose', portionSize: 'SHOT', portionOz: 1.5, price: 10.00, category: 'VODKA' },
    { plu: '201', brand: 'Grey Goose', portionSize: 'ROCKS', portionOz: 2.0, price: 12.00, category: 'VODKA' },
    { plu: '202', brand: 'Grey Goose', portionSize: 'TALL', portionOz: 3.0, price: 15.00, category: 'VODKA' },
    { plu: '203', brand: 'Grey Goose', portionSize: 'BOTTLE', portionOz: 25.4, price: 350.00, category: 'VODKA' },

    // Whiskey
    { plu: '300', brand: 'Jack Daniel\'s', portionSize: 'SHOT', portionOz: 1.5, price: 7.00, category: 'WHISKEY' },
    { plu: '301', brand: 'Jack Daniel\'s', portionSize: 'ROCKS', portionOz: 2.0, price: 8.00, category: 'WHISKEY' },
    { plu: '302', brand: 'Jack Daniel\'s', portionSize: 'TALL', portionOz: 3.0, price: 10.00, category: 'WHISKEY' },
    { plu: '303', brand: 'Jack Daniel\'s', portionSize: 'BOTTLE', portionOz: 25.4, price: 180.00, category: 'WHISKEY' },

    { plu: '400', brand: 'Crown Royal', portionSize: 'SHOT', portionOz: 1.5, price: 8.00, category: 'WHISKEY' },
    { plu: '401', brand: 'Crown Royal', portionSize: 'ROCKS', portionOz: 2.0, price: 9.00, category: 'WHISKEY' },
    { plu: '402', brand: 'Crown Royal', portionSize: 'TALL', portionOz: 3.0, price: 12.00, category: 'WHISKEY' },
    { plu: '403', brand: 'Crown Royal', portionSize: 'BOTTLE', portionOz: 25.4, price: 220.00, category: 'WHISKEY' },

    // Tequila
    { plu: '500', brand: 'Patron Silver', portionSize: 'SHOT', portionOz: 1.5, price: 10.00, category: 'TEQUILA' },
    { plu: '501', brand: 'Patron Silver', portionSize: 'ROCKS', portionOz: 2.0, price: 12.00, category: 'TEQUILA' },
    { plu: '502', brand: 'Patron Silver', portionSize: 'TALL', portionOz: 3.0, price: 15.00, category: 'TEQUILA' },
    { plu: '503', brand: 'Patron Silver', portionSize: 'BOTTLE', portionOz: 25.4, price: 300.00, category: 'TEQUILA' },

    { plu: '600', brand: 'Don Julio', portionSize: 'SHOT', portionOz: 1.5, price: 12.00, category: 'TEQUILA' },
    { plu: '601', brand: 'Don Julio', portionSize: 'ROCKS', portionOz: 2.0, price: 14.00, category: 'TEQUILA' },
    { plu: '602', brand: 'Don Julio', portionSize: 'TALL', portionOz: 3.0, price: 18.00, category: 'TEQUILA' },
    { plu: '603', brand: 'Don Julio', portionSize: 'BOTTLE', portionOz: 25.4, price: 350.00, category: 'TEQUILA' },

    // Rum
    { plu: '700', brand: 'Bacardi', portionSize: 'SHOT', portionOz: 1.5, price: 6.00, category: 'RUM' },
    { plu: '701', brand: 'Bacardi', portionSize: 'ROCKS', portionOz: 2.0, price: 7.00, category: 'RUM' },
    { plu: '702', brand: 'Bacardi', portionSize: 'TALL', portionOz: 3.0, price: 9.00, category: 'RUM' },
    { plu: '703', brand: 'Bacardi', portionSize: 'BOTTLE', portionOz: 25.4, price: 150.00, category: 'RUM' },

    // Gin
    { plu: '800', brand: 'Tanqueray', portionSize: 'SHOT', portionOz: 1.5, price: 7.00, category: 'GIN' },
    { plu: '801', brand: 'Tanqueray', portionSize: 'ROCKS', portionOz: 2.0, price: 8.00, category: 'GIN' },
    { plu: '802', brand: 'Tanqueray', portionSize: 'TALL', portionOz: 3.0, price: 10.00, category: 'GIN' },
    { plu: '803', brand: 'Tanqueray', portionSize: 'BOTTLE', portionOz: 25.4, price: 180.00, category: 'GIN' }
  ];
}

/**
 * Simulate multiple pour requests (for testing)
 *
 * @param {number} count - Number of pours to simulate
 * @param {Object} options - Simulation options
 * @param {boolean} options.includeInvalid - Include invalid PLUs for NAK testing
 * @param {boolean} options.includeCorrupted - Include corrupted packets
 * @returns {Array<Object>} Array of simulated pour events
 *
 * @example
 * const pours = simulatePours(5);
 * // Returns 5 random pour requests
 *
 * @example
 * const pours = simulatePours(10, { includeInvalid: true });
 * // Returns 10 pours, some with invalid PLUs
 */
function simulatePours(count = 5, options = {}) {
  const { includeInvalid = false, includeCorrupted = false } = options;

  const products = getSampleProducts();
  const pours = [];

  for (let i = 0; i < count; i++) {
    let product;
    let packet;
    let isValid = true;
    let corruption = null;

    if (includeInvalid && i % 5 === 4) {
      // Every 5th pour: invalid PLU
      product = { plu: '999', brand: 'INVALID PLU', portionSize: 'N/A', portionOz: 0, price: 0.00, category: 'INVALID' };
      packet = createSimulatedPacket('999');
      isValid = false;
    } else if (includeCorrupted && i % 7 === 6) {
      // Every 7th pour: corrupted packet
      product = products[i % products.length];
      packet = createCorruptedPacket(product.plu, 'bad_lrc');
      isValid = false;
      corruption = 'bad_lrc';
    } else {
      // Normal pour
      product = products[i % products.length];
      packet = createSimulatedPacket(product.plu);
    }

    pours.push({
      ...product,
      packet,
      isValid,
      corruption,
      timestamp: new Date(Date.now() + i * 1000) // Stagger timestamps
    });
  }

  return pours;
}

/**
 * Generate Berg brand CSV export (for testing product import)
 *
 * @returns {string} CSV formatted brand export
 *
 * @example
 * const csv = generateBergCSV();
 * fs.writeFileSync('berg-brands.csv', csv);
 */
function generateBergCSV() {
  const products = getSampleProducts();
  const headers = 'PLU,Brand,Portion,Ounces,Price,Category\n';

  const rows = products.map(p =>
    `${p.plu},"${p.brand}",${p.portionSize},${p.portionOz},${p.price.toFixed(2)},${p.category}`
  ).join('\n');

  return headers + rows;
}

/**
 * Create a simple test scenario
 *
 * @returns {Object} Test scenario with expected results
 *
 * @example
 * const scenario = createTestScenario();
 * // Run through scenario to test integration
 */
function createTestScenario() {
  return {
    name: 'Typical Friday Night Service',
    description: 'Simulates 2-hour Friday night with mixed pours',
    duration: '2 hours',
    steps: [
      { time: '21:00', plu: '101', brand: 'Tito\'s Vodka - Rocks', expectedACK: true },
      { time: '21:03', plu: '300', brand: 'Jack Daniel\'s - Shot', expectedACK: true },
      { time: '21:05', plu: '201', brand: 'Grey Goose - Rocks', expectedACK: true },
      { time: '21:12', plu: '500', brand: 'Patron - Shot', expectedACK: true },
      { time: '21:15', plu: '999', brand: 'INVALID PLU', expectedACK: false },
      { time: '21:18', plu: '302', brand: 'Jack Daniel\'s - Tall', expectedACK: true },
      { time: '21:25', plu: '203', brand: 'Grey Goose - Bottle', expectedACK: true },
      { time: '21:30', plu: '101', brand: 'Tito\'s Vodka - Rocks', expectedACK: true },
      { time: '22:00', plu: '503', brand: 'Patron - Bottle', expectedACK: true },
      { time: '22:15', plu: '101', brand: 'Tito\'s Vodka - Rocks', expectedACK: true }
    ],
    expectedStats: {
      totalPours: 10,
      approvedPours: 9,
      deniedPours: 1,
      totalRevenue: 594.00, // Sum of all approved pour prices
      bottlesSold: 2
    }
  };
}

// Export functions
module.exports = {
  createSimulatedPacket,
  createCorruptedPacket,
  getSampleProducts,
  simulatePours,
  generateBergCSV,
  createTestScenario
};
