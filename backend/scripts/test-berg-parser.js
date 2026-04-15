#!/usr/bin/env node

/**
 * Berg Packet Parser Interactive Test Tool
 *
 * Tests packet parsing without actual Berg hardware.
 * Simulates pour requests and shows ACK/NAK responses.
 *
 * Usage:
 *   node backend/scripts/test-berg-parser.js
 */

const {
  parsePLUPacket,
  createACK,
  createNAK,
  formatPacket
} = require('../services/berg/bergPacketParser');

const {
  createSimulatedPacket,
  createCorruptedPacket,
  simulatePours,
  createTestScenario,
  getSampleProducts
} = require('../services/berg/bergSimulator');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(text) {
  console.log('\n' + colorize('═'.repeat(70), 'cyan'));
  console.log(colorize(` ${text}`, 'bright'));
  console.log(colorize('═'.repeat(70), 'cyan'));
}

function printSection(text) {
  console.log('\n' + colorize(`─── ${text} `, 'blue') + colorize('─'.repeat(60 - text.length), 'blue'));
}

function printSuccess(text) {
  console.log(colorize('✅ ', 'green') + text);
}

function printError(text) {
  console.log(colorize('❌ ', 'red') + text);
}

function printInfo(text) {
  console.log(colorize('ℹ️  ', 'cyan') + text);
}

function printWarning(text) {
  console.log(colorize('⚠️  ', 'yellow') + text);
}

/**
 * Test individual packet parsing
 */
function testIndividualPackets() {
  printHeader('Berg Packet Parser - Individual Tests');

  const testCases = [
    { plu: '587', description: 'Tito\'s Vodka - Rocks (2oz)', price: 8.00, shouldPass: true },
    { plu: '123', description: 'Jack Daniel\'s - Shot (1.5oz)', price: 7.00, shouldPass: true },
    { plu: '1', description: 'Single digit PLU', price: 5.00, shouldPass: true },
    { plu: '1234567', description: 'Maximum 7-digit PLU', price: 15.00, shouldPass: true },
    { plu: '999', description: 'Invalid PLU (not in database)', price: 0.00, shouldPass: true }, // Valid packet, but unknown product
  ];

  testCases.forEach((testCase, index) => {
    printSection(`Test ${index + 1}: ${testCase.description}`);

    // Create simulated packet
    const packet = createSimulatedPacket(testCase.plu);
    printInfo(`Packet bytes: ${colorize(formatPacket(packet), 'white')}`);
    printInfo(`Raw hex:      ${colorize(packet.toString('hex').toUpperCase(), 'white')}`);

    // Parse packet
    const result = parsePLUPacket(packet);

    if (result.valid) {
      printSuccess(`VALID - PLU: ${colorize(result.plu, 'bright')}`);
      printInfo(`Response: ${colorize('ACK (0x06)', 'green')}`);
      printInfo(`Price: ${colorize('$' + testCase.price.toFixed(2), 'white')}`);

      if (testCase.plu === '999') {
        printWarning('PLU not in database → Should send NAK in real implementation');
      }
    } else {
      printError(`INVALID - Error: ${result.error}`);
      printInfo(`Response: ${colorize('NAK (0x15)', 'red')}`);
    }
  });
}

/**
 * Test corrupted packets
 */
function testCorruptedPackets() {
  printHeader('Berg Packet Parser - Error Handling Tests');

  const corruptionTypes = [
    { type: 'bad_lrc', description: 'Corrupted LRC checksum' },
    { type: 'no_stx', description: 'Missing STX byte' },
    { type: 'no_etx', description: 'Missing ETX byte' },
    { type: 'no_lrc', description: 'Missing LRC byte' },
    { type: 'too_short', description: 'Packet too short' },
    { type: 'random_data', description: 'Random garbage data' }
  ];

  corruptionTypes.forEach((corruption, index) => {
    printSection(`Error Test ${index + 1}: ${corruption.description}`);

    const packet = createCorruptedPacket('587', corruption.type);
    printInfo(`Packet bytes: ${colorize(formatPacket(packet), 'white')}`);
    printInfo(`Raw hex:      ${colorize(packet.toString('hex').toUpperCase(), 'white')}`);

    const result = parsePLUPacket(packet);

    if (!result.valid) {
      printSuccess(`Correctly rejected: ${result.error}`);
      printInfo(`Response: ${colorize('NAK (0x15)', 'red')}`);
    } else {
      printError(`UNEXPECTED: Packet should have been rejected but was accepted!`);
    }
  });
}

