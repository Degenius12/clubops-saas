// Berg POS Integration API — Feature #48
// Liquor dispenser configuration, PLU catalog, and pour log access.
//
// Hardware wiring (serialport / TCP) is a future task — this session
// ships the software API and SIMULATOR mode so the UI can be demoed
// without real Berg equipment.

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const { processPour } = require('../services/bergIntegrationService');
const { getSampleProducts } = require('../services/berg/bergSimulator');

const router = express.Router();
const prisma = new PrismaClient();

// ==============================================
// CONFIGURATION
// ==============================================

router.get('/config', auth, authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'), async (req, res) => {
  try {
    const clubId = req.user.clubId;
    let config = await prisma.bergConfiguration.findUnique({ where: { clubId } });
    if (!config) {
      config = await prisma.bergConfiguration.create({
        data: { clubId, connectionType: 'SIMULATOR' }
      });
    }
    res.json(config);
  } catch (err) {
    console.error('[Berg] GET /config failed:', err);
    res.status(500).json({ error: 'Failed to load Berg configuration' });
  }
});

router.put('/config', auth, authorize('OWNER', 'SUPER_MANAGER'), async (req, res) => {
  try {
    const clubId = req.user.clubId;
    const { connectionType, comPort, ipAddress, tcpPort, pourWithRelease, ackTimeoutMs } = req.body;

    const allowedTypes = ['USB', 'ETHERNET', 'SIMULATOR'];
    if (connectionType && !allowedTypes.includes(connectionType)) {
      return res.status(400).json({ error: `connectionType must be one of ${allowedTypes.join(', ')}` });
    }

    const config = await prisma.bergConfiguration.upsert({
      where: { clubId },
      update: {
        ...(connectionType !== undefined && { connectionType }),
        ...(comPort !== undefined && { comPort }),
        ...(ipAddress !== undefined && { ipAddress }),
        ...(tcpPort !== undefined && { tcpPort }),
        ...(pourWithRelease !== undefined && { pourWithRelease }),
        ...(ackTimeoutMs !== undefined && { ackTimeoutMs })
      },
      create: {
        clubId,
        connectionType: connectionType || 'SIMULATOR',
        comPort, ipAddress, tcpPort,
        pourWithRelease: pourWithRelease ?? true,
        ackTimeoutMs: ackTimeoutMs ?? 5000
      }
    });
    res.json(config);
  } catch (err) {
    console.error('[Berg] PUT /config failed:', err);
    res.status(500).json({ error: 'Failed to save Berg configuration' });
  }
});

router.get('/status', auth, authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'), async (req, res) => {
  try {
    const clubId = req.user.clubId;
    const [config, productCount, last24h] = await Promise.all([
      prisma.bergConfiguration.findUnique({ where: { clubId } }),
      prisma.bergProduct.count({ where: { clubId, active: true } }),
      prisma.bergPourLog.count({
        where: { clubId, pourTime: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      })
    ]);
    res.json({
      connectionType: config?.connectionType || 'SIMULATOR',
      isConnected: config?.isConnected ?? false,
      lastConnectedAt: config?.lastConnectedAt ?? null,
      lastError: config?.lastError ?? null,
      productCount,
      poursLast24h: last24h
    });
  } catch (err) {
    console.error('[Berg] GET /status failed:', err);
    res.status(500).json({ error: 'Failed to load Berg status' });
  }
});

// ==============================================
// PRODUCT CATALOG (PLU MAPPING)
// ==============================================

router.get('/products', auth, authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'), async (req, res) => {
  try {
    const products = await prisma.bergProduct.findMany({
      where: { clubId: req.user.clubId },
      orderBy: [{ brandName: 'asc' }, { portionOz: 'asc' }]
    });
    res.json(products);
  } catch (err) {
    console.error('[Berg] GET /products failed:', err);
    res.status(500).json({ error: 'Failed to load Berg products' });
  }
});

