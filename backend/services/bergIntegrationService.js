/**
 * Berg Integration Service (Feature #48)
 *
 * Validates incoming PLU pour requests against the BergProduct catalog,
 * decides ACK/NAK, writes BergPourLog entries, and emits a socket event
 * so the UI can show real-time pour activity.
 *
 * Connection types:
 *   - SIMULATOR: generate pours from backend/services/berg/bergSimulator.js
 *   - USB / ETHERNET: real hardware (serial service not wired in this session)
 *
 * @see docs/BERG_INTEGRATION_TECHNICAL_SPEC.md
 */

const { PrismaClient } = require('@prisma/client');
const { parsePLUPacket, isValidPLU } = require('./berg/bergPacketParser');

const prisma = new PrismaClient();

/**
 * Core decision: given a PLU + club, should we ACK or NAK?
 *
 * @param {Object} args
 * @param {string} args.clubId
 * @param {string} args.plu
 * @param {string} [args.source]        "HARDWARE" | "SIMULATOR"
 * @param {string} [args.bartenderId]
 * @param {import('socket.io').Server} [args.io]  optional, for real-time event
 * @returns {Promise<{ authorized: boolean, reason?: string, product?: object, logId: string }>}
 */
async function processPour({ clubId, plu, source = 'HARDWARE', bartenderId, io }) {
  if (!isValidPLU(plu)) {
    const log = await prisma.bergPourLog.create({
      data: { clubId, plu, authorized: false, reason: 'INVALID_PLU_FORMAT', source, bartenderId }
    });
    emitPourEvent(io, clubId, { ...log, brandName: null, portionSize: null });
    return { authorized: false, reason: 'INVALID_PLU_FORMAT', logId: log.id };
  }

  const product = await prisma.bergProduct.findUnique({
    where: { clubId_plu: { clubId, plu } }
  });

  if (!product || !product.active) {
    const log = await prisma.bergPourLog.create({
      data: {
        clubId, plu,
        authorized: false,
        reason: product ? 'PRODUCT_INACTIVE' : 'PLU_NOT_FOUND',
        source,
        bartenderId
      }
    });
    emitPourEvent(io, clubId, { ...log, brandName: product?.brandName ?? null, portionSize: product?.portionSize ?? null });
    return { authorized: false, reason: log.reason, logId: log.id };
  }

  const log = await prisma.bergPourLog.create({
    data: {
      clubId,
      plu,
      bergProductId: product.id,
      authorized: true,
      source,
      bartenderId
    }
  });
  emitPourEvent(io, clubId, { ...log, brandName: product.brandName, portionSize: product.portionSize });
  return { authorized: true, product, logId: log.id };
}

/**
 * Parse an incoming Berg serial packet and route to processPour.
 * Used by the (future) serial service; exposed for test tooling.
 */
async function processPacket({ clubId, packet, source = 'HARDWARE', bartenderId, io }) {
  const parsed = parsePLUPacket(packet);
  if (!parsed.valid) {
    return { authorized: false, reason: parsed.error || 'PACKET_INVALID' };
  }
  return processPour({ clubId, plu: parsed.plu, source, bartenderId, io });
}

function emitPourEvent(io, clubId, pour) {
  if (!io) return;
  try {
    io.to(`club:${clubId}`).emit('berg:pour', pour);
  } catch (err) {
    console.error('[Berg] Socket emit failed:', err.message);
  }
}

module.exports = {
  processPour,
  processPacket
};