/**
 * Test rapid sequential pours
 */
function testSequentialPours() {
  printHeader('Berg Packet Parser - Sequential Pour Simulation');

  const pours = simulatePours(10, { includeInvalid: true });

  printInfo(`Simulating ${pours.length} rapid sequential pours...`);
  console.log();

  let approvedCount = 0;
  let deniedCount = 0;
  let totalRevenue = 0;

  pours.forEach((pour, index) => {
    const result = parsePLUPacket(pour.packet);

    const timeStr = colorize(pour.timestamp.toLocaleTimeString(), 'cyan');
    const pluStr = colorize(pour.plu.padEnd(7), 'white');
    const brandStr = pour.brand.substring(0, 30).padEnd(30);

    if (result.valid && pour.plu !== '999') {
      approvedCount++;
      totalRevenue += pour.price;
      console.log(`${timeStr} | PLU ${pluStr} | ${brandStr} | ${colorize('ACK', 'green')} | $${pour.price.toFixed(2)}`);
    } else {
      deniedCount++;
      console.log(`${timeStr} | PLU ${pluStr} | ${brandStr} | ${colorize('NAK', 'red')} | $0.00`);
    }
  });

  printSection('Summary');
  printInfo(`Total pours:    ${pours.length}`);
  printSuccess(`Approved (ACK): ${approvedCount}`);
  printError(`Denied (NAK):   ${deniedCount}`);
  printInfo(`Total revenue:  ${colorize('$' + totalRevenue.toFixed(2), 'bright')}`);
}

/**
 * Test scenario simulation
 */
function testScenario() {
  printHeader('Berg Packet Parser - Real-World Scenario');

  const scenario = createTestScenario();

  printInfo(`Scenario: ${colorize(scenario.name, 'bright')}`);
  printInfo(`Duration: ${scenario.duration}`);
  printInfo(`Description: ${scenario.description}`);

  console.log();

  let stats = {
    totalPours: 0,
    approvedPours: 0,
    deniedPours: 0,
    totalRevenue: 0
  };

  scenario.steps.forEach((step, index) => {
    const packet = createSimulatedPacket(step.plu);
    const result = parsePLUPacket(packet);

    const timeStr = colorize(step.time, 'cyan');
    const brandStr = step.brand.substring(0, 40).padEnd(40);

    stats.totalPours++;

    if (result.valid && step.expectedACK) {
      stats.approvedPours++;
      console.log(`${timeStr} | ${brandStr} | ${colorize('✓ ACK', 'green')}`);
    } else {
      stats.deniedPours++;
      console.log(`${timeStr} | ${brandStr} | ${colorize('✗ NAK', 'red')}`);
    }
  });

  printSection('Scenario Results');
  printInfo(`Total pours:    ${stats.totalPours} (expected: ${scenario.expectedStats.totalPours})`);
  printSuccess(`Approved:       ${stats.approvedPours} (expected: ${scenario.expectedStats.approvedPours})`);
  printError(`Denied:         ${stats.deniedPours} (expected: ${scenario.expectedStats.deniedPours})`);

  const match = stats.totalPours === scenario.expectedStats.totalPours &&
                stats.approvedPours === scenario.expectedStats.approvedPours &&
                stats.deniedPours === scenario.expectedStats.deniedPours;

  if (match) {
    printSuccess('Scenario matches expected results! ');
  } else {
    printWarning('Scenario results differ from expected');
  }
}

/**
 * Test performance
 */