router.post('/products', auth, authorize('OWNER', 'SUPER_MANAGER'), async (req, res) => {
  try {
    const clubId = req.user.clubId;
    const { plu, brandName, portionSize, portionOz, price, category } = req.body;
    if (!plu || !brandName || !portionSize || portionOz == null || price == null) {
      return res.status(400).json({ error: 'plu, brandName, portionSize, portionOz, price are required' });
    }
    const product = await prisma.bergProduct.create({
      data: { clubId, plu: String(plu), brandName, portionSize, portionOz, price, category: category || 'LIQUOR' }
    });
    res.status(201).json(product);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A product with that PLU already exists for this club' });
    }
    console.error('[Berg] POST /products failed:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/products/:id', auth, authorize('OWNER', 'SUPER_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const clubId = req.user.clubId;
    const existing = await prisma.bergProduct.findFirst({ where: { id, clubId } });
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const { brandName, portionSize, portionOz, price, category, active } = req.body;
    const product = await prisma.bergProduct.update({
      where: { id },
      data: {
        ...(brandName !== undefined && { brandName }),
        ...(portionSize !== undefined && { portionSize }),
        ...(portionOz !== undefined && { portionOz }),
        ...(price !== undefined && { price }),
        ...(category !== undefined && { category }),
        ...(active !== undefined && { active })
      }
    });
    res.json(product);
  } catch (err) {
    console.error('[Berg] PUT /products/:id failed:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/products/:id', auth, authorize('OWNER', 'SUPER_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const clubId = req.user.clubId;
    const existing = await prisma.bergProduct.findFirst({ where: { id, clubId } });
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    // Soft delete — keep pour log history intact
    await prisma.bergProduct.update({ where: { id }, data: { active: false } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Berg] DELETE /products/:id failed:', err);
    res.status(500).json({ error: 'Failed to remove product' });
  }
});

// Bulk CSV import: rows { plu, brandName, portionSize, portionOz, price, category? }
router.post('/products/bulk', auth, authorize('OWNER', 'SUPER_MANAGER'), async (req, res) => {
  try {
    const clubId = req.user.clubId;
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'rows must be a non-empty array' });
    }

    const results = { created: 0, updated: 0, errors: [] };
    for (const row of rows) {
      try {
        const { plu, brandName, portionSize, portionOz, price, category } = row;
        if (!plu || !brandName || !portionSize || portionOz == null || price == null) {
          results.errors.push({ plu: plu || '(missing)', reason: 'missing required field' });
          continue;
        }
        const res = await prisma.bergProduct.upsert({
          where: { clubId_plu: { clubId, plu: String(plu) } },
          update: { brandName, portionSize, portionOz, price, category: category || 'LIQUOR', active: true },
          create: { clubId, plu: String(plu), brandName, portionSize, portionOz, price, category: category || 'LIQUOR' }
        });
        if (res.createdAt.getTime() === res.updatedAt.getTime()) results.created += 1;
        else results.updated += 1;
      } catch (err) {
        results.errors.push({ plu: row.plu, reason: err.message });
      }
    }
    res.json(results);
  } catch (err) {
    console.error('[Berg] POST /products/bulk failed:', err);
    res.status(500).json({ error: 'Failed to bulk-import products' });
  }
});

// Seed the sample product set from the simulator (convenience for demos)
router.post('/products/seed-samples', auth, authorize('OWNER', 'SUPER_MANAGER'), async (req, res) => {
  try {
    const clubId = req.user.clubId;
    const samples = getSampleProducts();
    let created = 0, skipped = 0;
    for (const s of samples) {
      const existing = await prisma.bergProduct.findUnique({
        where: { clubId_plu: { clubId, plu: s.plu } }
      });
      if (existing) { skipped += 1; continue; }
      await prisma.bergProduct.create({
        data: {
          clubId,
          plu: s.plu,
          brandName: s.brand,
          portionSize: s.portion,
          portionOz: s.oz,
          price: s.price,
          category: 'LIQUOR'
        }
      });
      created += 1;
    }
    res.json({ created, skipped });
  } catch (err) {
    console.error('[Berg] seed-samples failed:', err);
    res.status(500).json({ error: 'Failed to seed sample products' });
  }
});

// ==============================================
// POURS (history + simulator trigger)
// ==============================================

router.get('/pours', auth, authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'), async (req, res) => {
  try {
    const clubId = req.user.clubId;
    const { limit = 100, authorized } = req.query;
    const where = { clubId };
    if (authorized === 'true') where.authorized = true;
    if (authorized === 'false') where.authorized = false;

    const pours = await prisma.bergPourLog.findMany({
      where,
      include: { bergProduct: { select: { brandName: true, portionSize: true, price: true } } },
      orderBy: { pourTime: 'desc' },
      take: Math.min(parseInt(limit, 10) || 100, 500)
    });
    res.json(pours);
  } catch (err) {
    console.error('[Berg] GET /pours failed:', err);
    res.status(500).json({ error: 'Failed to load pour log' });
  }
});

// Simulator: fire a pour against the catalog. Intended for demos + UI development.
router.post('/simulate-pour', auth, authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'), async (req, res) => {
  try {
    const clubId = req.user.clubId;
    const { plu } = req.body;
    if (!plu) return res.status(400).json({ error: 'plu is required' });

    const io = req.app.get('io'); // set in server.js
    const result = await processPour({
      clubId,
      plu: String(plu),
      source: 'SIMULATOR',
      bartenderId: req.user.id,
      io
    });
    res.json(result);
  } catch (err) {
    console.error('[Berg] simulate-pour failed:', err);
    res.status(500).json({ error: 'Failed to simulate pour' });
  }
});

// ==============================================
// RECONCILIATION (variance report)
// ==============================================

router.get('/variance', auth, authorize('OWNER', 'SUPER_MANAGER'), async (req, res) => {
  try {
    const clubId = req.user.clubId;
    const { from, to } = req.query;
    const since = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const until = to ? new Date(to) : new Date();

    const grouped = await prisma.bergPourLog.groupBy({
      by: ['plu', 'authorized', 'wasRungUp'],
      where: { clubId, pourTime: { gte: since, lte: until } },
      _count: { _all: true }
    });

    // Reshape to per-PLU summary
    const byPlu = {};
    for (const row of grouped) {
      const bucket = byPlu[row.plu] || (byPlu[row.plu] = { plu: row.plu, pours: 0, authorized: 0, denied: 0, rungUp: 0, notRungUp: 0 });
      bucket.pours += row._count._all;
      if (row.authorized) bucket.authorized += row._count._all;
      else bucket.denied += row._count._all;
      if (row.wasRungUp) bucket.rungUp += row._count._all;
      else bucket.notRungUp += row._count._all;
    }

    // Enrich with product metadata
    const plus = Object.keys(byPlu);
    const products = plus.length
      ? await prisma.bergProduct.findMany({ where: { clubId, plu: { in: plus } } })
      : [];
    const productByPlu = Object.fromEntries(products.map(p => [p.plu, p]));

    const rows = Object.values(byPlu).map(b => ({
      ...b,
      brandName: productByPlu[b.plu]?.brandName ?? null,
      portionSize: productByPlu[b.plu]?.portionSize ?? null,
      variance: b.authorized - b.rungUp
    })).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

    res.json({ from: since, to: until, rows });
  } catch (err) {
    console.error('[Berg] GET /variance failed:', err);
    res.status(500).json({ error: 'Failed to compute variance report' });
  }
});

module.exports = router;
