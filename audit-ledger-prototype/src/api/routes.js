/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Evalon Audit Ledger - REST API Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This module defines the REST API endpoints for the audit ledger service:
 *   - Appending audit events (write path)
 *   - Querying ledger data (read path)
 *   - Verifying ledger integrity
 *   - Session-specific audit trails
 * 
 * ARCHITECTURE:
 * These routes maintain a stable interface that can be backed by:
 *   - In-memory ledger (current implementation)
 *   - File-based persistence
 *   - Database storage (MongoDB, PostgreSQL)
 *   - Distributed ledger / blockchain network
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const { AuditLedger, EventType, EventSeverity } = require('../ledger');
const { EventGenerator } = require('../simulation/eventGenerator');

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════
// LEDGER INSTANCE (Singleton for this prototype)
// ═══════════════════════════════════════════════════════════════════════════

let ledger = new AuditLedger();
let isInitialized = false;

/**
 * Initialize ledger with demo data on first access
 */
function ensureInitialized() {
  if (!isInitialized) {
    console.log('📝 Initializing ledger with sample data...');
    const result = EventGenerator.populateLedger(ledger, 5);
    console.log(`✅ Generated ${result.totalEvents} events across ${result.scenariosGenerated} sessions`);
    isInitialized = true;
  }
  return ledger;
}

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Service identification headers
 */