function testPerformance() {
  printHeader('Berg Packet Parser - Performance Test');

  const iterations = 10000;
  const products = getSampleProducts();

  printInfo(`Parsing ${colorize(iterations.toLocaleString(), 'bright')} packets...`);

  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    const product = products[i % products.length];
    const packet = createSimulatedPacket(product.plu);
    const result = parsePLUPacket(packet);

    if (!result.valid) {
      printError(`Unexpected parse failure at iteration ${i}`);
      break;
    }
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  const packetsPerSecond = Math.round((iterations / duration) * 1000);

  printSection('Performance Results');
  printSuccess(`Parsed ${iterations.toLocaleString()} packets in ${colorize(duration + 'ms', 'bright')}`);
  printInfo(`Average: ${colorize(packetsPerSecond.toLocaleString() + ' packets/second', 'bright')}`);
  printInfo(`Per packet: ${colorize((duration / iterations).toFixed(3) + 'ms', 'bright')}`);

  if (packetsPerSecond > 10000) {
    printSuccess('Performance excellent! Well above real-world requirements.');
  } else if (packetsPerSecond > 1000) {
    printSuccess('Performance good. Sufficient for production use.');
  } else {
    printWarning('Performance below expected. May need optimization.');
  }
}

/**
 * Show product catalog
 */
function showProductCatalog() {
  printHeader('Berg Product Catalog (Sample Data)');

  const products = getSampleProducts();
  const categories = [...new Set(products.map(p => p.category))];

  categories.forEach(category => {
    printSection(category);

    const categoryProducts = products.filter(p => p.category === category);
    const brands = [...new Set(categoryProducts.map(p => p.brand))];

    brands.forEach(brand => {
      console.log(`\n  ${colorize(brand, 'bright')}`);

      const brandProducts = categoryProducts.filter(p => p.brand === brand);
      brandProducts.forEach(product => {
        const pluStr = colorize(product.plu.padEnd(5), 'cyan');
        const portionStr = product.portionSize.padEnd(7);
        const ozStr = (product.portionOz + 'oz').padEnd(6);
        const priceStr = colorize('$' + product.price.toFixed(2), 'green');

        console.log(`    PLU ${pluStr} | ${portionStr} | ${ozStr} | ${priceStr}`);
      });
    });
  });

  printSection('Summary');
  printInfo(`Total products: ${colorize(products.length, 'bright')}`);
  printInfo(`Categories:     ${colorize(categories.length, 'bright')} (${categories.join(', ')})`);
  printInfo(`Brands:         ${colorize([...new Set(products.map(p => p.brand))].length, 'bright')}`);
}

/**
 * Main menu
 */
function main() {
  const args = process.argv.slice(2);

  console.clear();

  printHeader('🍸 Berg Packet Parser Test Tool');
  console.log();
  printInfo('Tests Berg serial protocol packet parsing WITHOUT hardware');
  printInfo('Simulates Berg dispensers sending PLU packets to ClubFlow');
  console.log();

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage:');
    console.log('  node backend/scripts/test-berg-parser.js [option]');
    console.log();
    console.log('Options:');
    console.log('  --all           Run all tests');
    console.log('  --packets       Test individual packet parsing');
    console.log('  --errors        Test error handling');
    console.log('  --sequential    Test sequential pours');
    console.log('  --scenario      Test real-world scenario');
    console.log('  --performance   Test parsing performance');
    console.log('  --catalog       Show product catalog');
    console.log('  --help, -h      Show this help');
    console.log();
    return;
  }

  if (args.includes('--packets')) {
    testIndividualPackets();
  } else if (args.includes('--errors')) {
    testCorruptedPackets();
  } else if (args.includes('--sequential')) {
    testSequentialPours();
  } else if (args.includes('--scenario')) {
    testScenario();
  } else if (args.includes('--performance')) {
    testPerformance();
  } else if (args.includes('--catalog')) {
    showProductCatalog();
  } else if (args.includes('--all')) {
    showProductCatalog();
    testIndividualPackets();
    testCorruptedPackets();
    testSequentialPours();
    testScenario();
    testPerformance();
  } else {
    // Default: Run quick demo
    testIndividualPackets();
    testSequentialPours();
  }

  console.log();
  printHeader('✅ Tests Complete');
  printInfo('Run with --help to see all test options');
  console.log();
}

// Run tests
main();