router.use((req, res, next) => {
  res.setHeader('X-Ledger-Service', 'Evalon-Audit-Ledger');
  res.setHeader('X-Service-Version', '1.0.0');
  next();
});

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH & STATUS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  const currentLedger = ensureInitialized();
  res.json({
    status: 'healthy',
    service: 'evalon-audit-ledger',
    version: '1.0.0',
    ledger: {
      totalRecords: currentLedger.length,
      activeSessions: currentLedger.sessionIds.length,
      isLocked: currentLedger.isLocked
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/status
 * Detailed service status
 */
router.get('/status', (req, res) => {
  const currentLedger = ensureInitialized();
  const stats = currentLedger.getStatistics();
  
  res.json({
    service: 'Evalon Audit Ledger',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    ledger: stats
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// WRITE ENDPOINTS (Append Events)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/events
 * Append a new audit event to the ledger
 * 
 * Body: {
 *   sessionId: string (required)
 *   eventType: string (required)
 *   eventSummary?: string
 *   payload?: object
 * }
 */
router.post('/events', (req, res) => {
  try {
    const currentLedger = ensureInitialized();
    const { sessionId, eventType, eventSummary, payload } = req.body;

    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }
    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'eventType is required'
      });
    }

    // Append event
    const block = currentLedger.appendEvent({
      sessionId,
      eventType,
      eventSummary,
      payload: {
        ...payload,
        _receivedAt: new Date().toISOString()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Event recorded successfully',
      block: {
        index: block.index,
        transactionId: block.transactionId,
        hash: block.hash,
        timestamp: block.timestampISO
      },
      service: 'audit-ledger'
    });
  } catch (error) {
    res.status(error.code === 'IMMUTABILITY_VIOLATION' ? 403 : 500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

/**
 * POST /api/events/batch
 * Append multiple events at once
 */
router.post('/events/batch', (req, res) => {
  try {
    const currentLedger = ensureInitialized();
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'events array is required'
      });
    }

    const results = [];
    for (const event of events) {
      const block = currentLedger.appendEvent(event);
      results.push({
        index: block.index,
        transactionId: block.transactionId,
        hash: block.hash
      });
    }

    res.status(201).json({
      success: true,
      message: `${results.length} events recorded`,
      blocks: results,
      service: 'audit-ledger'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// READ ENDPOINTS (Query Ledger)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/ledger
 * Get the complete ledger
 */
router.get('/ledger', (req, res) => {
  const currentLedger = ensureInitialized();
  const { limit = 100, offset = 0 } = req.query;

  const chain = currentLedger.toJSON();
  const paginatedChain = chain.slice(Number(offset), Number(offset) + Number(limit));

  res.json({
    success: true,
    total: chain.length,
    limit: Number(limit),
    offset: Number(offset),
    blocks: paginatedChain,
    service: 'audit-ledger'
  });
});

/**
 * GET /api/ledger/statistics
 * Get ledger statistics
 */
router.get('/ledger/statistics', (req, res) => {
  const currentLedger = ensureInitialized();
  res.json({
    success: true,
    statistics: currentLedger.getStatistics(),
    service: 'audit-ledger'
  });
});

/**
 * GET /api/blocks/:index
 * Get a specific block by index
 */
router.get('/blocks/:index', (req, res) => {
  const currentLedger = ensureInitialized();
  const index = parseInt(req.params.index, 10);

  const block = currentLedger.getBlock(index);
  if (!block) {
    return res.status(404).json({
      success: false,
      error: `Block ${index} not found`
    });
  }

  res.json({
    success: true,
    block: block.toJSON(),
    service: 'audit-ledger'
  });
});

/**
 * GET /api/blocks/hash/:hash
 * Get a block by its hash
 */
router.get('/blocks/hash/:hash', (req, res) => {
  const currentLedger = ensureInitialized();
  const block = currentLedger.getBlockByHash(req.params.hash);

  if (!block) {
    return res.status(404).json({
      success: false,
      error: 'Block not found with specified hash'
    });
  }

  res.json({
    success: true,
    block: block.toJSON(),
    service: 'audit-ledger'
  });
});

/**
 * GET /api/transactions/:transactionId
 * Get a block by transaction ID
 */
router.get('/transactions/:transactionId', (req, res) => {
  const currentLedger = ensureInitialized();
  const block = currentLedger.getBlockByTransactionId(req.params.transactionId);

  if (!block) {
    return res.status(404).json({
      success: false,
      error: 'Transaction not found'
    });
  }

  res.json({
    success: true,
    block: block.toJSON(),
    service: 'audit-ledger'
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SESSION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/sessions
 * List all sessions in the ledger
 */
router.get('/sessions', (req, res) => {
  const currentLedger = ensureInitialized();
  const sessions = currentLedger.sessionIds.filter(id => id !== 'SYSTEM');

  const sessionSummaries = sessions.map(sessionId => {
    const blocks = currentLedger.getSessionBlocks(sessionId);
    const violations = blocks.filter(b => b.getSeverity() === EventSeverity.VIOLATION);
    const warnings = blocks.filter(b => b.getSeverity() === EventSeverity.WARNING);

    return {
      sessionId,
      eventCount: blocks.length,
      violations: violations.length,
      warnings: warnings.length,
      startTime: blocks[0]?.timestampISO,
      endTime: blocks[blocks.length - 1]?.timestampISO
    };
  });

  res.json({
    success: true,
    total: sessions.length,
    sessions: sessionSummaries,
    service: 'audit-ledger'
  });
});

/**
 * GET /api/sessions/:sessionId
 * Get complete audit trail for a session
 */
router.get('/sessions/:sessionId', (req, res) => {
  const currentLedger = ensureInitialized();
  const auditTrail = currentLedger.getSessionAuditTrail(req.params.sessionId);

  if (!auditTrail) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  res.json({
    success: true,
    auditTrail,
    service: 'audit-ledger'
  });
});

/**
 * GET /api/sessions/:sessionId/timeline
 * Get timeline view for a session
 */
router.get('/sessions/:sessionId/timeline', (req, res) => {
  const currentLedger = ensureInitialized();
  const auditTrail = currentLedger.getSessionAuditTrail(req.params.sessionId);

  if (!auditTrail) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  res.json({
    success: true,
    sessionId: req.params.sessionId,
    timeline: auditTrail.timeline,
    service: 'audit-ledger'
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VIOLATION & FILTER ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/violations
 * Get all violation events
 */
router.get('/violations', (req, res) => {
  const currentLedger = ensureInitialized();
  const violations = currentLedger.getViolations();

  res.json({
    success: true,
    total: violations.length,
    violations: violations.map(v => v.toJSON()),
    service: 'audit-ledger'
  });
});

/**
 * GET /api/events/filter
 * Filter events by type or severity
 * Query params: eventType, severity, sessionId
 */
router.get('/events/filter', (req, res) => {
  const currentLedger = ensureInitialized();
  const { eventType, severity, sessionId } = req.query;

  let blocks = currentLedger.toJSON().slice(1); // Exclude genesis

  if (sessionId) {
    blocks = blocks.filter(b => b.sessionId === sessionId);
  }
  if (eventType) {
    const types = eventType.split(',');
    blocks = blocks.filter(b => types.includes(b.eventType));
  }
  if (severity) {
    const severities = severity.split(',');
    blocks = blocks.filter(b => severities.includes(b.severity));
  }

  res.json({
    success: true,
    total: blocks.length,
    filters: { eventType, severity, sessionId },
    blocks,
    service: 'audit-ledger'
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRITY VERIFICATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/verify
 * Verify complete ledger integrity
 */
router.get('/verify', (req, res) => {
  const currentLedger = ensureInitialized();
  const result = currentLedger.verifyIntegrity();

  res.json({
    success: true,
    verification: result,
    service: 'audit-ledger'
  });
});

/**
 * GET /api/verify/session/:sessionId
 * Verify integrity for a specific session
 */
router.get('/verify/session/:sessionId', (req, res) => {
  const currentLedger = ensureInitialized();
  const { sessionId } = req.params;

  if (!currentLedger.sessionIds.includes(sessionId)) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  const isValid = currentLedger.verifySessionIntegrity(sessionId);

  res.json({
    success: true,
    sessionId,
    integrityValid: isValid,
    checkedAt: new Date().toISOString(),
    service: 'audit-ledger'
  });
});

/**
 * GET /api/verify/block/:index
 * Verify a specific block's hash
 */
router.get('/verify/block/:index', (req, res) => {
  const currentLedger = ensureInitialized();
  const index = parseInt(req.params.index, 10);
  const block = currentLedger.getBlock(index);

  if (!block) {
    return res.status(404).json({
      success: false,
      error: `Block ${index} not found`
    });
  }

  const previousBlock = index > 0 ? currentLedger.getBlock(index - 1) : null;

  res.json({
    success: true,
    blockIndex: index,
    hashValid: block.validateHash(),
    chainLinkValid: block.validateChainLink(previousBlock),
    hash: block.hash,
    previousHash: block.previousHash,
    service: 'audit-ledger'
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT & MANAGEMENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/export
 * Export the complete ledger
 */
router.get('/export', (req, res) => {
  const currentLedger = ensureInitialized();
  const exportData = currentLedger.export();

  res.setHeader('Content-Disposition', `attachment; filename=audit-ledger-${Date.now()}.json`);
  res.json(exportData);
});

/**
 * POST /api/reset
 * Reset the ledger with fresh data
 */
router.post('/reset', (req, res) => {
  console.log('🔄 Resetting ledger...');
  ledger = new AuditLedger();
  isInitialized = false;
  
  // Re-initialize with fresh data
  ensureInitialized();

  res.json({
    success: true,
    message: 'Ledger reset successfully',
    service: 'audit-ledger'
  });
});

/**
 * POST /api/generate
 * Generate additional test scenarios
 */
router.post('/generate', (req, res) => {
  const currentLedger = ensureInitialized();
  const { count = 1, type = 'random' } = req.body;

  const types = ['normal', 'suspicious', 'violation', 'intermittent'];
  const scenarios = [];

  for (let i = 0; i < Math.min(count, 10); i++) {
    const scenarioType = type === 'random' 
      ? types[Math.floor(Math.random() * types.length)]
      : type;
    
    const scenario = EventGenerator.generateScenario(scenarioType);
    scenarios.push(scenario.scenario);

    for (const event of scenario.events) {
      currentLedger.appendEvent(event);
    }
  }

  res.status(201).json({
    success: true,
    message: `Generated ${scenarios.length} new scenario(s)`,
    scenarios,
    newTotal: currentLedger.length,
    service: 'audit-ledger'
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TYPES REFERENCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/reference/event-types
 * List all supported event types
 */
router.get('/reference/event-types', (req, res) => {
  res.json({
    success: true,
    eventTypes: Object.entries(EventType).map(([key, value]) => ({
      name: key,
      value,
      category: getCategoryForEvent(value)
    })),
    severityLevels: Object.values(EventSeverity),
    service: 'audit-ledger'
  });
});

/**
 * Helper to categorize events
 */
function getCategoryForEvent(eventType) {
  if (eventType.startsWith('session_')) return 'session';
  if (eventType.includes('face') || eventType.includes('faces')) return 'face_detection';
  if (eventType.startsWith('behavior_')) return 'behavior';
  if (eventType.startsWith('credibility_')) return 'credibility';
  if (eventType.includes('question') || eventType.includes('answer') || eventType.includes('exam')) return 'exam';
  if (['tab_switch', 'window_blur', 'copy_attempt', 'paste_attempt', 'right_click', 'keyboard_shortcut'].includes(eventType)) return 'security';
  return 'system';
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = router;
